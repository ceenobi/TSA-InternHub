import { RiGroup2Fill } from "@remixicon/react";
import { dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";
import { Await, useOutletContext } from "react-router";
import { signUpWithEmailAdmin, updateAdminRole } from "~/.server/action/auth";
import { PageSection } from "~/components/provider/page-wrapper";
import { CanPermit } from "~/components/provider/rbac-permit";
import AccessDenied from "~/components/ui/access-denied";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import DataError from "~/components/ui/data-error";
import NotFound from "~/components/ui/not-found";
import { StaffCardSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { requirePermission } from "~/middleware/auth.middleware";
import { getProgramCoordinatorsQuery } from "~/queries/cohorts.server";
import type { UserData } from "~/types";
import type { Route } from "../_dashboard.settings.staff/+types/route";
import InviteStaff from "./invite-staff";
import StaffCard from "./staff-card";

export const middleware = [requirePermission("MANAGE_ROLES", "action")];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Staff Settings | TSA InternHub" },
    {
      name: "description",
      content: "Manage your staff, update roles.",
    },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  if (payload.intent === "update-role") {
    return await updateAdminRole(request, payload);
  }
  if (payload.intent === "admin-invite") {
    return await signUpWithEmailAdmin(request, payload);
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const queryClient = getQueryClientRsc();
  const coordinators = queryClient.ensureQueryData(
    getProgramCoordinatorsQuery(request),
  );
  return {
    dehydratedState: dehydrate(queryClient),
    coordinators,
  };
}

export default function Staff({ loaderData }: Route.ComponentProps) {
  const { user } = useOutletContext() as { user: UserData };
  const { coordinators } = loaderData;

  return (
    <CanPermit
      user={user}
      permission="MANAGE_COHORTS"
      fallback={<AccessDenied />}
    >
      <PageSection index={2} className="space-y-8">
        <Card className="rounded-sm border-border/80 bg-gray-50/30 dark:bg-muted/30">
          <CardHeader>
            <div className="w-full flex flex-col md:flex-row justify-between md:items-center gap-4 mb-1">
              <div className="flex gap-2 items-stretch">
                <RiGroup2Fill size={18} className="mt-1" />
                <CardTitle>
                  <h1>Program Coordinators</h1>
                  <p className="text-sm text-muted-foreground">
                    View and manage intern coordinators.
                  </p>
                </CardTitle>
              </div>
              <InviteStaff />
            </div>
          </CardHeader>
        </Card>
        <Suspense fallback={<StaffCardSkeleton />}>
          <Await resolve={coordinators} errorElement={<DataError />}>
            {(resolvedCoordinators) => (
              <>
                {resolvedCoordinators.length === 0 ? (
                  <NotFound
                    title="No coordinators found"
                    message="Coordinators have not been added yet. Come back later."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {resolvedCoordinators.map((coordinator, index) => (
                      <StaffCard
                        key={coordinator._id}
                        coordinators={coordinator}
                        user={user}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </Await>
        </Suspense>
      </PageSection>
    </CanPermit>
  );
}
