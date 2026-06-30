import z from "zod";
import { taskSchema } from "~/lib/schemaValidation";
import { tryCatchWrapper } from "~/lib/tryCatchWrapper";
import type {
  StageData,
  StageProgressData,
  StageWithData,
  TaskData,
  TaskSchemaType,
  TasksPageData,
} from "~/types";
import logger from "../config/logger";
import Cohort from "../model/cohort";
import Project from "../model/project";
import Stage from "../model/stage";
import StageProgress from "../model/stageProgress";
import Submission from "../model/submission";
import Task from "../model/task";
import User from "../model/user";
import { AuditLogService } from "../services/auditlog.service";
import { auth } from "../services/better-auth";
import { fetchWithCache, invalidateCache } from "../utils/cache";
import { checkRateLimit } from "../utils/rate-limit";

export async function fetchTasksData(request: Request) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "general");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      logger.error("Unauthorized");
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const { program, id: userId } = session.user;
    const cacheKey = `tasks:pg${program}:user${userId}`;
    const body = await fetchWithCache(cacheKey, 300, async () => {
      const activeCohort = await Cohort.findOne({ status: "active", program })
        .select("_id")
        .lean();
      if (!activeCohort) return { project: null, stages: [] };

      const project = await Project.findOne({ cohort: activeCohort._id })
        .populate({ path: "cohort", select: "cohort program status" })
        .populate({ path: "createdBy", select: "name email" })
        .lean();
      if (!project) return { project: null, stages: [] };

      const stages = await Stage.find({ project: project._id })
        .sort({ order: 1 })
        .lean();

      const stageIds = stages.map((s) => s._id);
      const [tasks, progressEntries] = await Promise.all([
        Task.find({ stage: { $in: stageIds } })
          .sort({ order: 1 })
          .lean(),
        StageProgress.find({ stage: { $in: stageIds }, user: userId }).lean(),
      ]);

      const progressMap = new Map(
        progressEntries.map((p) => [p.stage.toString(), p]),
      );

      const stagesWithData: StageWithData[] = stages.map((stage) => {
        const stageId = stage._id.toString();
        const stageTasks = tasks
          .filter((t) => t.stage.toString() === stageId)
          .map((t) => ({
            _id: t._id.toString(),
            stage: t.stage.toString(),
            title: t.title,
            description: t.description,
            instructions: t.instructions,
            resources: t.resources,
            type: t.type as "individual" | "group",
            maxScore: t.maxScore,
            isBonus: t.isBonus,
            order: t.order,
            dueDate: t.dueDate?.toISOString(),
            maxAttempts: t.maxAttempts,
            allowLate: t.allowLate,
          })) as TaskData[];

        const progress = progressMap.get(stageId);
        const progressData: StageProgressData | null = progress
          ? {
              _id: progress._id.toString(),
              stage: progress.stage.toString(),
              status: progress.status as StageProgressData["status"],
              totalScore: progress.totalScore,
              maxPossibleScore: progress.maxPossibleScore,
              percentage: progress.percentage,
              passed: progress.passed,
              startedAt: progress.startedAt?.toISOString(),
              completedAt: progress.completedAt?.toISOString(),
            }
          : null;

        const stageData: StageData = {
          _id: stage._id.toString(),
          project: stage.project.toString(),
          order: stage.order,
          title: stage.title,
          description: stage.description,
          passPercentage: stage.passPercentage,
          startDate: stage.startDate?.toISOString(),
          endDate: stage.endDate?.toISOString(),
        };
        return { stage: stageData, tasks: stageTasks, progress: progressData };
      });

      return { project, stages: stagesWithData } as TasksPageData;
    });

    return Response.json({
      success: true,
      message: "Tasks data fetched successfully",
      body,
    });
  });
}

