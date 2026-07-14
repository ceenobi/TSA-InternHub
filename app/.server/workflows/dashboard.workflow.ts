import type { WorkflowContext } from "@upstash/workflow";
import logger from "../config/logger.js";
import getRedisClient from "../config/redis.js";
import Cohort from "../model/cohort";
import Project from "../model/project";
import Submission from "../model/submission";

type DashboardSummary = {
  cohortsProcessed: number;
  totalUsersCount: number;
  pendingSubmissionsCount: number;
  activeProjectsCount: number;
  lastRefreshed: string;
};

const CACHE_KEY = "dashboard:global-summary";
const CACHE_TTL = 300;

export const runDashboardRefreshWorkflow = async (
  context: WorkflowContext<Record<string, never>>,
) => {
  const result = await context.run<DashboardSummary>(
    "refresh-dashboard-cache",
    async () => {
      const now = new Date();

      const [activeProjects, activeCohorts, pendingSubmissionsCount] =
        await Promise.all([
          Project.find({ status: "active" })
            .select("_id cohort title")
            .lean(),
          Cohort.find({ status: "active" })
            .select("_id program members")
            .lean(),
          Submission.countDocuments({ status: "submitted" }),
        ]);

      const totalUsersCount = activeCohorts.reduce(
        (sum, c) => sum + (c.members?.length || 0),
        0,
      );

      const summary: DashboardSummary = {
        cohortsProcessed: activeCohorts.length,
        totalUsersCount,
        pendingSubmissionsCount,
        activeProjectsCount: activeProjects.length,
        lastRefreshed: now.toISOString(),
      };

      const redis = getRedisClient();
      if (redis) {
        await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(summary));
      }

      logger.info({ summary }, "Dashboard cache refresh complete");

      return summary;
    },
  );

  return result;
};
