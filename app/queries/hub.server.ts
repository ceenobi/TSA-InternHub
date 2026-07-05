import type { HubLoaderData } from "~/types";

export const getHubDataQuery = (request: Request) => {
  return {
    queryKey: ["hub-data"],
    queryFn: async () => {
      const { fetchHubData } = await import("~/.server/action/hub");
      const response = await fetchHubData(request);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch hub data");
      }
      const data = await response.json();
      return data.body as HubLoaderData;
    },
  };
};
