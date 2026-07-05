import z from "zod";
import {
  assignTeamLeaderSchema,
  hubTaskSchema,
  updateHubTaskStatusSchema,
  updateMeetingUrlSchema,
} from "~/lib/schemaValidation";
import { tryCatchWrapper } from "~/lib/tryCatchWrapper";
import logger from "../config/logger";
import Cohort from "../model/cohort";
import HubTask from "../model/hubTask";
import HubTeam from "../model/hubTeam";
import Project from "../model/project";
import Stage from "../model/stage";
import StageProgress from "../model/stageProgress";
import Task from "../model/task";
import User from "../model/user";
import { AuditLogService } from "../services/auditlog.service";
import { auth } from "../services/better-auth";
import { NotificationService } from "../services/notification.service";
import { fetchWithCache, invalidateCache } from "../utils/cache";
import { checkRateLimit } from "../utils/rate-limit";

const QUALIFICATION_THRESHOLD = 70;
const STAGE5_ORDER = 5;

/**
 * Checks if a user qualifies for Hub access.
 * Qualification: Average score across stages 1–4 is >= 70%.
 */
export async function checkHubQualification(
  userId: string,
  cohortIdOrName: string,
): Promise<{ isQualified: boolean; averageScore: number }> {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(cohortIdOrName);
  const cohortDoc = isObjectId
    ? await Cohort.findById(cohortIdOrName).lean()
    : await Cohort.findOne({ cohort: cohortIdOrName }).lean();

  if (!cohortDoc) return { isQualified: false, averageScore: 0 };

  // Find the project for this cohort (any status — we need stages 1-4 to evaluate qualification)
  const project = await Project.findOne({
    cohort: cohortDoc._id,
  }).lean();

  if (!project) return { isQualified: false, averageScore: 0 };

  // Get stages 1–4 for the project
  const stages = await Stage.find({
    project: project._id,
    order: { $in: [1, 2, 3, 4] },
  })
    .lean()
    .select("_id order");

  if (stages.length === 0) return { isQualified: false, averageScore: 0 };

  const stageIds = stages.map((s) => s._id);
  const progressRecords = await StageProgress.find({
    user: userId,
    stage: { $in: stageIds },
  }).lean();

  if (progressRecords.length === 0) return { isQualified: false, averageScore: 0 };

  // Must have reached Stage 4 (have a non-locked StageProgress for the stage with order 4)
  const stage4 = stages.find((s) => s.order === 4);
  const stage4Progress = stage4
    ? progressRecords.find((p) => p.stage.toString() === stage4._id.toString())
    : null;
  if (!stage4Progress || stage4Progress.status === "locked") {
    return { isQualified: false, averageScore: 0 };
  }

  const totalScore = progressRecords.reduce((acc, p) => acc + (p.totalScore ?? 0), 0);
  const totalMax = progressRecords.reduce((acc, p) => acc + (p.maxPossibleScore ?? 0), 0);

  const averageScore = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
  const isQualified = averageScore >= QUALIFICATION_THRESHOLD;

  return { isQualified, averageScore };
}

/**
 * Fetch or create a HubTeam for a cohort's Stage 5.
 */
async function getOrCreateHubTeam(cohortId: string, stage5Id: string) {
  let hubTeam = await HubTeam.findOne({ cohort: cohortId })
    .populate("teamLeader", "_id name email image")
    .populate("members", "_id name email image")
    .lean();

  if (!hubTeam) {
    const created = await HubTeam.create({
      cohort: cohortId,
      stage5: stage5Id,
      members: [],
    });
    hubTeam = await HubTeam.findById(created._id)
      .populate("teamLeader", "_id name email image")
      .populate("members", "_id name email image")
      .lean();
  }

  return hubTeam;
}

/**
 * Main loader for the Hub page.
 * Returns qualification status, hub team, tasks, members, and Stage 5 brief.
 */
