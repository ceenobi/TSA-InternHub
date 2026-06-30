import type {
  GradeTaskData,
  SubmissionData,
  TaskData,
  TasksPageData,
} from "~/types";

type TaskSubmissionsQuery = {
  submissions: SubmissionData[];
  meta: {
    currentPage: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
};

export const getTasksQuery = (request: Request) => {
  return {
    queryKey: ["tasks"],
    queryFn: async () => {
      const { fetchTasksData } = await import("~/.server/action/task");
      const response = await fetchTasksData(request);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch tasks data");
      }
      const data = await response.json();
      return data.body as TasksPageData;
    },
  };
};

export const getTasksSubmissionsQuery = (request: Request) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 20;
  const taskId = url.searchParams.get("taskId") || undefined;
  return {
    queryKey: ["tasks-submissions", page, limit, taskId],
    queryFn: async () => {
      const { getUserTaskSubmissions } =
        await import("~/.server/action/submissions");
      const response = await getUserTaskSubmissions({
        request,
        taskId,
        page,
        limit,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch submissions");
      }
      const data = await response.json();
      return data.body as TaskSubmissionsQuery;
    },
  };
};

export const getGradeTaskQuery = (request: Request, taskId: string) => {
  return {
    queryKey: ["grade-task", taskId],
    queryFn: async () => {
      const { fetchGradeTaskData } = await import("~/.server/action/grade");
      const response = await fetchGradeTaskData(request, taskId);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch grade task data");
      }
      const data = await response.json();
      return data.body as GradeTaskData;
    },
  };
};

export const getStageTasksQuery = (request: Request, stageId: string) => {
  return {
    queryKey: ["stage-tasks", stageId],
    queryFn: async () => {
      const { getStageTasks } = await import("~/.server/action/task");
      const response = await getStageTasks({ request, stageId });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch stage tasks");
      }
      const data = await response.json();
      return data.body as TaskData[];
    },
  };
};

export const getTaskStatsQuery = (request: Request) => {
  return {
    queryKey: ["task-stats"],
    queryFn: async () => {
      const { getTaskStatsForUser } = await import("~/.server/action/task");
      const response = await getTaskStatsForUser(request);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch task stats");
      }
      const data = await response.json();
      return data.body as {
        summary: {
          tasksCompleted: number;
          averageScore: number;
          onTimeRate: number;
          stageProgress: number;
          tasksSubmitted: number;
          tasksReturned: number;
          totalTasks: number;
        };
        trends: {
          scoreTrend: {
            date: string;
            score: number;
            maxScore: number;
            percentage: number;
            taskTitle: string;
          }[];
          stageBreakdown: {
            stageId: string;
            stageTitle: string;
            order: number;
            score: number;
            maxScore: number;
            percentage: number;
            status: string;
            passed: boolean;
            passPercentage: number;
          }[];
          submissionSummary: {
            name: string;
            value: number;
            color: string;
          }[];
        };
      };
    },
  };
};

export const getAdminTaskStatsQuery = (request: Request) => {
  return {
    queryKey: ["admin-task-stats"],
    queryFn: async () => {
      const { getTaskStatsForAdmins } = await import("~/.server/action/task");
      const response = await getTaskStatsForAdmins(request);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to fetch admin task stats",
        );
      }
      const data = await response.json();
      return data.body as {
        summary: {
          totalUsers: number;
          activeUsers: number;
          suspendedUsers: number;
          totalSubmissions: number;
          gradedCount: number;
          pendingCount: number;
          returnedCount: number;
          averageScore: number;
          onTimeRate: number;
          totalTasks: number;
          totalStages: number;
        };
        trends: {
          scoreDistribution: { label: string; count: number }[];
          submissionActivity: { date: string; count: number }[];
          stageCompletion: {
            stageId: string;
            stageTitle: string;
            order: number;
            totalUsers: number;
            completedCount: number;
            activeCount: number;
            failedCount: number;
            passPercentage: number;
            hasTasks: boolean;
          }[];
          topUsers: {
            userId: string;
            userName: string;
            averageScore: number;
            submissionsGraded: number;
          }[];
        };
      };
    },
  };
};
