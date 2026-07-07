import { RiArrowLeftLine } from "@remixicon/react";
import { dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";
import {
  Await,
  Link,
  Outlet,
  useLocation,
  useOutletContext,
} from "react-router";
import { createStage, deleteStage, updateStage } from "~/.server/action/stage";
import { PageSection } from "~/components/provider/page-wrapper";
import { CanPermit } from "~/components/provider/rbac-permit";
import DataError from "~/components/ui/data-error";
import { Separator } from "~/components/ui/separator";
import { ProjectListSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { requirePermission } from "~/middleware/auth.middleware";
import { getProjectStagesQuery } from "~/queries/projects.server";
import type { UserData } from "~/types";
import type { Route } from "./+types/route";
import CreateStage from "./create-stage";
import StageList from "./stage-list";

export const middleware = [requirePermission("MANAGE_COHORTS", "action")];

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  if (payload.intent === "create-stage") {
    return await createStage(request, payload);
  }
  if (payload.intent === "update-stage") {
    return await updateStage(request, payload);
  }
  if (payload.intent === "delete-stage") {
    return await deleteStage(request, payload);
  }
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const queryClient = getQueryClientRsc();
  const stages = queryClient.ensureQueryData(
    getProjectStagesQuery(request, { projectId: params.projectId }),
  );
  return {
    dehydratedState: dehydrate(queryClient),
    stages,
  };
}

export default function StagesRoute({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { stages } = loaderData;
  const { user } = useOutletContext() as { user: UserData };
  const projectId = params.projectId;
  const location = useLocation();
  const currentPath = location.pathname === `/projects/${projectId}/stages`;

  return (
    <>
      {currentPath ? (
        <PageSection index={0}>
          <Separator className="mb-4" />
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-[13px] mb-4 hover:underline text-muted-foreground hover:dark:text-white"
          >
            <RiArrowLeftLine size={13} /> Back to projects
          </Link>
          <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Stages
              </h1>
              <p className="text-muted-foreground text-sm">
                Create and manage project stages.
              </p>
            </div>
            <CanPermit user={user} permission="MANAGE_COHORTS">
              <CreateStage projectId={projectId} />
            </CanPermit>
          </div>

          <PageSection index={1} className="space-y-6">
            <Suspense fallback={<ProjectListSkeleton />}>
              <Await resolve={stages} errorElement={<DataError />}>
                {(resolvedStages) => (
                  <StageList
                    stages={resolvedStages}
                    user={user}
                    projectId={projectId}
                  />
                )}
              </Await>
            </Suspense>
          </PageSection>
        </PageSection>
      ) : (
        <Outlet context={{ user }} />
      )}
    </>
  );
}
