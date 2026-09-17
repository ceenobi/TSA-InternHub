import { fetchAllAuditLogs } from "~/.server/action/audit-logs";
import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 20;
  const category = url.searchParams.get("category") || "all";

  return fetchAllAuditLogs({ request, page, limit, category });
}
