import z from "zod";
import { stageSchema } from "~/lib/schemaValidation";
import { tryCatchWrapper } from "~/lib/tryCatchWrapper";
import type { StageSchemaType } from "~/types";
import logger from "../config/logger";
import Project from "../model/project";
import Stage from "../model/stage";
import StageProgress from "../model/stageProgress";
import Submission from "../model/submission";
import Task from "../model/task";
import { AuditLogService } from "../services/auditlog.service";
import { auth } from "../services/better-auth";
import { invalidateCache } from "../utils/cache";
import { checkRateLimit } from "../utils/rate-limit";

export async function createStage(
  request: Request,
  payload: StageSchemaType & { projectId: string },
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session) {
      logger.error("Unauthorized");
      return Response.json(
        { success: false, message: "Unauthorized, session expired" },
        { status: 401 },
      );
    }

    const parsed = stageSchema.safeParse(payload);
    if (!parsed.success) {
      logger.error("Invalid stage data format");
      return Response.json(
        {
          success: false,
          message: "Invalid data format",
          errors: z.treeifyError(parsed.error),
        },
        { status: 400 },
      );
    }

    const { program } = session.user;
    const project = await Project.findById(payload.projectId)
      .populate({ path: "cohort", select: "program" })
      .lean();
    if (!project) {
      return Response.json(
        { success: false, message: "Project not found" },
        { status: 404 },
      );
    }

    const projectProgram = (project.cohort as any)?.program;
    if (projectProgram !== program) {
      return Response.json(
        {
          success: false,
          message: "You do not have permission to modify this project",
        },
        { status: 403 },
      );
    }

    const existingCount = await Stage.countDocuments({
      project: payload.projectId,
    });
    if (existingCount >= 5) {
      return Response.json(
        { success: false, message: "A project can have at most 5 stages" },
        { status: 400 },
      );
    }

    const stage = await Stage.create({
      project: payload.projectId,
      order: existingCount + 1,
      title: parsed.data.title,
      description: parsed.data.description,
      passPercentage: parsed.data.passPercentage,
      startDate: parsed.data.startDate
        ? new Date(parsed.data.startDate)
        : undefined,
      endDate: parsed.data.endDate
        ? new Date(`${parsed.data.endDate}T23:59:59.999Z`)
        : undefined,
      lateGraceHours: parsed.data.lateGraceHours,
      latePenaltyPerDay: parsed.data.latePenaltyPerDay,
    });

    await invalidateCache(`project-stages:pg${program}:${payload.projectId}`);

    await AuditLogService.record(request, {
      action: "CREATE_STAGE",
      category: "tasks",
      description: `Created stage "${parsed.data.title}"`,
      details: {
        stageId: stage._id.toString(),
        title: parsed.data.title,
        projectId: payload.projectId,
      },
    });

    return Response.json(
      { success: true, message: "Stage created successfully", stage },
      { status: 201 },
    );
  });
}

export async function updateStage(
  request: Request,
  payload: StageSchemaType & { stageId: string; projectId: string },
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session) {
      logger.error("Unauthorized");
      return Response.json(
        { success: false, message: "Unauthorized, session expired" },
        { status: 401 },
      );
    }

    const { program } = session.user;
    const project = await Project.findById(payload.projectId)
      .populate({ path: "cohort", select: "program" })
      .lean();
    if (!project) {
      return Response.json(
        { success: false, message: "Project not found" },
        { status: 404 },
      );
    }

    const projectProgram = (project.cohort as any)?.program;
    if (projectProgram !== program) {
      return Response.json(
        {
          success: false,
          message: "You do not have permission to modify this project",
        },
        { status: 403 },
      );
    }

    const parsed = stageSchema.safeParse(payload);
    if (!parsed.success) {
      logger.error("Invalid stage data format");
      return Response.json(
        {
          success: false,
          message: "Invalid data format",
          errors: z.treeifyError(parsed.error),
        },
        { status: 400 },
      );
    }

    const stage = await Stage.findByIdAndUpdate(
      payload.stageId,
      {
        title: parsed.data.title,
        description: parsed.data.description,
        passPercentage: parsed.data.passPercentage,
        startDate: parsed.data.startDate
          ? new Date(parsed.data.startDate)
          : undefined,
        endDate: parsed.data.endDate
          ? new Date(`${parsed.data.endDate}T23:59:59.999Z`)
          : undefined,
        lateGraceHours: parsed.data.lateGraceHours,
        latePenaltyPerDay: parsed.data.latePenaltyPerDay,
      },
      { returnDocument: "after" },
    );

    if (!stage) {
      return Response.json(
        { success: false, message: "Stage not found" },
        { status: 404 },
      );
    }

    await invalidateCache(`project-stages:pg${program}:${payload.projectId}`);

    await AuditLogService.record(request, {
      action: "UPDATE_STAGE",
      category: "tasks",
      description: `Updated stage "${parsed.data.title}"`,
      details: {
        stageId: payload.stageId,
        title: parsed.data.title,
        projectId: payload.projectId,
      },
    });

    return Response.json(
      { success: true, message: "Stage updated successfully", stage },
      { status: 200 },
    );
  });
}

export async function deleteStage(
  request: Request,
  payload: { stageId: string; projectId: string },
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session) {
      logger.error("Unauthorized");
      return Response.json(
        { success: false, message: "Unauthorized, session expired" },
        { status: 401 },
      );
    }

    const { program } = session.user;
    const project = await Project.findById(payload.projectId)
      .populate({ path: "cohort", select: "program" })
      .lean();
    if (!project) {
      return Response.json(
        { success: false, message: "Project not found" },
        { status: 404 },
      );
    }

    const projectProgram = (project.cohort as any)?.program;
    if (projectProgram !== program) {
      return Response.json(
        {
          success: false,
          message: "You do not have permission to modify this project",
        },
        { status: 403 },
      );
    }

    const stage = await Stage.findById(payload.stageId).lean();
    if (!stage) {
      return Response.json(
        { success: false, message: "Stage not found" },
        { status: 404 },
      );
    }

    const deletedOrder = stage.order;

    const tasks = await Task.find({ stage: payload.stageId })
      .select("_id")
      .lean();
    const taskIds = tasks.map((t) => t._id);

    await Promise.all([
      Submission.deleteMany({ task: { $in: taskIds } }),
      StageProgress.deleteMany({ stage: payload.stageId }),
      Task.deleteMany({ stage: payload.stageId }),
    ]);

    await Stage.findByIdAndDelete(payload.stageId);

    await Stage.updateMany(
      { project: payload.projectId, order: { $gt: deletedOrder } },
      { $inc: { order: -1 } },
    );

    await invalidateCache(`project-stages:pg${program}:${payload.projectId}`);

    await AuditLogService.record(request, {
      action: "DELETE_STAGE",
      category: "tasks",
      description: `Deleted stage "${stage.title}" (order ${deletedOrder})`,
      details: {
        stageId: payload.stageId,
        title: stage.title,
        projectId: payload.projectId,
        order: deletedOrder,
      },
    });

    return Response.json(
      { success: true, message: "Stage deleted successfully" },
      { status: 200 },
    );
  });
}
