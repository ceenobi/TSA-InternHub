import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  const { fetchTasksData } = await import("~/.server/action/task");
  return fetchTasksData(request);
}
