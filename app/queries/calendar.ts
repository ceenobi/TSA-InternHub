import type { CalendarQueryResult } from "~/queries/calendar.server";

export const getCalendarClientQuery = (request: Request) => {
  return {
    queryKey: ["calendar"],
    queryFn: async () => {
      const response = await fetch("/api/v1/calendar", {
        headers: request.headers,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch calendar data");
      }
      const data = await response.json();
      return data.body as CalendarQueryResult;
    },
  };
};
