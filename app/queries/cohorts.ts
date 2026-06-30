export const getCohortStatsQuery = (request: Request) => {
  return {
    queryKey: ["cohortsStats"],
    queryFn: async () => {
      const response = await fetch("/api/v1/cohorts/stats", {
        headers: request.headers,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch cohort stats");
      }
      const data = await response.json();
      return data.body as {
        activeCohortStats: any;
        programComparison: any;
        trendData: any;
      };
    },
  };
};