export async function fetchHubData(request: Request) {
  return tryCatchWrapper(async () => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { user } = session;
    const isAdmin =
      user.role === "admin" || user.role === "super_admin";

    // Find user's cohort
    const dbUser = await User.findById(user.id).lean().select("cohort role");
    if (!dbUser?.cohort && !isAdmin) {
      return Response.json({
        success: true,
        body: {
          isQualified: false,
          isTeamLeader: false,
          isAdmin,
          hubTeam: null,
          tasks: [],
          members: [],
          stage5Task: null,
          stage5Deadline: null,
        },
      });
    }

    let cohortDoc = null;
    if (dbUser?.cohort) {
      cohortDoc = await Cohort.findOne({ cohort: dbUser.cohort }).lean();
    } else if (isAdmin) {
      cohortDoc = await Cohort.findOne({ status: "active" }).lean();
    }

    if (!cohortDoc) {
      return Response.json({
        success: true,
        body: {
          isQualified: isAdmin,
          isTeamLeader: false,
          isAdmin,
          hubTeam: null,
          tasks: [],
          members: [],
          stage5Task: null,
          stage5Deadline: null,
        },
      });
    }
    const cohortId = cohortDoc._id.toString();

    const cacheKey = `hub:data:${cohortId}`;
    const hubData = await fetchWithCache(cacheKey, 600, async () => {
      // Get project for cohort (any status — qualification uses stages 1-4)
      const project = await Project.findOne({
        cohort: cohortId,
      }).lean();

      // Get Stage 5 for the project
      const stage5 = project
        ? await Stage.findOne({ project: project._id, order: STAGE5_ORDER }).lean()
        : null;

      // Get Stage 5 task brief
      const stage5Task = stage5
        ? await Task.findOne({ stage: stage5._id }).lean().select("_id title description instructions dueDate maxScore")
        : null;

      // Get qualified members for the cohort
      const cohortDoc = await Cohort.findById(cohortId).lean().select("members");
      const memberIds = cohortDoc?.members ?? [];

      // Check qualification for all members (uses project directly, not stage5)
      const qualifiedMemberIds: string[] = [];
      if (project && memberIds.length > 0) {
        const stages = await Stage.find({
          project: project._id,
          order: { $in: [1, 2, 3, 4] },
        }).lean().select("_id order");

        const stageIds = stages.map((s) => s._id);
        const stage4Id = stages.find((s) => s.order === 4)?._id;

        const allProgress = await StageProgress.find({
          user: { $in: memberIds },
          stage: { $in: stageIds },
        }).lean();

        // Group by user and find Stage 4 progress
        const byUser: Record<string, { total: number; max: number; stage4Status?: string }> = {};
        for (const p of allProgress) {
          const uid = p.user.toString();
          if (!byUser[uid]) byUser[uid] = { total: 0, max: 0 };
          byUser[uid].total += p.totalScore ?? 0;
          byUser[uid].max += p.maxPossibleScore ?? 0;
          if (stage4Id && p.stage.toString() === stage4Id.toString()) {
            byUser[uid].stage4Status = p.status;
          }
        }

        for (const [uid, { total, max, stage4Status }] of Object.entries(byUser)) {
          const reachedStage4 = stage4Id && stage4Status && stage4Status !== "locked";
          if (!reachedStage4) continue;
          const avg = max > 0 ? (total / max) * 100 : 0;
          if (avg >= QUALIFICATION_THRESHOLD) qualifiedMemberIds.push(uid);
        }
      }

      const qualifiedMembers = await User.find({
        _id: { $in: qualifiedMemberIds },
      }).lean().select("_id name email image");

      return {
        project,
        stage5,
        stage5Task,
        qualifiedMembers,
      };
    });

    // Get or create HubTeam
    const stage5Id = hubData.stage5?._id?.toString();
    const hubTeam = stage5Id
      ? await getOrCreateHubTeam(cohortId, stage5Id)
      : null;

    // Sync qualified members into the team
    if (hubTeam && hubData.qualifiedMembers.length > 0) {
      const existingMemberIds = new Set(
        (hubTeam.members as any[]).map((m: any) =>
          typeof m === "object" ? m._id.toString() : m.toString(),
        ),
      );
      const newIds = hubData.qualifiedMembers
        .filter((m) => !existingMemberIds.has(m._id.toString()))
        .map((m) => m._id);

      if (newIds.length > 0) {
        await HubTeam.findByIdAndUpdate(hubTeam._id, {
          $addToSet: { members: { $each: newIds } },
        });
        await invalidateCache(`hub:data:${cohortId}`);
      }
    }

    // Fetch hub tasks
    const tasks = hubTeam
      ? await HubTask.find({ hubTeam: hubTeam._id })
          .populate("assignedTo", "_id name email image")
          .populate("createdBy", "_id name email image")
          .sort({ createdAt: -1 })
          .lean()
      : [];

    // Determine if current user is team leader
    const teamLeaderObj = hubTeam?.teamLeader as any;
    const teamLeaderId = teamLeaderObj
      ? typeof teamLeaderObj === "object"
        ? teamLeaderObj._id?.toString()
        : teamLeaderObj.toString()
      : null;
    const isTeamLeader = teamLeaderId === user.id;

    // Check qualification for the current user
    let isQualified = isAdmin;
    if (!isAdmin && dbUser?.cohort) {
      const { isQualified: q } = await checkHubQualification(user.id, cohortId);
      isQualified = q;
    }

    const stage5Deadline = hubData.stage5Task?.dueDate
      ? new Date(hubData.stage5Task.dueDate).toISOString()
      : null;

    return Response.json({
      success: true,
      body: {
        isQualified,
        isTeamLeader,
        isAdmin,
        hubTeam: hubTeam ?? null,
        tasks,
        members: hubData.qualifiedMembers,
        stage5Task: hubData.stage5Task ?? null,
        stage5Deadline,
      },
    });
  });
}

