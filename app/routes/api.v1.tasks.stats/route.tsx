import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  const { getTaskStatsForUser } = await import("~/.server/action/task");
  return getTaskStatsForUser(request);
}
