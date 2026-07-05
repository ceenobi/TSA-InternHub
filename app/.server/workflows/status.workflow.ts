import { WorkflowContext } from "@upstash/workflow";
import { env } from "../config/keys.js";
import logger from "../config/logger.js";
import { dispatchIntegrationEvent } from "../integrations/registry";
import Cohort from "../model/cohort";
import Project from "../model/project";
import Stage from "../model/stage";
import StageProgress from "../model/stageProgress";
import Submission from "../model/submission";
import Task from "../model/task";
import { NotificationService } from "../services/notification.service";
import { workflowClient } from "./client";

type StatusUpdateResult = {
  projectsActivated: number;
  projectsCompleted: number;
  stagesAutoFailed: number;
  submissionsMarkedLate: number;
  projectsProgressUpdated: number;
};

export const runStatusUpdatesWorkflow = async (
  context: WorkflowContext<Record<string, never>>,
) => {
  const now = new Date();

  const result = await context.run<StatusUpdateResult>(
    "run-status-updates",
    async () => {
      const updates: StatusUpdateResult = {
        projectsActivated: 0,
        projectsCompleted: 0,
        stagesAutoFailed: 0,
        submissionsMarkedLate: 0,
        projectsProgressUpdated: 0,
      };

      // ── 1. Project transitions ──
      const projectsToActivate = await Project.find({
        status: "upcoming",
        startDate: { $lte: now },
      }).lean();

      const projectsToComplete = await Project.find({
        status: "active",
        endDate: { $lte: now },
      }).lean();

      if (projectsToActivate.length > 0) {
        const ids = projectsToActivate.map((p) => p._id);
        const r = await Project.updateMany(
          { _id: { $in: ids } },
          { $set: { status: "active", updatedAt: now } },
        );
        updates.projectsActivated = r.modifiedCount;
        logger.info(`Activated ${r.modifiedCount} project(s)`);

        // Notify cohort members
        for (const project of projectsToActivate) {
          const cohort = await Cohort.findById(project.cohort)
            .select("members")
            .lean();
          if (cohort?.members?.length) {
            for (const userId of cohort.members) {
              NotificationService.send({
                userId: userId.toString(),
                type: "project_started",
                title: "Project Started",
                message: `The project "${project.title}" has started.`,
                metadata: { projectTitle: project.title },
              });
              await workflowClient
                .trigger({
                  url: `${env.clientUrl}/api/v1/workflow/project-started`,
                  body: {
                    userId: userId.toString(),
                    projectTitle: project.title,
                    link: `${env.clientUrl}/tasks`,
                  },
                })
                .catch((err: any) =>
                  logger.error(
                    "Failed to trigger project-started notification:",
                    err,
                  ),
                );
            }
          }
          dispatchIntegrationEvent("project_started", {
            cohortId: cohort!._id.toString(),
            projectTitle: project.title,
            startDate: project.startDate?.toISOString(),
            endDate: project.endDate?.toISOString(),
            description: project.description,
            projectId: project._id.toString(),
          });
        }
      }

      if (projectsToComplete.length > 0) {
        const ids = projectsToComplete.map((p) => p._id);
        const r = await Project.updateMany(
          { _id: { $in: ids } },
          { $set: { status: "completed", updatedAt: now } },
        );
        updates.projectsCompleted = r.modifiedCount;
        logger.info(`Completed ${r.modifiedCount} project(s)`);

        for (const project of projectsToComplete) {
          const cohort = await Cohort.findById(project.cohort)
            .select("members")
            .lean();
          if (cohort?.members?.length) {
            for (const userId of cohort.members) {
              NotificationService.send({
                userId: userId.toString(),
                type: "project_completed",
                title: "Project Completed",
                message: `The project "${project.title}" has been completed.`,
                metadata: { projectTitle: project.title },
              });
              await workflowClient
                .trigger({
                  url: `${env.clientUrl}/api/v1/workflow/project-completed`,
                  body: {
                    userId: userId.toString(),
                    projectTitle: project.title,
                    link: `${env.clientUrl}`,
                  },
                })
                .catch((err: any) =>
                  logger.error(
                    "Failed to trigger project-completed notification:",
                    err,
                  ),
                );
            }
          }
          dispatchIntegrationEvent("project_completed", {
            cohortId: cohort!._id.toString(),
            projectTitle: project.title,
            endDate: project.endDate?.toISOString(),
          });
        }
      }

      // ── 1c. Activate projects that have stages and tasks created ──
      const stagedProjects = await Project.find({
        status: "upcoming",
        startDate: { $gt: now },
      }).lean();

      for (const project of stagedProjects) {
        const stageCount = await Stage.countDocuments({ project: project._id });
        if (stageCount === 0) continue;

        const stages = await Stage.find({ project: project._id })
          .select("_id")
          .lean();
        const stageIds = stages.map((s) => s._id);

        const taskCount = await Task.countDocuments({
          stage: { $in: stageIds },
        });
        if (taskCount === 0) continue;

        await Project.findByIdAndUpdate(project._id, {
          $set: { status: "active", updatedAt: now },
        });
        updates.projectsActivated += 1;
        logger.info(
          `Activated project "${project.title}" via stage+task creation`,
        );

        const cohort = await Cohort.findById(project.cohort)
          .select("members")
          .lean();
        if (cohort?.members?.length) {
          for (const userId of cohort.members) {
            NotificationService.send({
              userId: userId.toString(),
              type: "project_started",
              title: "Project Started",
              message: `The project "${project.title}" has started.`,
              metadata: { projectTitle: project.title },
            });
            await workflowClient
              .trigger({
                url: `${env.clientUrl}/api/v1/workflow/project-started`,
                body: {
                  userId: userId.toString(),
                  projectTitle: project.title,
                  link: `${env.clientUrl}/tasks`,
                },
              })
              .catch((err: any) =>
                logger.error(
                  "Failed to trigger project-started notification:",
                  err,
                ),
              );
          }
        }
        dispatchIntegrationEvent("project_started", {
          cohortId: cohort!._id.toString(),
          projectTitle: project.title,
          startDate: project.startDate?.toISOString(),
          endDate: project.endDate?.toISOString(),
          description: project.description,
          projectId: project._id.toString(),
        });
      }

      // ── 2. Auto-fail StageProgress entries past stage endDate ──
      const overdueStages = await Stage.find({
        endDate: { $lte: now },
      }).lean();

      if (overdueStages.length > 0) {
        const stageIds = overdueStages.map((s) => s._id);
        const stageMap = new Map(
          overdueStages.map((s) => [s._id.toString(), s]),
        );

        const stageTasks = await Task.find({ stage: { $in: stageIds } })
          .select("_id stage")
          .lean();

        const stageTaskIdsMap = new Map<string, string[]>();
        for (const task of stageTasks) {
          const sid = task.stage.toString();
          if (!stageTaskIdsMap.has(sid)) stageTaskIdsMap.set(sid, []);
          stageTaskIdsMap.get(sid)!.push(task._id.toString());
        }

        const progressEntries = await StageProgress.find({
          stage: { $in: stageIds },
          status: "active",
        }).lean();

        if (progressEntries.length > 0) {
          const toFail: typeof progressEntries = [];

          for (const entry of progressEntries) {
            const taskIds = stageTaskIdsMap.get(entry.stage.toString());
            if (!taskIds || taskIds.length === 0) {
              toFail.push(entry);
              continue;
            }

            const pendingSubmissions = await Submission.countDocuments({
              task: { $in: taskIds },
              user: entry.user.toString(),
              status: { $in: ["submitted", "returned"] },
            });

            if (pendingSubmissions === 0) {
              toFail.push(entry);
            }
          }

          if (toFail.length > 0) {
            const failIds = toFail.map((p) => p._id);
            const r = await StageProgress.updateMany(
              { _id: { $in: failIds } },
              {
                $set: {
                  status: "failed",
                  completedAt: now,
                  passed: false,
                },
              },
            );
            updates.stagesAutoFailed = r.modifiedCount;
            logger.info(`Auto-failed ${r.modifiedCount} stage progress(es)`);

            for (const entry of toFail) {
              const stage = stageMap.get(entry.stage.toString());
              if (!stage) continue;
              const project = await Project.findById(stage.project)
                .select("title")
                .lean();
              NotificationService.send({
                userId: entry.user.toString(),
                type: "stage_failed",
                title: "Stage Failed",
                message: `Stage "${stage.title}" in "${project?.title || "Unknown"}" has been marked as failed.`,
                metadata: {
                  stageTitle: stage.title,
                  projectTitle: project?.title,
                },
              });
              await workflowClient
                .trigger({
                  url: `${env.clientUrl}/api/v1/workflow/stage-auto-failed`,
                  body: {
                    userId: entry.user.toString(),
                    stageTitle: stage.title,
                    projectTitle: project?.title || "Unknown",
                  },
                })
                .catch((err: any) =>
                  logger.error(
                    "Failed to trigger stage-auto-failed notification:",
                    err,
                  ),
                );
            }
          }
        }
      }

      // ── 3. Mark submissions past task dueDate as late ──
      const overdueTasks = await Task.find({
        dueDate: { $lte: now },
      }).lean();

      if (overdueTasks.length > 0) {
        const taskMap = new Map(overdueTasks.map((t) => [t._id.toString(), t]));

        const candidates = await Submission.find({
          task: { $in: [...taskMap.keys()] },
          status: "submitted",
          isLate: false,
        }).lean();

        const lateSubmissions = candidates.filter((sub) => {
          const task = taskMap.get(sub.task.toString());
          if (!task?.dueDate) return false;
          return new Date(sub.submittedAt) > new Date(task.dueDate);
        });

        if (lateSubmissions.length > 0) {
          const submissionIds = lateSubmissions.map((s) => s._id);
          const r = await Submission.updateMany(
            { _id: { $in: submissionIds } },
            { $set: { isLate: true, updatedAt: now } },
          );
          updates.submissionsMarkedLate = r.modifiedCount;
          logger.info(`Marked ${r.modifiedCount} submission(s) as late`);

          for (const submission of lateSubmissions) {
            const task = taskMap.get(submission.task.toString());
            if (!task) continue;
            const stage = await Stage.findById(task.stage)
              .select("title")
              .lean();
            NotificationService.send({
              userId: submission.user.toString(),
              type: "task_overdue",
              title: "Task Overdue",
              message: `Task "${task.title}" in "${stage?.title || "Unknown"}" is now overdue.`,
              metadata: { taskTitle: task.title, stageTitle: stage?.title },
            });
            await workflowClient
              .trigger({
                url: `${env.clientUrl}/api/v1/workflow/task-overdue`,
                body: {
                  userId: submission.user.toString(),
                  taskTitle: task.title,
                  stageTitle: stage?.title || "Unknown",
                },
              })
              .catch((err: any) =>
                logger.error(
                  "Failed to trigger task-overdue notification:",
                  err,
                ),
              );
          }
        }
      }

      // ── 4. Recalculate progress for active projects ──
      const activeProjects = await Project.find({
        status: "active",
      })
        .select("_id cohort")
        .lean();

      for (const project of activeProjects) {
        const stages = await Stage.find({ project: project._id })
          .select("_id")
          .lean();
        if (stages.length === 0) continue;

        const stageIds = stages.map((s) => s._id);
        const cohort = await Cohort.findById(project.cohort)
          .select("members")
          .lean();
        if (!cohort?.members?.length) continue;

        const progressCounts = await StageProgress.aggregate([
          { $match: { stage: { $in: stageIds }, status: "completed" } },
          { $group: { _id: "$user", count: { $sum: 1 } } },
        ]);

        const totalCompletedStages = progressCounts.reduce(
          (sum, p) => sum + p.count,
          0,
        );
        const progress = Math.round(
          (totalCompletedStages / (stages.length * cohort.members.length)) * 100,
        );

        await Project.updateOne(
          { _id: project._id },
          { $set: { progress } },
        );
        updates.projectsProgressUpdated++;
      }

      return updates;
    },
  );

  logger.info(
    `Status update complete: ${result.projectsActivated} activated, ` +
      `${result.projectsCompleted} completed, ${result.stagesAutoFailed} auto-failed, ` +
      `${result.submissionsMarkedLate} marked late, ` +
      `${result.projectsProgressUpdated} progress updated`,
  );
};
