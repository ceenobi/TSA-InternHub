import { getProjectTaskScoreBoard } from "~/.server/action/project";
import type { ScoreBoardEntry } from "~/types";

export const getScoreBoardQuery = (request: Request) => {
  return {
    queryKey: ["scoreboard"],
    queryFn: async () => {
      const response = await getProjectTaskScoreBoard(request);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch scoreboard");
      }
      const data = await response.json();
      return data.body as ScoreBoardEntry[];
    },
  };
};