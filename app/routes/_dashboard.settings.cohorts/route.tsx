import { RiInformationFill } from "@remixicon/react";
import { dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";
import { Await, useOutletContext } from "react-router";
import { createCohort, updateCohortStatus } from "~/.server/action/cohort";
import { PageSection } from "~/components/provider/page-wrapper";
import { CanPermit } from "~/components/provider/rbac-permit";
import AccessDenied from "~/components/ui/access-denied";
import { Alert, AlertTitle } from "~/components/ui/alert";
import DataError from "~/components/ui/data-error";
import { CohortSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { getCohortsQuery } from "~/queries/cohorts.server";
import type { UserData } from "~/types";
import type { Route } from "./+types/route";
import AddCohort from "./add-cohort";
import ListCohort from "./list-cohort";
import { requirePermission } from "~/middleware/auth.middleware";

export const middleware = [requirePermission("MANAGE_COHORTS")];

interface CohortsProps {
  user: UserData;
}

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  if (payload.intent === "add-cohort") {
    return await createCohort(request, payload);
  }
  if (payload.intent === "update-cohort") {
    return await updateCohortStatus(request, payload);
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const queryClient = getQueryClientRsc();
  const cohorts = queryClient.ensureQueryData(getCohortsQuery(request));
  return {
    dehydratedState: dehydrate(queryClient),
    cohorts,
  };
}

export default function Cohorts({ loaderData }: Route.ComponentProps) {
  const { user } = useOutletContext<CohortsProps>();
  const { cohorts } = loaderData;
  return (
    <>
      <CanPermit
        user={user}
        permission="MANAGE_COHORTS"
        fallback={<AccessDenied />}
      >
        <PageSection index={2} className="space-y-8">
          <AddCohort />
          <Alert className="max-w-full rounded-sm border-amber-200 bg-amber-50 text-amber-900 dark:border-blue-900 dark:bg-blue-900/40 dark:text-blue-50">
            <RiInformationFill />
            <AlertTitle>
              View current and past cohorts of your program. Click the card
              options to toggle the cohort status.
            </AlertTitle>
          </Alert>
          <Suspense fallback={<CohortSkeleton />}>
            <Await resolve={cohorts} errorElement={<DataError />}>
              {(resolvedCohorts) => (
                <ListCohort
                  cohorts={resolvedCohorts?.cohorts}
                  meta={
                    resolvedCohorts?.meta ?? {
                      totalPages: 0,
                      hasMore: false,
                      currentPage: 1,
                    }
                  }
                  user={user}
                />
              )}
            </Await>
          </Suspense>
        </PageSection>
      </CanPermit>
    </>
  );
}