/**
 * Admin: Assign a team leader for a cohort's Hub.
 */
export async function assignTeamLeader(
  request: Request,
  payload: unknown,
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const { user: sessionUser } = session;
    if (sessionUser.role !== "admin" && sessionUser.role !== "super_admin") {
      return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const parsed = assignTeamLeaderSchema.safeParse(payload);
    if (!parsed.success) {
      return Response.json(
        { success: false, message: "Invalid data", errors: z.treeifyError(parsed.error) },
        { status: 400 },
      );
    }

    const { userId, cohortId } = parsed.data;

    const targetUser = await User.findById(userId).lean().select("_id name");
    if (!targetUser) {
      return Response.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const hubTeam = await HubTeam.findOneAndUpdate(
      { cohort: cohortId },
      { $set: { teamLeader: userId } },
      { new: true },
    ).lean();

    if (!hubTeam) {
      return Response.json(
        { success: false, message: "Hub team not found for this cohort" },
        { status: 404 },
      );
    }

    await invalidateCache(`hub:data:${cohortId}`);

    await NotificationService.send({
      userId,
      type: "hub_team_leader_assigned",
      title: "You've been assigned as Team Leader",
      message: "An admin has assigned you as the Team Leader for Stage 5. You can now create and assign tasks to your team.",
    });

    await AuditLogService.record(request, {
      action: "ASSIGN_TEAM_LEADER",
      category: "settings",
      details: { targetUserId: userId, cohortId },
      status: "success",
    });

    logger.info({ userId, cohortId }, "Team leader assigned");

    return Response.json({
      success: true,
      message: `${targetUser.name} has been assigned as Team Leader`,
    });
  });
}

/**
 * Team Leader / Admin: Create a new Hub task.
 */