export async function activateStage(
  request: Request,
  payload: { stageId: string },
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      logger.error("Unauthorized");
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const { id: userId, program } = session.user;
    const { stageId } = payload;

    const stage = await Stage.findById(stageId).lean();
    if (!stage) {
      return Response.json(
        { success: false, message: "Stage not found" },
        { status: 404 },
      );
    }

    const existing = await StageProgress.findOne({
      user: userId,
      stage: stageId,
    }).lean();
    if (existing) {
      return Response.json(
        { success: false, message: "Stage already activated" },
        { status: 400 },
      );
    }

    await StageProgress.create({
      user: userId,
      stage: stageId,
      status: "active",
    });

    await invalidateCache(`tasks:pg${program}:user${userId}`);

    await AuditLogService.record(request, {
      action: "ACTIVATE_STAGE",
      category: "tasks",
      description: `Activated stage "${stage.title}"`,
      details: { stageId, title: stage.title },
    });

    return Response.json(
      { success: true, message: "Stage activated successfully" },
      { status: 200 },
    );
  });
}

export async function submitTask(
  request: Request,
  payload: {
    taskId: string;
    content?: string;
    fileUrls?: { name: string; url: string }[];
  },
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      logger.error("Unauthorized");
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const { id: userId, program } = session.user;
    const { taskId, content, fileUrls } = payload;

    const task = await Task.findById(taskId).lean();
    if (!task) {
      return Response.json(
        { success: false, message: "Task not found" },
        { status: 404 },
      );
    }

    const submissionCount = await Submission.countDocuments({
      task: taskId,
      user: userId,
    });
    if (submissionCount >= (task.maxAttempts || 2)) {
      return Response.json(
        { success: false, message: "Maximum submission attempts reached" },
        { status: 400 },
      );
    }

    const now = new Date();
    const isLate = !!task.dueDate && new Date(task.dueDate) < now;

    const cleanUrls = Array.isArray(fileUrls)
      ? fileUrls.filter((f) => f.name.trim() && f.url.trim())
      : [];

    await Submission.create({
      task: taskId,
      user: userId,
      content: content || "",
      fileUrls: cleanUrls,
      maxScore: task.maxScore,
      attemptNumber: submissionCount + 1,
      status: "submitted",
      isLate,
      latePenalty: isLate ? task.latePenaltyPercent || 0 : 0,
    });

    await invalidateCache(`tasks:pg${program}:user${userId}`);

    await AuditLogService.record(request, {
      action: "SUBMIT_TASK",
      category: "tasks",
      description: `Submitted task "${task.title}" (attempt ${submissionCount + 1})`,
      details: {
        taskId,
        title: task.title,
        attemptNumber: submissionCount + 1,
        isLate,
      },
    });

    return Response.json(
      { success: true, message: "Task submitted successfully" },
      { status: 200 },
    );
  });
}

export async function getStageTasks({
  request,
  stageId,
}: {
  request: Request;
  stageId: string;
}) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "general");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      logger.error("Unauthorized");
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const cacheKey = `stage-tasks:${stageId}`;
    const body = await fetchWithCache(cacheKey, 300, async () => {
      const tasks = await Task.find({ stage: stageId })
        .sort({ order: 1 })
        .lean();

      return tasks.map((t) => ({
        _id: t._id.toString(),
        stage: t.stage.toString(),
        title: t.title,
        description: t.description,
        instructions: t.instructions,
        resources: t.resources,
        type: t.type as "individual" | "group",
        maxScore: t.maxScore,
        isBonus: t.isBonus,
        order: t.order,
        dueDate: t.dueDate?.toISOString(),
        maxAttempts: t.maxAttempts,
        allowLate: t.allowLate,
      })) as TaskData[];
    });

    return Response.json({
      success: true,
      message: "Stage tasks fetched successfully",
      body,
    });
  });
}

