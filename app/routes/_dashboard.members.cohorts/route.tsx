import { dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";
import { Await, Outlet, useLocation } from "react-router";
import Search from "~/components/nav/search";
import { PageSection } from "~/components/provider/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import DataError from "~/components/ui/data-error";
import { CohortSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { getCohortsQuery } from "~/queries/cohorts.server";
import type { Route } from "../_dashboard.members.cohorts/+types/route";
import ListCohort from "./list-cohort";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Members Cohorts | TSA InternHub" },
    {
      name: "description",
      content: "Manage your members cohorts.",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const queryClient = getQueryClientRsc();
  const cohorts = queryClient.ensureQueryData(getCohortsQuery(request));
  return {
    dehydratedState: dehydrate(queryClient),
    cohorts,
  };
}

export default function MembersCohortsRoute({
  loaderData,
}: Route.ComponentProps) {
  const { cohorts } = loaderData;
  const location = useLocation();
  const currentPath = location.pathname === "/members/cohorts";

  return (
    <>
      {currentPath ? (
        <PageSection index={1} className="space-y-8">
          <Card className="rounded-md dark:bg-muted/30">
            <CardHeader>
              <CardTitle className="flex flex-col md:flex-row justify-between md:items-center gap-4 md:gap-0">
                <div className="w-full">
                  <span>All Cohorts</span>
                  <p className="text-sm text-muted-foreground">
                    Click on a cohort to view its members
                  </p>
                </div>
                <Search
                  id="cohort-search"
                  placeholder="Search cohorts by name..."
                />
              </CardTitle>
              <CardContent className="mt-8 px-0">
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
                      />
                    )}
                  </Await>
                </Suspense>
              </CardContent>
            </CardHeader>
          </Card>
        </PageSection>
      ) : (
        <Outlet />
      )}
    </>
  );
}