export async function createHubTask(request: Request, payload: unknown) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "general");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { user: sessionUser } = session;
    const dbUser = await User.findById(sessionUser.id).lean().select("cohort role");
    const isAdmin = sessionUser.role === "admin" || sessionUser.role === "super_admin";

    const parsed = hubTaskSchema.safeParse(payload);
    if (!parsed.success) {
      return Response.json(
        { success: false, message: "Invalid data", errors: z.treeifyError(parsed.error) },
        { status: 400 },
      );
    }

    let cohortDoc = null;
    if (dbUser?.cohort) {
      cohortDoc = await Cohort.findOne({ cohort: dbUser.cohort }).lean();
    } else if (isAdmin) {
      cohortDoc = await Cohort.findOne({ status: "active" }).lean();
    }

    if (!cohortDoc) {
      return Response.json({ success: false, message: "No active cohort found" }, { status: 400 });
    }
    const cohortId = cohortDoc._id.toString();

    const hubTeam = await HubTeam.findOne({ cohort: cohortId }).lean();
    if (!hubTeam) {
      return Response.json({ success: false, message: "Hub team not found" }, { status: 404 });
    }

    // Only team leader or admin can create tasks
    const teamLeaderId = hubTeam.teamLeader?.toString();
    if (!isAdmin && teamLeaderId !== sessionUser.id) {
      return Response.json({ success: false, message: "Only the team leader can create tasks" }, { status: 403 });
    }

    const task = await HubTask.create({
      hubTeam: hubTeam._id,
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      assignedTo: parsed.data.assignedTo ?? [],
      createdBy: sessionUser.id,
      status: "todo",
    });

    // Notify assigned members
    for (const memberId of parsed.data.assignedTo ?? []) {
      if (memberId !== sessionUser.id) {
        await NotificationService.send({
          userId: memberId,
          type: "hub_task_assigned",
          title: "You've been assigned a Hub task",
          message: `"${parsed.data.title}" has been assigned to you by the team leader.`,
          metadata: { taskId: task._id.toString() },
        });
      }
    }

    await invalidateCache(`hub:tasks:${cohortId}`);

    return Response.json({ success: true, message: "Task created", body: task });
  });
}

/**
 * Team Leader / Admin: Update a Hub task.
 */
export async function updateHubTask(request: Request, payload: unknown) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "general");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { user: sessionUser } = session;
    const isAdmin = sessionUser.role === "admin" || sessionUser.role === "super_admin";

    const { taskId, ...rest } = payload as { taskId: string } & Record<string, unknown>;
    if (!taskId) {
      return Response.json({ success: false, message: "Task ID is required" }, { status: 400 });
    }

    const parsed = hubTaskSchema.partial().safeParse(rest);
    if (!parsed.success) {
      return Response.json(
        { success: false, message: "Invalid data", errors: z.treeifyError(parsed.error) },
        { status: 400 },
      );
    }

    const task = await HubTask.findById(taskId).populate("hubTeam").lean();
    if (!task) {
      return Response.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    const hubTeam = await HubTeam.findById(task.hubTeam).lean();
    const teamLeaderId = hubTeam?.teamLeader?.toString();

    if (!isAdmin && teamLeaderId !== sessionUser.id) {
      return Response.json({ success: false, message: "Only the team leader can update tasks" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.dueDate) {
      updateData.dueDate = new Date(parsed.data.dueDate as string);
    }

    const updated = await HubTask.findByIdAndUpdate(
      taskId,
      { $set: updateData },
      { new: true },
    )
      .populate("assignedTo", "_id name email image")
      .populate("createdBy", "_id name email image")
      .lean();

    // Notify newly assigned members
    const prevAssigned = new Set((task.assignedTo ?? []).map((id: any) => id.toString()));
    for (const memberId of (parsed.data.assignedTo ?? []) as string[]) {
      if (!prevAssigned.has(memberId) && memberId !== sessionUser.id) {
        await NotificationService.send({
          userId: memberId,
          type: "hub_task_assigned",
          title: "You've been assigned a Hub task",
          message: `"${parsed.data.title ?? task.title}" has been assigned to you.`,
          metadata: { taskId },
        });
      }
    }

    return Response.json({ success: true, message: "Task updated", body: updated });
  });
}

/**
 * Any member: Update their own task status (e.g. move columns).
 */