export async function createTask(request: Request, payload: TaskSchemaType) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      logger.error("Unauthorized");
      return Response.json(
        { success: false, message: "Unauthorized, session expired" },
        { status: 401 },
      );
    }
    const { program } = session.user;

    const parsed = taskSchema.safeParse(payload);
    if (!parsed.success) {
      logger.error("Invalid task data format");
      return Response.json(
        {
          success: false,
          message: "Invalid data format",
          errors: z.treeifyError(parsed.error),
        },
        { status: 400 },
      );
    }

    const stage = await Stage.findById(parsed.data.stage)
      .populate({
        path: "project",
        populate: { path: "cohort", select: "program" },
      })
      .lean();
    if (!stage) {
      return Response.json(
        { success: false, message: "Stage not found" },
        { status: 404 },
      );
    }

    const projectProgram = (stage.project as any)?.cohort?.program;
    if (projectProgram !== program) {
      return Response.json(
        {
          success: false,
          message: "You do not have permission to modify this stage",
        },
        { status: 403 },
      );
    }

    const task = await Task.create({
      stage: parsed.data.stage,
      title: parsed.data.title,
      description: parsed.data.description,
      instructions: parsed.data.instructions,
      resources: parsed.data.resources,
      type: parsed.data.type,
      maxScore: parsed.data.maxScore,
      isBonus: parsed.data.isBonus,
      order: parsed.data.order,
      dueDate: parsed.data.dueDate
        ? new Date(`${parsed.data.dueDate}T23:59:59.999Z`)
        : undefined,
      maxAttempts: parsed.data.maxAttempts,
      allowLate: parsed.data.allowLate,
      latePenaltyPercent: parsed.data.latePenaltyPercent,
    });

    await invalidateCache(`tasks:pg${program}:*`);

    await AuditLogService.record(request, {
      action: "CREATE_TASK",
      category: "tasks",
      description: `Created task "${parsed.data.title}"`,
      details: {
        taskId: task._id.toString(),
        title: parsed.data.title,
        stage: parsed.data.stage,
      },
    });

    return Response.json(
      { success: true, message: "Task created successfully", task },
      { status: 201 },
    );
  });
}

export async function editTask(
  request: Request,
  payload: Record<string, unknown>,
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json(
        { success: false, message: "Unauthorized, session expired" },
        { status: 401 },
      );
    }
    const { program } = session.user;

    const taskId = payload.taskId as string;
    if (!taskId) {
      return Response.json(
        { success: false, message: "Task ID is required" },
        { status: 400 },
      );
    }

    const existingTask = await Task.findById(taskId)
      .populate({
        path: "stage",
        populate: {
          path: "project",
          populate: { path: "cohort", select: "program" },
        },
      })
      .lean();
    if (!existingTask) {
      return Response.json(
        { success: false, message: "Task not found" },
        { status: 404 },
      );
    }

    const projectProgram = (existingTask as any)?.stage?.project?.cohort
      ?.program;
    if (projectProgram !== program) {
      return Response.json(
        {
          success: false,
          message: "You do not have permission to edit this task",
        },
        { status: 403 },
      );
    }

    const parsed = taskSchema.safeParse(payload);
    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          message: "Invalid data format",
          errors: z.treeifyError(parsed.error),
        },
        { status: 400 },
      );
    }

    const task = await Task.findByIdAndUpdate(
      taskId,
      {
        title: parsed.data.title,
        description: parsed.data.description,
        instructions: parsed.data.instructions,
        resources: parsed.data.resources,
        type: parsed.data.type,
        maxScore: parsed.data.maxScore,
        isBonus: parsed.data.isBonus,
        order: parsed.data.order,
        dueDate: parsed.data.dueDate
          ? new Date(`${parsed.data.dueDate}T23:59:59.999Z`)
          : undefined,
        maxAttempts: parsed.data.maxAttempts,
        allowLate: parsed.data.allowLate,
        latePenaltyPercent: parsed.data.latePenaltyPercent,
      },
      { new: true },
    ).lean();

    await invalidateCache(`tasks:pg${program}:*`);

    await AuditLogService.record(request, {
      action: "UPDATE_TASK",
      category: "tasks",
      description: `Updated task "${parsed.data.title}"`,
      details: { taskId, title: parsed.data.title },
    });

    return Response.json(
      { success: true, message: "Task updated successfully", task },
      { status: 200 },
    );
  });
}

