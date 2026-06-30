import z from "zod";
import { cohortSchema } from "~/lib/schemaValidation";
import { tryCatchWrapper } from "~/lib/tryCatchWrapper";
import type { CohortSchemaType } from "~/types";
import logger from "../config/logger";
import Cohort from "../model/cohort";
import InviteCode from "../model/inviteCode";
import User from "../model/user";
import { AuditLogService } from "../services/auditlog.service";
import { auth } from "../services/better-auth";
import { fetchWithCache, invalidateCache } from "../utils/cache";
import { checkRateLimit } from "../utils/rate-limit";

export async function createCohort(
  request: Request,
  payload: CohortSchemaType,
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
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

    const result = cohortSchema.safeParse(payload);
    if (!result.success) {
      logger.error("Invalid profile data format");
      return Response.json(
        {
          success: false,
          message: "Invalid dataschema",
          errors: z.treeifyError(result.error),
        },
        { status: 400 },
      );
    }
    //check active cohort
    const activeCohort = await Cohort.findOne({
      status: "active",
      program: result.data.program,
    }).lean();
    if (activeCohort) {
      logger.error("A cohort is already active, end the current cohort first");
      return Response.json(
        {
          success: false,
          message: "A cohort is already active, end the current cohort first",
        },
        { status: 400 },
      );
    }
    //cohort creation logic
    const cohortExists = await Cohort.findOne({
      cohort: result.data.cohort,
      program: result.data.program,
    }).lean();
    if (cohortExists) {
      logger.error("Cohort already exists");
      return Response.json(
        { success: false, message: "Cohort already exists" },
        { status: 400 },
      );
    }
    const cohort = await Cohort.create({
      ...result.data,
      cohort: result.data.cohort.toUpperCase(),
    });
    //update user cohort
    await auth.api.updateUser({
      body: {
        cohort: result.data.cohort.toUpperCase(),
      },
      headers: request.headers,
      asResponse: true,
    });
    await invalidateCache(`cohorts:pg${cohort.program}*`);

    await AuditLogService.record(request, {
      action: "CREATE_COHORT",
      category: "settings",
      description: `Created cohort "${result.data.cohort}" (${result.data.program})`,
      details: {
        cohortId: cohort._id.toString(),
        cohort: result.data.cohort,
        program: result.data.program,
      },
    });

    return Response.json(
      { success: true, message: "Cohort created successfully", cohort },
      { status: 201 },
    );
  });
}

export async function fetchCohorts({
  request,
  page,
  limit,
  query,
}: {
  request: Request;
  page: number;
  limit: number;
  query: string | undefined;
}) {
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
    const cacheKey = `cohorts:pg${program}:p${page}:l${limit}:q${query ?? ""}`;
    const body = await fetchWithCache(cacheKey, 3600, async () => {
      const dbFilter: Record<string, any> = {
        program,
      };
      if (query) {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = { $regex: escaped, $options: "i" };
        dbFilter.$or = [{ cohort: regex }];
      }
      const total = await Cohort.countDocuments(dbFilter);
      const cohorts = await Cohort.find(dbFilter)
        .populate({
          path: "members",
          select: "name email phone role isSuspended",
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      return {
        cohorts,
        meta: {
          currentPage: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
          hasMore: (page - 1) * limit + cohorts.length < total,
        },
      };
    });
    return Response.json({
      success: true,
      message: "Cohorts fetched successfully",
      body,
    });
  });
}

export async function updateCohortStatus(
  request: Request,
  payload: { status: "active" | "inactive"; id: string },
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
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
    if (!payload) {
      logger.error("Invalid payload, status and id are required");
      return Response.json(
        {
          success: false,
          message: "Invalid payload",
        },
        { status: 400 },
      );
    }
    //check cohort
    const findCohort = await Cohort.findById(payload.id).lean();
    if (!findCohort) {
      logger.error("Cohort not found");
      return Response.json(
        {
          success: false,
          message: "Cohort not found",
        },
        { status: 400 },
      );
    }
    //update cohort status
    const updatedCohort = await Cohort.findByIdAndUpdate(
      payload.id,
      { status: payload.status },
      { returnDocument: "after" },
    );
    await invalidateCache(`cohorts:*`);

    await AuditLogService.record(request, {
      action: "UPDATE_COHORT_STATUS",
      category: "settings",
      description: `Updated cohort "${findCohort.cohort}" status to "${payload.status}"`,
      details: {
        cohortId: payload.id,
        cohort: findCohort.cohort,
        status: payload.status,
      },
    });

    return Response.json(
      {
        success: true,
        message: "Cohort status updated",
        cohort: updatedCohort,
      },
      { status: 200 },
    );
  });
}

