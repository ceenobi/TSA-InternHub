import z from "zod";
import { projectSchema } from "~/lib/schemaValidation";
import { tryCatchWrapper } from "~/lib/tryCatchWrapper";
import type { ProjectSchemaType } from "~/types";
import logger from "../config/logger";
import Cohort from "../model/cohort";
import Project from "../model/project";
import Stage from "../model/stage";
import StageProgress from "../model/stageProgress";
import Submission from "../model/submission";
import Task from "../model/task";
import { AuditLogService } from "../services/auditlog.service";
import { auth } from "../services/better-auth";
import { getStageTitle, type Program } from "../services/stage-names";
import { fetchWithCache, invalidateCache } from "../utils/cache";
import { checkRateLimit } from "../utils/rate-limit";

export async function createProject(
  request: Request,
  payload: ProjectSchemaType,
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
    const parsed = projectSchema.safeParse(payload);
    if (!parsed.success) {
      logger.error("Invalid project data format");
      return Response.json(
        {
          success: false,
          message: "Invalid data format",
          errors: z.treeifyError(parsed.error),
        },
        { status: 400 },
      );
    }

    const cohort = await Cohort.findById(parsed.data.cohortId).lean();
    if (!cohort) {
      logger.error("Cohort not found");
      return Response.json(
        { success: false, message: "Cohort not found" },
        { status: 400 },
      );
    }
    if (cohort.status !== "active") {
      logger.error("Cohort is not active");
      return Response.json(
        {
          success: false,
          message: "A Cohort must be active to create a project",
        },
        { status: 400 },
      );
    }

    const existingProject = await Project.findOne({
      cohort: parsed.data.cohortId,
      status: { $in: ["upcoming", "active"] },
    }).lean();
    if (existingProject) {
      logger.error("Cohort already has an active or upcoming project");
      return Response.json(
        {
          success: false,
          message: "Cohort already has an active or upcoming project",
        },
        { status: 400 },
      );
    }

    const project = await Project.create({
      title: parsed.data.title,
      description: parsed.data.description,
      cohort: parsed.data.cohortId,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(`${parsed.data.endDate}T23:59:59.999Z`),
      createdBy: session.user.id,
    });

    const program = cohort.program as Program;
    const stageTitles = [1, 2, 3, 4, 5].map((order) => ({
      order,
      title: getStageTitle(program, order),
      project: project._id,
    }));

    await Stage.insertMany(stageTitles);

    await invalidateCache(`project-active:pg${session.user.program}:*`);

    await AuditLogService.record(request, {
      action: "CREATE_PROJECT",
      category: "tasks",
      description: `Created project "${parsed.data.title}"`,
      details: { projectId: project._id.toString(), title: parsed.data.title },
    });

    return Response.json(
      { success: true, message: "Project created successfully", project },
      { status: 201 },
    );
  });
}

export async function getCurrentProject(request: Request) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "general");
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
    const cacheKey = `project-active:pg${program}`;
    const currentProject = await fetchWithCache(cacheKey, 3600, async () => {
      const activeCohort = await Cohort.findOne({ status: "active", program })
        .select("_id")
        .lean();
      if (!activeCohort) return null;
      return await Project.findOne({ cohort: activeCohort._id })
        .populate({ path: "cohort", select: "cohort program status members" })
        .populate({ path: "createdBy", select: "name email" })
        .sort({ createdAt: -1 });
    });
    return Response.json({
      success: true,
      message: "Active project fetched successfully",
      body: currentProject,
    });
  });
}

export async function fetchProgramProjects({
  request,
  page,
  limit,
  query,
  status,
}: {
  request: Request;
  page: number;
  limit: number;
  query: string | undefined;
  status: "upcoming" | "active" | "completed" | "on-hold" | undefined;
}) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "general");
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
    const cacheKey = `projects:pg${program}:p${page}:l${limit}:q${query ?? ""}:s${status ?? ""}`;
    const body = await fetchWithCache(cacheKey, 3600, async () => {
      const cohortIds = await Cohort.find({ program }).distinct("_id");
      const dbFilter: Record<string, any> = {
        cohort: { $in: cohortIds },
        ...(status && { status }),
      };
      if (query) {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = { $regex: escaped, $options: "i" };
        dbFilter.title = regex;
      }
      const total = await Project.countDocuments(dbFilter);
      const projects = await Project.find(dbFilter)
        .populate({
          path: "cohort",
          select: "cohort program status members",
        })
        .populate({
          path: "createdBy",
          select: "name email",
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      return {
        projects,
        meta: {
          currentPage: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
          hasMore: (page - 1) * limit + projects.length < total,
        },
      };
    });
    return Response.json({
      success: true,
      message: "Projects fetched successfully",
      body,
    });
  });
}