export async function getTaskStatsForUser(request: Request) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "general");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json(
        { success: false, message: "Unauthorized, session expired" },
        { status: 401 },
      );
    }

    const { id: userId, program } = session.user;
    const cacheKey = `task-stats:pg${program}:user${userId}`;

    const body = await fetchWithCache(cacheKey, 600, async () => {
      const activeCohort = await Cohort.findOne({ status: "active", program })
        .select("_id")
        .lean();
      if (!activeCohort) return emptyStats();

      const project = await Project.findOne({
        cohort: activeCohort._id,
      }).lean();
      if (!project) return emptyStats();

      const stages = await Stage.find({ project: project._id })
        .sort({ order: 1 })
        .lean();
      const stageIds = stages.map((s) => s._id);

      const taskIds = await Task.find({ stage: { $in: stageIds } })
        .select("_id")
        .lean()
        .then((ts) => ts.map((t) => t._id));

      const [tasks, submissions, progressEntries] = await Promise.all([
        Task.find({ stage: { $in: stageIds } })
          .sort({ order: 1 })
          .lean(),
        Submission.find({ user: userId, task: { $in: taskIds } })
          .populate("task", "title order")
          .sort({ submittedAt: -1 })
          .lean(),
        StageProgress.find({ user: userId, stage: { $in: stageIds } })
          .sort({ stage: 1 })
          .lean(),
      ]);

      // ── Summary stats ──
      const totalTasks = tasks.length;
      const gradedSubmissions = submissions.filter(
        (s) => s.status === "graded",
      );
      const tasksCompleted = gradedSubmissions.length;
      const tasksSubmitted = submissions.filter(
        (s) => s.status === "submitted",
      ).length;
      const tasksReturned = submissions.filter(
        (s) => s.status === "returned",
      ).length;

      const averageScore =
        gradedSubmissions.length > 0
          ? Math.round(
              gradedSubmissions.reduce(
                (sum, s) => sum + (s.percentage || 0),
                0,
              ) / gradedSubmissions.length,
            )
          : 0;

      const onTimeSubmissions = submissions.filter((s) => !s.isLate).length;
      const onTimeRate =
        submissions.length > 0
          ? Math.round((onTimeSubmissions / submissions.length) * 100)
          : 0;

      const completedStages = progressEntries.filter(
        (p) => p.status === "completed",
      ).length;
      const totalStages = stages.length;
      const stageProgress =
        totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

      // ── Score trend (chronological) ──
      const scoreTrend = submissions
        .filter((s) => s.status === "graded" && s.score != null)
        .sort(
          (a, b) =>
            new Date(a.submittedAt).getTime() -
            new Date(b.submittedAt).getTime(),
        )
        .map((s) => ({
          date: s.submittedAt.toISOString().split("T")[0],
          score: s.score,
          maxScore: s.maxScore,
          percentage: s.percentage,
          taskTitle: (s.task as any)?.title || "Unknown",
        }));

      // ── Stage breakdown ──
      const stageBreakdown = progressEntries
        .map((p) => {
          const stage = stages.find(
            (s) => s._id.toString() === p.stage.toString(),
          );
          return {
            stageId: p.stage.toString(),
            stageTitle: stage?.title || `Stage ${stage?.order || "?"}`,
            order: stage?.order || 0,
            score: p.totalScore,
            maxScore: p.maxPossibleScore,
            percentage: p.percentage,
            status: p.status,
            passed: p.passed,
            passPercentage: stage?.passPercentage || 0,
          };
        })
        .sort((a, b) => a.order - b.order);

      // ── Submission summary ──
      const submissionSummary = [
        { name: "Graded", value: tasksCompleted, color: "#22c55e" },
        { name: "Pending", value: tasksSubmitted, color: "#eab308" },
        { name: "Returned", value: tasksReturned, color: "#f97316" },
      ];

      return {
        summary: {
          tasksCompleted,
          averageScore,
          onTimeRate,
          stageProgress,
          tasksSubmitted,
          tasksReturned,
          totalTasks,
        },
        trends: {
          scoreTrend,
          stageBreakdown,
          submissionSummary,
        },
      };
    });

    return Response.json({
      success: true,
      message: "Task stats fetched successfully",
      body,
    });
  });
}

