import type { CohortDataType, ScoreBoardEntry } from "~/types";

type ProjectsQueryResult = {
  projects: any[];
  meta: {
    currentPage: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
};

export const getProjectsAllClientQuery = (request: Request) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 20;
  const query = url.searchParams.get("query") || undefined;
  const status = url.searchParams.get("status") || undefined;
  return {
    queryKey: ["projects", page, limit, query, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (query) params.set("query", query);
      if (status) params.set("status", status);
      const response = await fetch(`/api/v1/projects/all?${params}`, {
        headers: request.headers,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch projects");
      }
      const data = await response.json();
      return data.body as ProjectsQueryResult;
    },
  };
};

export const getScoreBoardClientQuery = (request: Request) => {
  return {
    queryKey: ["scoreboard"],
    queryFn: async () => {
      const response = await fetch("/api/v1/scoreboard", {
        headers: request.headers,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch scoreboard");
      }
      const data = await response.json();
      return data.body as ScoreBoardEntry[];
    },
  };
};

export const getProjectsLayoutClientQuery = (request: Request) => {
  return {
    queryKey: ["projects-layout"],
    queryFn: async () => {
      const response = await fetch("/api/v1/projects", {
        headers: request.headers,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch projects layout data");
      }
      const data = await response.json();
      return data.body as {
        cohorts: CohortDataType;
        currentProject: any;
      };
    },
  };
};

export const getCohortsClientQuery = (request: Request) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 10;
  const query = url.searchParams.get("query") || undefined;
  return {
    queryKey: ["cohorts", page, limit, query],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (query) params.set("query", query);
      const response = await fetch(`/api/v1/cohorts?${params}`, {
        headers: request.headers,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch cohorts");
      }
      const data = await response.json();
      return data.body as {
        cohorts: CohortDataType[];
        meta: { currentPage: number; limit: number; total: number; totalPages: number; hasMore: boolean };
      };
    },
  };
};
