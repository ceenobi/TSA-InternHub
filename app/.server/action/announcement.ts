import z from "zod";
import { createAnnouncementSchema } from "~/lib/schemaValidation";
import { tryCatchWrapper } from "~/lib/tryCatchWrapper";
import logger from "../config/logger";
import Announcement from "../model/announcement";
import Cohort from "../model/cohort";
import User from "../model/user";
import { AuditLogService } from "../services/auditlog.service";
import { auth } from "../services/better-auth";
import { NotificationService } from "../services/notification.service";
import { fetchWithCache, invalidateCache } from "../utils/cache";
import { checkRateLimit } from "../utils/rate-limit";

const PAGE_SIZE = 10;

export async function fetchAnnouncements({
  request,
  page,
  priority,
  target,
}: {
  request: Request;
  page: number;
  priority?: string;
  target?: string;
}) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "general");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { user: sessionUser } = session;
    const isAdmin =
      sessionUser.role === "admin" || sessionUser.role === "super_admin";
    const dbUser = await User.findById(sessionUser.id)
      .lean()
      .select("cohort role");

    const cacheKey = `announcements:p${page}:uid${sessionUser.id}:pri${priority ?? "all"}:tgt${target ?? "all"}`;
    const body = await fetchWithCache(cacheKey, 120, async () => {
      const now = new Date();
      const filter: Record<string, any> = {
        $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }],
      };

      if (priority && priority !== "all") {
        filter.priority = priority;
      }

      if (!isAdmin && dbUser) {
        const userCohort = dbUser.cohort;
        const userProgram =
          userCohort &&
          (
            await Cohort.findOne({ cohort: userCohort }).lean().select("program")
          )?.program;

        const accessFilter: Record<string, any>[] = [
          { target: "all" },
          ...(userProgram ? [{ target: "program", targetProgram: userProgram }] : []),
          ...(userCohort
            ? [
                {
                  target: "cohort",
                  targetCohort: (
                    await Cohort.findOne({ cohort: userCohort }).lean()
                  )?._id,
                },
              ]
            : []),
        ];

        if (target && target !== "all") {
          filter.target = target;
        }

        filter.$or = accessFilter;
      }

      if (isAdmin && target && target !== "all") {
        filter.target = target;
      }

      const total = await Announcement.countDocuments(filter);
      const announcements = await Announcement.find(filter)
        .populate("createdBy", "_id name email image")
        .populate("targetCohort", "cohort")
        .sort({ pinned: -1, createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean();

      return {
        announcements,
        meta: {
          currentPage: Number(page),
          total,
          totalPages: Math.ceil(total / PAGE_SIZE),
          hasMore: page * PAGE_SIZE < total,
        },
      };
    });

    return Response.json({ success: true, body });
  });
}

export async function createAnnouncement(
  request: Request,
  payload: unknown,
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

    const { user: sessionUser } = session;
    if (
      sessionUser.role !== "admin" &&
      sessionUser.role !== "super_admin"
    ) {
      return Response.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    const parsed = createAnnouncementSchema.safeParse(payload);
    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          message: "Invalid data",
          errors: z.treeifyError(parsed.error),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const announcement = await Announcement.create({
      title: data.title,
      content: data.content,
      createdBy: sessionUser.id,
      target: data.target,
      targetCohort: data.targetCohort || undefined,
      targetProgram: data.targetProgram || undefined,
      priority: data.priority,
      pinned: data.pinned,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });

    const populated = await Announcement.findById(announcement._id)
      .populate("createdBy", "_id name email image")
      .populate("targetCohort", "cohort")
      .lean();

    await invalidateCache("announcements:*");

    // Notify targeted users
    try {
      const targetUsers = await getTargetUserIds(
        data.target,
        data.targetCohort,
        data.targetProgram,
      );
      for (const userId of targetUsers) {
        if (userId !== sessionUser.id) {
          await NotificationService.send({
            userId,
            type: "announcement",
            title: `New announcement: ${data.title}`,
            message: data.content.slice(0, 200),
            metadata: { announcementId: announcement._id.toString() },
          });
        }
      }
    } catch (err) {
      logger.error(err, "Failed to send announcement notifications");
    }

    await AuditLogService.record(request, {
      action: "CREATE_ANNOUNCEMENT",
      category: "settings",
      description: `Created announcement "${data.title}"`,
      details: { announcementId: announcement._id.toString(), target: data.target },
      status: "success",
    });

    return Response.json({
      success: true,
      message: "Announcement created",
      body: populated,
    });
  });
}

export async function deleteAnnouncement(
  request: Request,
  payload: { announcementId: string },
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

    const { user: sessionUser } = session;
    if (
      sessionUser.role !== "admin" &&
      sessionUser.role !== "super_admin"
    ) {
      return Response.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    const { announcementId } = payload;
    const announcement = await Announcement.findById(announcementId).lean();
    if (!announcement) {
      return Response.json(
        { success: false, message: "Announcement not found" },
        { status: 404 },
      );
    }

    await Announcement.findByIdAndDelete(announcementId);
    await invalidateCache("announcements:*");

    await AuditLogService.record(request, {
      action: "DELETE_ANNOUNCEMENT",
      category: "settings",
      description: `Deleted announcement "${announcement.title}"`,
      details: { announcementId },
      status: "success",
    });

    return Response.json({ success: true, message: "Announcement deleted" });
  });
}

export async function togglePinAnnouncement(
  request: Request,
  payload: { announcementId: string },
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

    const { user: sessionUser } = session;
    if (
      sessionUser.role !== "admin" &&
      sessionUser.role !== "super_admin"
    ) {
      return Response.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    const { announcementId } = payload;
    const announcement = await Announcement.findById(announcementId).lean();
    if (!announcement) {
      return Response.json(
        { success: false, message: "Announcement not found" },
        { status: 404 },
      );
    }

    await Announcement.findByIdAndUpdate(announcementId, {
      $set: { pinned: !announcement.pinned },
    });
    await invalidateCache("announcements:*");

    return Response.json({
      success: true,
      message: announcement.pinned
        ? "Announcement unpinned"
        : "Announcement pinned",
    });
  });
}

async function getTargetUserIds(
  target: "all" | "cohort" | "program",
  cohortId?: string,
  program?: string,
): Promise<string[]> {
  if (target === "all") {
    const users = await User.find({ role: "user" }).lean().select("_id");
    return users.map((u) => u._id.toString());
  }

  if (target === "program" && program) {
    const cohorts = await Cohort.find({ program }).lean().select("_id");
    const cohortIds = cohorts.map((c) => c.cohort);
    const users = await User.find({ cohort: { $in: cohortIds } })
      .lean()
      .select("_id");
    return users.map((u) => u._id.toString());
  }

  if (target === "cohort" && cohortId) {
    const cohort = await Cohort.findById(cohortId).lean().select("members");
    return (cohort?.members ?? []).map((id: any) => id.toString());
  }

  return [];
}
