import { tryCatchWrapper } from "~/lib/tryCatchWrapper";
import type { CalendarEvent } from "~/types";
import logger from "../config/logger";
import Cohort from "../model/cohort";
import Project from "../model/project";
import Stage from "../model/stage";
import Task from "../model/task";
import { auth } from "../services/better-auth";
import { fetchWithCache } from "../utils/cache";
import { checkRateLimit } from "../utils/rate-limit";

export async function getCalendarData(request: Request) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "general");
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session) {
      logger.error("Unauthorized");
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const { program } = session.user;
    const cacheKey = `calendar:pg${program}`;
    const body = await fetchWithCache(cacheKey, 3600, async () => {
      const activeCohort = await Cohort.findOne({ status: "active", program })
        .select("_id")
        .lean();
      if (!activeCohort)
        return { project: null, stages: [], tasks: [], events: [] };

      const project = await Project.findOne({ cohort: activeCohort._id })
        .populate({ path: "cohort", select: "cohort program status members" })
        .populate({ path: "createdBy", select: "name email" })
        .lean();

      if (!project) return { project: null, stages: [], tasks: [], events: [] };

      const stages = await Stage.find({ project: project._id })
        .sort({ order: 1 })
        .lean();

      const stageIds = stages.map((s) => s._id);
      const tasks = await Task.find({ stage: { $in: stageIds } })
        .sort({ order: 1 })
        .lean();

      const stageColor = (order: number) => {
        const colors = [
          "bg-blue-500",
          "bg-emerald-500",
          "bg-amber-500",
          "bg-violet-500",
          "bg-rose-500",
        ];
        return colors[(order - 1) % colors.length];
      };

      const events: CalendarEvent[] = [];

      events.push({
        _id: project._id.toString(),
        title: project.title,
        type: "project",
        startDate: project.startDate?.toISOString(),
        endDate: project.endDate?.toISOString(),
        status: project.status,
        description: project.description,
        color: "bg-mainBlue dark:bg-mainGold/40 dark:border border-mainGold",
      });

      for (const stage of stages) {
        events.push({
          _id: stage._id.toString(),
          title: stage.title,
          type: "stage",
          startDate: stage.startDate?.toISOString(),
          endDate: stage.endDate?.toISOString(),
          stageOrder: stage.order,
          projectId: project._id.toString(),
          description: stage.description,
          color: stageColor(stage.order),
        });
      }

      for (const task of tasks) {
        events.push({
          _id: task._id.toString(),
          title: task.title,
          type: "task",
          date: task.dueDate?.toISOString(),
          stageId: task.stage.toString(),
          description: task.description,
          color: "bg-red-400",
        });
      }

      return { project, stages, tasks, events };
    });

    return Response.json({
      success: true,
      message: "Calendar data fetched successfully",
      body,
    });
  });
}
