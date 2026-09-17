import { fetchProgramProjects } from "~/.server/action/project";
import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 20;
  const query = url.searchParams.get("query") || undefined;
  const status = url.searchParams.get("status") as
    | "upcoming"
    | "active"
    | "completed"
    | "on-hold"
    | undefined;

  return fetchProgramProjects({ request, page, limit, query, status });
}
