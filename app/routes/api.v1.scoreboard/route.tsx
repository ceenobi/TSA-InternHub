import { getProjectTaskScoreBoard } from "~/.server/action/project";
import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  return getProjectTaskScoreBoard(request);
}
