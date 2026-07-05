import { tryCatchWrapper } from "~/lib/tryCatchWrapper";
import { env } from "../config/keys";
import logger from "../config/logger";
import { dispatchIntegrationEvent } from "../integrations/registry";
import Project from "../model/project";
import Stage from "../model/stage";
import StageProgress from "../model/stageProgress";
import Submission from "../model/submission";
import Task from "../model/task";
import { AuditLogService } from "../services/auditlog.service";
import { auth } from "../services/better-auth";
import { NotificationService } from "../services/notification.service";
import { fetchWithCache, invalidateCache } from "../utils/cache";
import { checkRateLimit } from "../utils/rate-limit";
import { workflowClient } from "../workflows/client";

export async function fetchGradeTaskData(request: Request, taskId: string) {
  await checkRateLimit(request, "general");
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json(
      { success: false, message: "Unauthorized, session expired" },
      { status: 401 },
    );
  }
  const cacheKey = `grade:task:${taskId}`;
  const body = await fetchWithCache(cacheKey, 60, async () => {
    const task = await Task.findById(taskId).populate("stage").lean();
    if (!task) return null;

    const submissions = await Submission.find({ task: taskId })
      .populate("user", "name email image")
      .sort({ submittedAt: -1 })
      .lean();

    const stage = task.stage as any;
    const populateUser = (u: any) => ({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      image: u.image,
    });

    return {
      task: {
        _id: task._id.toString(),
        title: task.title,
        description: task.description,
        instructions: task.instructions,
        resources: task.resources as
          | { name: string; url: string }[]
          | undefined,
        type: task.type,
        maxScore: task.maxScore,
        isBonus: task.isBonus,
        dueDate: task.dueDate?.toISOString(),
        maxAttempts: task.maxAttempts,
        allowLate: task.allowLate,
      },
      stage: {
        _id: stage._id.toString(),
        title: stage.title,
        order: stage.order,
        passPercentage: stage.passPercentage,
      },
      submissions: submissions.map((s) => ({
        _id: s._id.toString(),
        user: populateUser(s.user),
        content: s.content,
        fileUrls: s.fileUrls as { name: string; url: string }[] | undefined,
        status: s.status,
        score: s.score,
        maxScore: s.maxScore,
        percentage: s.percentage,
        feedback: s.feedback,
        gradedBy: s.gradedBy?.toString(),
        attemptNumber: s.attemptNumber,
        submittedAt: s.submittedAt.toISOString(),
        gradedAt: s.gradedAt?.toISOString(),
        isLate: s.isLate,
        latePenalty: s.latePenalty,
      })),
    };
  });

  return Response.json({ success: true, message: "Grade data fetched", body });
}

