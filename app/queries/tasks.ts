import type { SubmissionData, TasksPageData } from "~/types";

export const getTasksClientQuery = (request: Request) => {
  return {
    queryKey: ["tasks"],
    queryFn: async () => {
      const response = await fetch("/api/v1/tasks", {
        headers: request.headers,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch tasks data");
      }
      const data = await response.json();
      return data.body as TasksPageData;
    },
  };
};

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

export const getTaskStatsClientQuery = (request: Request) => {
  return {
    queryKey: ["task-stats"],
    queryFn: async () => {
      const response = await fetch("/api/v1/tasks/stats", {
        headers: request.headers,
      });
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

export const getTasksSubmissionsClientQuery = (request: Request) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 20;
  const taskId = url.searchParams.get("taskId") || undefined;
  return {
    queryKey: ["tasks-submissions", page, limit, taskId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (taskId) params.set("taskId", taskId);
      const response = await fetch(`/api/v1/tasks/submissions?${params}`, {
        headers: request.headers,
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
