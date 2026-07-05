import { fetchAnnouncements } from "~/.server/action/announcement";
import type { AnnouncementsQueryResult } from "~/types";

export const getAnnouncementsQuery = (request: Request) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const priority = url.searchParams.get("priority") || "all";
  const target = url.searchParams.get("target") || "all";
  return {
    queryKey: ["announcements", page, priority, target],
    queryFn: async () => {
      const response = await fetchAnnouncements({
        request,
        page,
        priority,
        target,
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