function emptyStats() {
  return {
    summary: {
      tasksCompleted: 0,
      averageScore: 0,
      onTimeRate: 0,
      stageProgress: 0,
      tasksSubmitted: 0,
      tasksReturned: 0,
      totalTasks: 0,
    },
    trends: {
      scoreTrend: [] as {
        date: string;
        score: number;
        maxScore: number;
        percentage: number;
        taskTitle: string;
      }[],
      stageBreakdown: [] as {
        stageId: string;
        stageTitle: string;
        order: number;
        score: number;
        maxScore: number;
        percentage: number;
        status: string;
        passed: boolean;
        passPercentage: number;
      }[],
      submissionSummary: [] as { name: string; value: number; color: string }[],
    },
  };
}

export async function getTaskStatsForAdmins(request: Request) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "general");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json(
        { success: false, message: "Unauthorized, session expired" },
        { status: 401 },
      );
    }

    const { program, id: adminId } = session.user;
    const cacheKey = `task-stats-admin:pg${program}`;

    const body = await fetchWithCache(cacheKey, 600, async () => {
      // ── Cohort & Project ──
      const activeCohort = await Cohort.findOne({
        status: "active",
        program,
      }).lean();
      if (!activeCohort) return emptyAdminStats();

      const project = await Project.findOne({
        cohort: activeCohort._id,
      }).lean();
      if (!project) return emptyAdminStats();

      // ── All users in this program ──
      const programUsers = await User.find({
        program,
        role: { $nin: ["admin", "super_admin"] },
      })
        .select("_id name email isSuspended isOnboarded cohort")
        .lean();
      const programUserIds = programUsers.map((u) => u._id);
      const totalUsers = programUsers.length;
      const activeUsers = programUsers.filter((u) => !u.isSuspended).length;
      const suspendedUsers = programUsers.filter((u) => u.isSuspended).length;

      // ── Stages & Tasks ──
      const stages = await Stage.find({ project: project._id })
        .sort({ order: 1 })
        .lean();
      const stageIds = stages.map((s) => s._id);

      const tasks = await Task.find({ stage: { $in: stageIds } })
        .sort({ order: 1 })
        .lean();
      const taskIds = tasks.map((t) => t._id);
      const totalTasks = tasks.length;

      // ── Submissions ──
      const submissions = await Submission.find({ task: { $in: taskIds } })
        .populate("task", "title order")
        .sort({ submittedAt: -1 })
        .lean();

      const totalSubmissions = submissions.length;
      const gradedSubmissionsList = submissions.filter(
        (s) => s.status === "graded",
      );
      const gradedCount = gradedSubmissionsList.length;
      const pendingCount = submissions.filter(
        (s) => s.status === "submitted",
      ).length;
      const returnedCount = submissions.filter(
        (s) => s.status === "returned",
      ).length;

      const averageScore =
        gradedCount > 0
          ? Math.round(
              gradedSubmissionsList.reduce(
                (sum, s) => sum + (s.percentage || 0),
                0,
              ) / gradedCount,
            )
          : 0;

      const onTimeSubmissions = submissions.filter((s) => !s.isLate).length;
      const onTimeRate =
        totalSubmissions > 0
          ? Math.round((onTimeSubmissions / totalSubmissions) * 100)
          : 0;

      // ── Stage progress across all users ──
      const progressEntries = await StageProgress.find({
        stage: { $in: stageIds },
        user: { $in: programUserIds },
      }).lean();

      const stageHasTasks = new Set(tasks.map((t) => t.stage.toString()));

      const stagesWithProgress = stages
        .map((stage) => {
          const stageProgresses = progressEntries.filter(
            (p) => p.stage.toString() === stage._id.toString(),
          );
          const completed = stageProgresses.filter(
            (p) => p.status === "completed",
          ).length;
          const active = stageProgresses.filter(
            (p) => p.status === "active",
          ).length;
          const failed = stageProgresses.filter(
            (p) => p.status === "failed",
          ).length;
          return {
            stageId: stage._id.toString(),
            stageTitle: stage.title,
            order: stage.order,
            totalUsers: programUserIds.length,
            completedCount: completed,
            activeCount: active,
            failedCount: failed,
            passPercentage: stage.passPercentage,
            hasTasks: stageHasTasks.has(stage._id.toString()),
          };
        })
        .sort((a, b) => a.order - b.order);

      // ── Score distribution ──
      const buckets = [0, 20, 40, 60, 80, 100];
      const scoreDistribution = buckets.map((threshold, i) => {
        const nextThreshold = buckets[i + 1] ?? 101;
        const label =
          i === buckets.length - 1
            ? `${threshold}%`
            : `${threshold}-${nextThreshold - 1}%`;
        const count = gradedSubmissionsList.filter(
          (s) =>
            (s.percentage ?? 0) >= threshold &&
            (s.percentage ?? 0) < nextThreshold,
        ).length;
        return { label, count };
      });

      // ── Submission activity (last 30 days) ──
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activityMap = new Map<string, number>();
      submissions
        .filter((s) => new Date(s.submittedAt) >= thirtyDaysAgo)
        .forEach((s) => {
          const date = s.submittedAt.toISOString().split("T")[0];
          activityMap.set(date, (activityMap.get(date) || 0) + 1);
        });

      const submissionActivity = Array.from(activityMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // ── Top performing users ──
      const userScoreMap = new Map<
        string,
        { total: number; count: number; name: string }
      >();
      for (const s of gradedSubmissionsList) {
        const userId = s.user.toString();
        const existing = userScoreMap.get(userId) || {
          total: 0,
          count: 0,
          name: "",
        };
        existing.total += s.percentage || 0;
        existing.count += 1;
        if (!existing.name) {
          const user = programUsers.find((u) => u._id.toString() === userId);
          existing.name = user?.name || "Unknown";
        }
        userScoreMap.set(userId, existing);
      }

      const topUsers = Array.from(userScoreMap.entries())
        .map(([userId, data]) => ({
          userId,
          userName: data.name,
          averageScore: Math.round(data.total / data.count),
          submissionsGraded: data.count,
        }))
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, 10);

      return {
        summary: {
          totalUsers,
          activeUsers,
          suspendedUsers,
          totalSubmissions,
          gradedCount,
          pendingCount,
          returnedCount,
          averageScore,
          onTimeRate,
          totalTasks,
          totalStages: stages.length,
        },
        trends: {
          scoreDistribution,
          submissionActivity,
          stageCompletion: stagesWithProgress,
          topUsers,
        },
      };
    });

    return Response.json({
      success: true,
      message: "Admin task stats fetched successfully",
      body,
    });
  });
}

function emptyAdminStats() {
  return {
    summary: {
      totalUsers: 0,
      activeUsers: 0,
      suspendedUsers: 0,
      totalSubmissions: 0,
      gradedCount: 0,
      pendingCount: 0,
      returnedCount: 0,
      averageScore: 0,
      onTimeRate: 0,
      totalTasks: 0,
      totalStages: 0,
    },
    trends: {
      scoreDistribution: [] as { label: string; count: number }[],
      submissionActivity: [] as { date: string; count: number }[],
      stageCompletion: [] as {
        stageId: string;
        stageTitle: string;
        order: number;
        totalUsers: number;
        completedCount: number;
        activeCount: number;
        failedCount: number;
        passPercentage: number;
        hasTasks: boolean;
      }[],
      topUsers: [] as {
        userId: string;
        userName: string;
        averageScore: number;
        submissionsGraded: number;
      }[],
    },
  };
}
