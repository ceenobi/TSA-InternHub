import { fetchAnnouncements } from "~/.server/action/announcement";
import { fetchAllAuditLogs } from "~/.server/action/audit-logs";
import { getCalendarData } from "~/.server/action/calendar";
import { getActiveCohortWithMembers } from "~/.server/action/cohort";
import { getProjectTaskScoreBoard } from "~/.server/action/project";
import { getTaskStatsForAdmins, getTaskStatsForUser } from "~/.server/action/task";
import { fetchTickets } from "~/.server/action/ticket";
import Cohort from "~/.server/model/cohort";
import { auth } from "~/.server/services/better-auth";
import getRedisClient from "~/.server/config/redis";
import { fetchWithCache } from "~/.server/utils/cache";
import { checkRateLimit } from "~/.server/utils/rate-limit";
import { tryCatchWrapper } from "~/lib/tryCatchWrapper";
import User from "../model/user";

type GlobalSummary = {
  cohortsProcessed: number;
  totalUsersCount: number;
  pendingSubmissionsCount: number;
  activeProjectsCount: number;
  lastRefreshed: string;
};

async function getGlobalSummary(): Promise<GlobalSummary | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    const data = await redis.get("dashboard:global-summary");
    if (typeof data === "string") return JSON.parse(data);
    return data as GlobalSummary | null;
  } catch {
    return null;
  }
}

export async function fetchDashboardData(request: Request) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "general");
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = session.user;
    const isAdmin = user.role === "admin" || user.role === "super_admin";
    const isSuperAdmin = user.role === "super_admin";

    const url = new URL(request.url);
    const selectedProgram = url.searchParams.get("program") || undefined;

    const cacheKey = `dashboard:uid${user.id}:pg${selectedProgram ?? "all"}`;
    const body = await fetchWithCache(cacheKey, 120, async () => {
      if (isAdmin) {
        const programFilter = isSuperAdmin ? selectedProgram : undefined;

        const [globalSummary, statsRes, cohortRes, scoreboardRes, ticketsRes, auditRes, announcementsRes] =
          await Promise.all([
            getGlobalSummary(),
            getTaskStatsForAdmins(request, programFilter).then((r) => r.json()),
            getActiveCohortWithMembers(request, programFilter).then((r) =>
              r.json(),
            ),
            getProjectTaskScoreBoard(request).then((r) => r.json()),
            fetchTickets({
              request,
              page: 1,
              limit: 5,
              query: undefined,
              status: undefined,
              priority: undefined,
              category: undefined,
            }).then((r) => r.json()),
            fetchAllAuditLogs({ request, page: 1, limit: 5 }).then((r) =>
              r.json(),
            ),
            fetchAnnouncements({ request, page: 1 }).then((r) => r.json()),
          ]);

        const stats = statsRes.body;
        const cohort = cohortRes.body;
        const scoreboard = scoreboardRes.body;
        const tickets = ticketsRes.body;
        const auditLogs = auditRes.body;
        const announcements = announcementsRes.body;

        let programs: string[] = [];
        if (isSuperAdmin) {
          programs = (await Cohort.distinct("program")) as string[];
        }

        return {
          role: "admin",
          isSuperAdmin,
          programs,
          selectedProgram: selectedProgram ?? null,
          summary: {
            totalUsers: globalSummary?.totalUsersCount ?? stats?.summary?.totalUsers ?? 0,
            activeUsers: stats?.summary?.activeUsers ?? 0,
            suspendedUsers: stats?.summary?.suspendedUsers ?? 0,
            totalSubmissions: globalSummary?.pendingSubmissionsCount ?? stats?.summary?.totalSubmissions ?? 0,
            pendingCount: globalSummary?.pendingSubmissionsCount ?? stats?.summary?.pendingCount ?? 0,
            averageScore: stats?.summary?.averageScore ?? 0,
            onTimeRate: stats?.summary?.onTimeRate ?? 0,
            totalTasks: stats?.summary?.totalTasks ?? 0,
          },
          scoreDistribution: stats?.trends?.scoreDistribution ?? [],
          submissionActivity: stats?.trends?.submissionActivity ?? [],
          stageCompletion: stats?.trends?.stageCompletion ?? [],
          topUsers: stats?.trends?.topUsers ?? [],
          cohort,
          scoreboard: scoreboard ?? [],
          tickets: {
            open: tickets?.summary?.openTickets ?? 0,
            inProgress: tickets?.summary?.inProgressTickets ?? 0,
            resolved: tickets?.summary?.resolvedTickets ?? 0,
            recent: tickets?.tickets?.slice(0, 5) ?? [],
          },
          auditLogs: auditLogs?.logs?.slice(0, 5) ?? [],
          announcements: announcements?.announcements?.slice(0, 3) ?? [],
        };
      }

      const [statsRes, calendarRes, scoreboardRes, announcementsRes] =
        await Promise.all([
          getTaskStatsForUser(request).then((r) => r.json()),
          getCalendarData(request).then((r) => r.json()),
          getProjectTaskScoreBoard(request).then((r) => r.json()),
          fetchAnnouncements({ request, page: 1 }).then((r) => r.json()),
        ]);

      const stats = statsRes.body;
      const calendar = calendarRes.body;
      const scoreboard = scoreboardRes.body;
      const announcements = announcementsRes.body;

      const dbUser = await User.findById(user.id)
        .lean()
        .select("cohort");

      return {
        role: "user",
        summary: {
          tasksCompleted: stats?.summary?.tasksCompleted ?? 0,
          averageScore: stats?.summary?.averageScore ?? 0,
          onTimeRate: stats?.summary?.onTimeRate ?? 0,
          stageProgress: stats?.summary?.stageProgress ?? 0,
          tasksSubmitted: stats?.summary?.tasksSubmitted ?? 0,
          tasksReturned: stats?.summary?.tasksReturned ?? 0,
          totalTasks: stats?.summary?.totalTasks ?? 0,
        },
        scoreTrend: stats?.trends?.scoreTrend?.slice(-10) ?? [],
        stageBreakdown: stats?.trends?.stageBreakdown ?? [],
        calendar: calendar ?? null,
        scoreboard: scoreboard ?? [],
        cohortName: dbUser?.cohort ?? "",
        announcements: announcements?.announcements?.slice(0, 3) ?? [],
      };
    });

    return Response.json({ success: true, body });
  });
}
