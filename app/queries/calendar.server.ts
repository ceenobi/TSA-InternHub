import { getCalendarData } from "~/.server/action/calendar";
import type { CalendarEvent, ProjectData, StageData, TaskData } from "~/types";

export type CalendarQueryResult = {
  project: ProjectData | null;
  stages: StageData[];
  tasks: TaskData[];
  events: CalendarEvent[];
};

export const getCalendarQuery = (request: Request) => {
  return {
    queryKey: ["calendar"],
    queryFn: async () => {
      const response = await getCalendarData(request);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch calendar data");
      }
      const data = await response.json();
      return data.body as CalendarQueryResult;
    },
  };
};
