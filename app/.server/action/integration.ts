import { tryCatchWrapper } from "~/lib/tryCatchWrapper";
import Integration from "../model/integration";
import { auth } from "../services/better-auth";
import { fetchWithCache, invalidateCache } from "../utils/cache";
import { checkRateLimit } from "../utils/rate-limit";

const ADMIN_ROLES = ["admin", "super_admin"];

export async function saveIntegration(
  request: Request,
  payload: {
    provider: string;
    label?: string;
    config: Record<string, any>;
    enabledEvents?: string[];
  },
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const { program, role } = session.user;

    if (!ADMIN_ROLES.includes(role)) {
      return Response.json(
        { success: false, message: "Forbidden: Admins only" },
        { status: 403 },
      );
    }

    // Find the active cohort for this program
    const Cohort = (await import("../model/cohort")).default;
    const activeCohort = await Cohort.findOne({
      status: "active",
      program,
    })
      .select("_id")
      .lean();
    if (!activeCohort) {
      return Response.json(
        { success: false, message: "No active cohort found for your program" },
        { status: 400 },
      );
    }

    const existing = await Integration.findOne({
      cohortId: activeCohort._id,
      provider: payload.provider,
    });

    if (existing) {
      existing.config = payload.config;
      if (payload.enabledEvents)
        existing.enabledEvents = payload.enabledEvents as any;
      if (payload.label) existing.label = payload.label;
      await existing.save();
    } else {
      await Integration.create({
        cohortId: activeCohort._id,
        provider: payload.provider,
        label: payload.label || payload.provider,
        config: payload.config,
        enabledEvents: payload.enabledEvents || [],
      });
    }

    await invalidateCache(`integrations:pg${program}:*`);

    return Response.json(
      { success: true, message: "Integration saved successfully" },
      { status: 200 },
    );
  });
}

export async function getIntegrations(request: Request) {
  return tryCatchWrapper(async () => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const { program, role } = session.user;

    if (!ADMIN_ROLES.includes(role)) {
      return Response.json(
        { success: false, message: "Forbidden: Admins only" },
        { status: 403 },
      );
    }

    const Cohort = (await import("../model/cohort")).default;
    const activeCohort = await Cohort.findOne({
      status: "active",
      program,
    })
      .select("_id")
      .lean();
    if (!activeCohort) {
      return Response.json({
        success: true,
        message: "No active cohort",
        body: [],
      });
    }

    const cacheKey = `integrations:pg${program}:co${activeCohort._id}`;
    const integrations = await fetchWithCache(cacheKey, 3600, async () => {
      return await Integration.find({
        cohortId: activeCohort._id,
      }).lean();
    });

    return Response.json({
      success: true,
      message: "integrations fetched",
      body: integrations,
    });
  });
}

export async function deleteIntegration(
  request: Request,
  payload: { provider: string },
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const { program, role } = session.user;

    if (!ADMIN_ROLES.includes(role)) {
      return Response.json(
        { success: false, message: "Forbidden: Admins only" },
        { status: 403 },
      );
    }

    const Cohort = (await import("../model/cohort")).default;
    const activeCohort = await Cohort.findOne({
      status: "active",
      program,
    })
      .select("_id")
      .lean();
    if (!activeCohort) {
      return Response.json(
        { success: false, message: "No active cohort found" },
        { status: 400 },
      );
    }

    await Integration.deleteOne({
      cohortId: activeCohort._id,
      provider: payload.provider,
    });

    await invalidateCache(`integrations:pg${program}:*`);

    return Response.json(
      { success: true, message: "Integration disconnected" },
      { status: 200 },
    );
  });
}