export async function gradeTask(
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

    const Cohort = (await import("../model/cohort")).default;
    const activeCohort = await Cohort.findOne({
      status: "active",
      program: (session.user as any).program,
    })
      .select("_id")
      .lean();
    const cohortId = activeCohort?._id.toString();

    const { submissionId, score, feedback, status } = payload as {
      submissionId: string;
      score: number;
      feedback?: string;
      status?: "graded" | "returned";
    };

    if (!submissionId || score === undefined || score === null) {
      return Response.json(
        { success: false, message: "Submission ID and score are required" },
        { status: 400 },
      );
    }

    const submission = await Submission.findById(submissionId).lean();
    if (!submission) {
      return Response.json(
        { success: false, message: "Submission not found" },
        { status: 404 },
      );
    }

    const parsedScore = Number(score);
    if (
      isNaN(parsedScore) ||
      parsedScore < 0 ||
      parsedScore > submission.maxScore
    ) {
      return Response.json(
        {
          success: false,
          message: `Score must be between 0 and ${submission.maxScore}`,
        },
        { status: 400 },
      );
    }

    const finalStatus = status === "returned" ? "returned" : "graded";
    const percentage =
      submission.maxScore > 0
        ? Math.round((parsedScore / submission.maxScore) * 100)
        : 0;

    await Submission.findByIdAndUpdate(submissionId, {
      score: parsedScore,
      percentage,
      feedback: feedback?.trim() || undefined,
      gradedBy: session.user.id,
      gradedAt: new Date(),
      status: finalStatus,
    });

    // ── Recalculate StageProgress ──
    const task = await Task.findById(submission.task).lean();
    if (task) {
      const tasksInStage = await Task.find({ stage: task.stage }).lean();
      const taskIds = tasksInStage.map((t) => t._id);

      const gradedSubmissions = await Submission.find({
        task: { $in: taskIds },
        user: submission.user,
        status: { $in: ["graded", "returned"] },
      }).lean();

      const totalScore = gradedSubmissions.reduce(
        (sum, s) => sum + (s.score || 0),
        0,
      );
      const maxPossibleScore = tasksInStage.reduce(
        (sum, t) => sum + t.maxScore,
        0,
      );
      const stagePercentage =
        maxPossibleScore > 0
          ? Math.round((totalScore / maxPossibleScore) * 100)
          : 0;

      const stage = await Stage.findById(task.stage).lean();

      const updateData: Record<string, unknown> = {
        totalScore,
        maxPossibleScore,
        percentage: stagePercentage,
      };

      if (stage && stagePercentage >= stage.passPercentage) {
        updateData.passed = true;
        updateData.status = "completed";
        updateData.completedAt = new Date();

        // Auto-activate the next stage if it exists
        const nextStage = await Stage.findOne({
          project: stage.project,
          order: stage.order + 1,
        }).lean();

        if (nextStage) {
          const existingProgress = await StageProgress.findOne({
            user: submission.user,
            stage: nextStage._id,
          }).lean();

          if (!existingProgress) {
            await StageProgress.create({
              user: submission.user,
              stage: nextStage._id,
              status: "active",
              startedAt: new Date(),
            });
          }
        }
      }

      await StageProgress.findOneAndUpdate(
        { user: submission.user, stage: task.stage },
        { $set: updateData },
      );

      // Recalculate project progress
      if (stage && cohortId) {
        const projectStages = await Stage.find({ project: stage.project })
          .select("_id")
          .lean();
        const projectStageIds = projectStages.map((s) => s._id);
        const projectCohort = await Cohort.findById(cohortId)
          .select("members")
          .lean();
        if (projectCohort?.members?.length && projectStages.length > 0) {
          const progressCounts = await StageProgress.aggregate([
            {
              $match: {
                stage: { $in: projectStageIds },
                status: "completed",
              },
            },
            { $group: { _id: "$user", count: { $sum: 1 } } },
          ]);
          const totalCompletedStages = progressCounts.reduce(
            (sum, p) => sum + p.count,
            0,
          );
          const projectProgress = Math.round(
            (totalCompletedStages /
              (projectStages.length * projectCohort.members.length)) *
              100,
          );
          await Project.updateOne(
            { _id: stage.project },
            { $set: { progress: projectProgress } },
          );
        }
      }
    }

    const userProgram = (session.user as any).program as string | undefined;
    if (userProgram) {
      await invalidateCache(`tasks:pg${userProgram}:user${submission.user}`);
    }
    await invalidateCache(`grade:task:${submission.task}`);

    await AuditLogService.record(request, {
      action: finalStatus === "returned" ? "RETURN_SUBMISSION" : "GRADE_TASK",
      category: "tasks",
      description:
        finalStatus === "returned"
          ? `Returned submission for revision (score: ${parsedScore}/${submission.maxScore})`
          : `Graded submission (score: ${parsedScore}/${submission.maxScore}, ${percentage}%)`,
      details: {
        submissionId,
        taskId: submission.task.toString(),
        score: parsedScore,
        maxScore: submission.maxScore,
        percentage,
        status: finalStatus,
      },
    });

    // Notify student of grade
    if (finalStatus === "graded") {
      const taskTitle = task?.title || "Unknown";
      NotificationService.send({
        userId: submission.user.toString(),
        type: "submission_graded",
        title: "Submission Graded",
        message: `Your submission for "${taskTitle}" has been graded (${parsedScore}/${submission.maxScore}).`,
        metadata: {
          taskTitle,
          score: parsedScore,
          maxScore: submission.maxScore,
        },
      });
      await workflowClient
        .trigger({
          url: `${env.clientUrl}/api/v1/workflow/submission-graded`,
          body: {
            userId: submission.user.toString(),
            taskTitle,
            score: parsedScore,
            maxScore: submission.maxScore,
            link: `${env.clientUrl}/tasks/submissions`,
          },
        })
        .catch((err: any) =>
          logger.error(
            "Failed to trigger submission-graded notification:",
            err,
          ),
        );

      if (cohortId) {
        dispatchIntegrationEvent("submission_graded", {
          cohortId,
          userName: (submission as any).user?.name || "A user",
          taskTitle,
          score: parsedScore,
          maxScore: submission.maxScore,
          repoUrl: submission.repoUrl,
          feedback: feedback?.trim(),
          fileUrls: submission.fileUrls,
        });
      }
    }

    return Response.json({
      success: true,
      message:
        finalStatus === "returned"
          ? "Submission returned for revision"
          : "Submission graded successfully",
    });
  });
}
