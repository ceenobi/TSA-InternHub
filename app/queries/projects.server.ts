import { fetchProgramProjects, getCurrentProject, getProjectStages } from "~/.server/action/project";
import type { ProjectData, StageData, UsePaginateProps } from "~/types";

export type ProjectsQueryResult = {
  projects: ProjectData[];
  meta: UsePaginateProps;
};

export const getCurrentProjectQuery = (request: Request) => {
  return {
    queryKey: ["current-project"],
    queryFn: async () => {
      const response = await getCurrentProject(request)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch current project");
      }
      const data = await response.json();
      return data.body as ProjectData;
    },
  };
};

export const getProjectsQuery = (request: Request) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 20;
  const query = url.searchParams.get("query") || undefined;
  const status = url.searchParams.get("status") as
    | "upcoming"
    | "active"
    | "completed"
    | "on-hold"
    | undefined;
  return {
    queryKey: ["projects", page, limit, query, status],
    queryFn: async () => {
      const response = await fetchProgramProjects({
        request,
        page,
        limit,
        query,
        status,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch cohorts");
      }
      const data = await response.json();
      return data.body as ProjectsQueryResult;
    },
  };
};

export const getProjectStagesQuery = (request: Request, payload: { projectId: string }) => {
  return {
    queryKey: ["project-stages", payload.projectId],
    queryFn: async () => {
      const response = await getProjectStages(request, payload);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch project stages");
      }
      const data = await response.json();
      return data.body as StageData[];
    },
  };
};