export async function updateHubTaskStatus(request: Request, payload: unknown) {
  return tryCatchWrapper(async () => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const parsed = updateHubTaskStatusSchema.safeParse(payload);
    if (!parsed.success) {
      return Response.json(
        { success: false, message: "Invalid data", errors: z.treeifyError(parsed.error) },
        { status: 400 },
      );
    }

    const { taskId, status } = parsed.data;
    const task = await HubTask.findById(taskId).lean();
    if (!task) {
      return Response.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    const isAdmin = session.user.role === "admin" || session.user.role === "super_admin";
    const isAssigned = (task.assignedTo ?? []).some(
      (id: any) => id.toString() === session.user.id,
    );
    const hubTeam = await HubTeam.findById(task.hubTeam).lean();
    const isTeamLeader = hubTeam?.teamLeader?.toString() === session.user.id;

    if (!isAdmin && !isAssigned && !isTeamLeader) {
      return Response.json({ success: false, message: "You are not assigned to this task" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "done") updateData.completedAt = new Date();
    else updateData.completedAt = null;

    const updated = await HubTask.findByIdAndUpdate(
      taskId,
      { $set: updateData },
      { new: true },
    )
      .populate("assignedTo", "_id name email image")
      .populate("createdBy", "_id name email image")
      .lean();

    return Response.json({ success: true, message: "Status updated", body: updated });
  });
}

/**
 * Team Leader / Admin: Delete a Hub task.
 */
export async function deleteHubTask(request: Request, payload: unknown) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = payload as { taskId: string };
    if (!taskId) {
      return Response.json({ success: false, message: "Task ID is required" }, { status: 400 });
    }

    const task = await HubTask.findById(taskId).lean();
    if (!task) {
      return Response.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    const isAdmin = session.user.role === "admin" || session.user.role === "super_admin";
    const hubTeam = await HubTeam.findById(task.hubTeam).lean();
    const isTeamLeader = hubTeam?.teamLeader?.toString() === session.user.id;

    if (!isAdmin && !isTeamLeader) {
      return Response.json({ success: false, message: "Only the team leader can delete tasks" }, { status: 403 });
    }

    await HubTask.findByIdAndDelete(taskId);

    return Response.json({ success: true, message: "Task deleted" });
  });
}

/**
 * Team Leader / Admin: Update the team's meeting URL.
 */
export async function updateMeetingUrl(request: Request, payload: unknown) {
  return tryCatchWrapper(async () => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { user: sessionUser } = session;
    const isAdmin = sessionUser.role === "admin" || sessionUser.role === "super_admin";

    const parsed = updateMeetingUrlSchema.safeParse(payload);
    if (!parsed.success) {
      return Response.json(
        { success: false, message: "Invalid URL", errors: z.treeifyError(parsed.error) },
        { status: 400 },
      );
    }

    const dbUser = await User.findById(sessionUser.id).lean().select("cohort");
    let cohortDoc = null;
    if (dbUser?.cohort) {
      cohortDoc = await Cohort.findOne({ cohort: dbUser.cohort }).lean();
    } else if (isAdmin) {
      cohortDoc = await Cohort.findOne({ status: "active" }).lean();
    }

    if (!cohortDoc) {
      return Response.json({ success: false, message: "No active cohort found" }, { status: 400 });
    }
    const cohortId = cohortDoc._id.toString();

    const hubTeam = await HubTeam.findOne({ cohort: cohortId }).lean();
    if (!hubTeam) {
      return Response.json({ success: false, message: "Hub team not found" }, { status: 404 });
    }

    const isTeamLeader = hubTeam.teamLeader?.toString() === sessionUser.id;
    if (!isAdmin && !isTeamLeader) {
      return Response.json({ success: false, message: "Only the team leader or admin can update the meeting URL" }, { status: 403 });
    }

    await HubTeam.findByIdAndUpdate(hubTeam._id, {
      $set: { meetingUrl: parsed.data.meetingUrl ?? "" },
    });

    if (cohortId) await invalidateCache(`hub:data:${cohortId}`);

    return Response.json({ success: true, message: "Meeting URL updated" });
  });
}
