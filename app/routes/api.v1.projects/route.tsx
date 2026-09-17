import {
  getActiveCohortWithMembers,
} from "~/.server/action/cohort";
import { getCurrentProject } from "~/.server/action/project";
import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  const [cohortsRes, currentProjectRes] = await Promise.all([
    getActiveCohortWithMembers(request),
    getCurrentProject(request),
  ]);

  const cohorts = await cohortsRes.json();
  const currentProject = await currentProjectRes.json();

  return Response.json({
    success: true,
    body: {
      cohorts: cohorts.body,
      currentProject: currentProject.body,
    },
  });
}
