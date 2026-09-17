import { fetchCohorts } from "~/.server/action/cohort";
import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 10;
  const query = url.searchParams.get("query") || undefined;

  return fetchCohorts({ request, page, limit, query });
}
