import { fetchAnnouncements } from "~/.server/action/announcement";
import { fetchCohorts } from "~/.server/action/cohort";
import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const priority = url.searchParams.get("priority") || "all";
  const target = url.searchParams.get("target") || "all";

  const [announcementsRes, cohortsRes] = await Promise.all([
    fetchAnnouncements({ request, page, priority, target }),
    fetchCohorts({ request, page: 1, limit: 100, query: undefined }),
  ]);

  const announcements = await announcementsRes.json();
  const cohorts = await cohortsRes.json();

  return Response.json({
    success: true,
    body: {
      announcements: announcements.body,
      cohorts: cohorts.body,
    },
  });
}