export async function getActiveCohortWithMembers(request: Request) {
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
    const { program, cohort } = session.user;
    const cacheKey = `cohort-active:pg${program}:co${cohort ?? ""}`;
    const activeCohort = await fetchWithCache(cacheKey, 3600, async () => {
      return await Cohort.findOne({ status: "active", cohort, program })
        .populate({
          path: "members",
          select: "name email phone role",
        })
        .sort({ createdAt: -1 });
    });
    return Response.json({
      success: true,
      message: "Active cohort fetched successfully",
      body: activeCohort,
    });
  });
}

export async function getCohortsStats(request: Request) {
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
    const cohortStats = await fetchWithCache("cohortStats", 3600, async () => {
      // 1. Active Cohort Stats
      const activeCohort = await Cohort.findOne({ status: "active", program });
      let activeCohortStats = null;
      if (activeCohort) {
        const totalInvites = await InviteCode.countDocuments({
          cohort: activeCohort._id,
        });
        const usersInCohort = await User.countDocuments({
          cohort: activeCohort.cohort,
        });
        const suspended = await User.countDocuments({
          cohort: activeCohort.cohort,
          isSuspended: true,
        });
        activeCohortStats = {
          name: activeCohort.cohort,
          totalInvites,
          usersInCohort,
          suspendedUsers: suspended,
        };
      }

      // 2. Program Comparison
      const programComparison = await Cohort.aggregate([
        {
          $lookup: {
            from: "user",
            localField: "name", // Match Cohort name
            foreignField: "cohort", // With User.cohort
            as: "members",
          },
        },
        {
          $facet: {
            allTime: [
              {
                $group: {
                  _id: "$program",
                  totalCohorts: { $sum: 1 },
                  activeCohorts: {
                    $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
                  },
                  totalUsers: { $sum: { $size: "$members" } },
                  suspendedUsers: {
                    $sum: {
                      $size: {
                        $filter: {
                          input: "$members",
                          as: "member",
                          cond: { $eq: ["$$member.isSuspended", true] },
                        },
                      },
                    },
                  },
                },
              },
            ],
            activeSnapshot: [
              { $match: { status: "active" } },
              {
                $group: {
                  _id: "$program",
                  activeCohortCount: { $sum: 1 },
                  totalUsers: { $sum: { $size: "$members" } },
                  suspendedUsers: {
                    $sum: {
                      $size: {
                        $filter: {
                          input: "$members",
                          as: "member",
                          cond: { $eq: ["$$member.isSuspended", true] },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      ]);

      // 3. Top Program
      const topProgram = (programComparison[0]?.allTime as any[]).reduce(
        (prev: any, current: any) =>
          prev.totalUsers > current.totalUsers ? prev : current,
        { totalUsers: 0 },
      );

      // 4. Trends (Last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const trendData = await User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            registrations: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      return { activeCohortStats, programComparison, topProgram, trendData };
    });

    return Response.json({
      success: true,
      message: "Cohort stats fetched successfully",
      body: cohortStats,
    });
  });
}

export async function getProgramCoordinators(request: Request) {
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
    const roles = ["admin", "super_admin"];
    const coordinators = await fetchWithCache(
      "coordinators",
      3600,
      async () => {
        const coordinatorUsers = await User.find({
          role: { $in: roles },
        }).lean();
        return coordinatorUsers;
      },
    );
    return Response.json({
      success: true,
      message: "Cohort stats fetched successfully",
      body: coordinators,
    });
  });
}
