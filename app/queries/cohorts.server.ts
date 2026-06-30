import { fetchCohorts, getActiveCohortWithMembers, getProgramCoordinators } from "~/.server/action/cohort";
import type { CohortDataType, UsePaginateProps, UserData } from "~/types";

export type CohortsQueryResult = {
  cohorts: CohortDataType[];
  meta: UsePaginateProps;
};

export const getCohortsQuery = (request: Request) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 10;
  const query = url.searchParams.get("query") || undefined;
  return {
    queryKey: ["cohorts", page, limit, query],
    queryFn: async () => {
      const response = await fetchCohorts({
        request,
        page,
        limit,
        query,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch cohorts");
      }
      const data = await response.json();
      return data.body as CohortsQueryResult;
    },
  };
};

export const getActiveCohortWithMembersQuery = (request: Request) => {
  return {
    queryKey: ["activeCohortWithMembers"],
    queryFn: async () => {
      const response = await getActiveCohortWithMembers(request);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch active cohort with members");
      }
      const data = await response.json();
      return data.body as CohortDataType;
    },
  };
};

export const getProgramCoordinatorsQuery = (request: Request) => {
  return {
    queryKey: ["coordinators"],
    queryFn: async () => {
      const response = await getProgramCoordinators(request);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch program coordinators");
      }
      const data = await response.json();
      return data.body as UserData[];
    },
  };
};




