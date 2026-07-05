import { fetchDashboardData } from "~/.server/action/dashboard";
import type { AdminDashboardData, UserDashboardData } from "~/types";

export const getDashboardQuery = (request: Request) => {
  return {
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await fetchDashboardData(request);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch dashboard data");
      }
      const data = await response.json();
      return data.body as UserDashboardData | AdminDashboardData;
    },
  };
};
