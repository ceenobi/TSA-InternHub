import type { AnnouncementsQueryResult } from "~/types";

export const getAnnouncementsClientQuery = (request: Request) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const priority = url.searchParams.get("priority") || "all";
  const target = url.searchParams.get("target") || "all";
  return {
    queryKey: ["announcements", page, priority, target],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("priority", priority);
      params.set("target", target);
      const response = await fetch(`/api/v1/announcements?${params}`, {
        headers: request.headers,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch announcements");
      }
      const data = await response.json();
      return data.body as AnnouncementsQueryResult;
    },
  };
};
