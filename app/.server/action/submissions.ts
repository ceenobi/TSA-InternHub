import Submission from "../model/submission";
import { tryCatchWrapper } from "~/lib/tryCatchWrapper";
import { checkRateLimit } from "../utils/rate-limit";
import { auth } from "../services/better-auth";
import { fetchWithCache } from "../utils/cache";
import logger from "../config/logger";

export async function getUserTaskSubmissions({
  request,
  taskId,
  page = 1,
  limit = 20,
}: {
  request: Request;
  taskId?: string;
  page?: number;
  limit?: number;
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
    const { id: userId } = session.user;
    const cacheKey = `submissions:user${userId}:task${taskId ?? "all"}:${page}`;

    const body = await fetchWithCache(cacheKey, 300, async () => {
      const dbFilter: Record<string, any> = { user: userId };
      if (taskId) {
        dbFilter.task = taskId;
      }
      const total = await Submission.countDocuments(dbFilter);
      const submissions = await Submission.find(dbFilter)
        .populate({ path: "task", select: "title maxScore" })
        .sort({ submittedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      return {
        submissions,
        meta: {
          currentPage: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: (page - 1) * limit + submissions.length < total,
        },
      };
    });
    return Response.json({
      success: true,
      message: "Submissions fetched successfully",
      body,
    });
  });
}