import { fetchDashboardData } from "~/.server/action/dashboard";
import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  return fetchDashboardData(request);
}