export async function updateProject(
  request: Request,
  payload: ProjectSchemaType,
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
    const url = new URL(request.url);
    const id = url.searchParams.get("id") || undefined;
    if (!id) {
      return Response.json(
        {
          success: false,
          message: "Project id is required",
        },
        { status: 400 },
      );
    }
    const parsed = projectSchema.safeParse(payload);
    if (!parsed.success) {
      logger.error("Invalid project data format");
      return Response.json(
        {
          success: false,
          message: "Invalid data format",
          errors: z.treeifyError(parsed.error),
        },
        { status: 400 },
      );
    }
    const project = await Project.findById(id).lean();
    if (!project) {
      logger.error("Cohort not found");
      return Response.json(
        {
          success: false,
          message: "Project not found",
        },
        { status: 404 },
      );
    }
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        title: parsed.data.title,
        description: parsed.data.description,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(`${parsed.data.endDate}T23:59:59.999Z`),
        status: parsed.data.status,
      },
      { returnDocument: "after" },
    );
    await invalidateCache(`project-active:pg${session.user.program}`);

    await AuditLogService.record(request, {
      action: "UPDATE_PROJECT",
      category: "tasks",
      description: `Updated project "${parsed.data.title}"`,
      details: {
        projectId: id,
        title: parsed.data.title,
        status: parsed.data.status,
      },
    });

    return Response.json(
      {
        success: true,
        message: "Project updated successfully",
        project: updatedProject,
      },
      { status: 200 },
    );
  });
}

export async function deleteProject(request: Request, payload: { id: string }) {
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
    const { id: userId, program, role } = session.user;
    if (!payload.id) {
      return Response.json(
        {
          success: false,
          message: "Project id is required",
        },
        { status: 400 },
      );
    }
    const project = await Project.findById(payload.id)
      .populate("cohort", "program")
      .lean();
    if (!project) {
      return Response.json(
        {
          success: false,
          message: "Project not found",
        },
        { status: 400 },
      );
    }

    const isSuperAdmin = role === "super_admin";
    const isOwner = project.createdBy.toString() === userId;
    const sameProgram = (project.cohort as any)?.program === program;

    if (!isSuperAdmin && !(isOwner && sameProgram)) {
      logger.error("Unauthorized to delete this project");
      return Response.json(
        {
          success: false,
          message: "You do not have permission to delete this project",
        },
        { status: 403 },
      );
    }

    const stages = await Stage.find({ project: payload.id })
      .select("_id")
      .lean();
    const stageIds = stages.map((s) => s._id);

    await Promise.all([
      Submission.deleteMany({ stage: { $in: stageIds } }),
      Task.deleteMany({ stage: { $in: stageIds } }),
      StageProgress.deleteMany({ stage: { $in: stageIds } }),
      Stage.deleteMany({ project: payload.id }),
      Project.findByIdAndDelete(payload.id),
    ]);

    await invalidateCache(`project-active:pg${program}:*`);
    await invalidateCache(`projects:pg${program}:*`);

    await AuditLogService.record(request, {
      action: "DELETE_PROJECT",
      category: "tasks",
      description: `Deleted project "${project.title}"`,
      details: { projectId: payload.id, title: project.title },
    });

    return Response.json(
      { success: true, message: "Project deleted successfully" },
      { status: 200 },
    );
  });
}

export async function getProjectStages(
  request: Request,
  payload: { projectId: string },
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "general");
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
    const body = await fetchWithCache(
      `project-stages:pg${program}:${payload.projectId}`,
      3600,
      async () => {
        const stages = await Stage.find({ project: payload.projectId }).lean();
        return stages;
      },
    );
    return Response.json({ success: true, body }, { status: 200 });
  });
}
