import type { WorkflowContext } from "@upstash/workflow";
import logger from "../config/logger.js";
import Cohort from "../model/cohort";
import Project from "../model/project";
import Submission from "../model/submission";

type DashboardCacheResult = {
  cohortsProcessed: number;
  totalUsersCount: number;
  pendingSubmissionsCount: number;
  activeProjectsCount: number;
};

export const runDashboardRefreshWorkflow = async (
  context: WorkflowContext<Record<string, never>>,
) => {
  const result = await context.run<DashboardCacheResult>(
    "refresh-dashboard-cache",
    async () => {
      const now = new Date();

      const activeProjects = await Project.find({
        status: "active",
      })
        .select("_id cohort title")
        .lean();

      const activeCohorts = await Cohort.find({ status: "active" })
        .select("_id program members")
        .lean();

      const totalUsersCount = activeCohorts.reduce(
        (sum, c) => sum + (c.members?.length || 0),
        0,
      );

      const pendingSubmissionsCount = await Submission.countDocuments({
        status: "submitted",
      });

      const progress = {
        lastRefreshed: now.toISOString(),
        totalUsers: totalUsersCount,
        activeProjects: activeProjects.length,
        activeCohorts: activeCohorts.length,
        pendingSubmissions: pendingSubmissionsCount,
      };

      logger.info(
        { progress },
        "Dashboard cache refresh complete",
      );

      return {
        cohortsProcessed: activeCohorts.length,
        totalUsersCount,
        pendingSubmissionsCount,
        activeProjectsCount: activeProjects.length,
      };
    },
  );

  logger.info(
    `Dashboard refresh: ${result.cohortsProcessed} cohorts, ` +
      `${result.totalUsersCount} users, ` +
      `${result.pendingSubmissionsCount} pending submissions, ` +
      `${result.activeProjectsCount} active projects`,
  );

  return result;
};
