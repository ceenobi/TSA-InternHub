import { getCohortsStats } from "~/.server/action/cohort";
import type { Route } from "./+types/api.v1.cohorts.$";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  if (url.pathname.endsWith("/stats")) {
    return getCohortsStats(request);
  }
  return Response.json(
    { success: false, message: "Endpoint not found" },
    { status: 404 },
  );
}
