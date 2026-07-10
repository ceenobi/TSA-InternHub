import { RiInformationFill } from "@remixicon/react";
import { dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";
import {
  Await,
  NavLink,
  Outlet,
  useLocation,
  useOutletContext,
} from "react-router";
import { sendInviteCode } from "~/.server/action/auth";
import { PageSection, PageWrapper } from "~/components/provider/page-wrapper";
import { CanPermit } from "~/components/provider/rbac-permit";
import { Alert, AlertTitle } from "~/components/ui/alert";
import DataError from "~/components/ui/data-error";
import { MembersSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { cn } from "~/lib/utils";
import { getActiveCohortWithMembersQuery } from "~/queries/cohorts.server";
import type { UserData } from "~/types";
import type { Route } from "./+types/route";
import InviteMember from "./invite-member";
import MembersList from "./members-list";
import { requirePermission } from "~/middleware/auth.middleware";
import { hasPermission } from "~/lib/rbac";

export const middleware = [requirePermission("MANAGE_COHORTS", "action")];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Members | TSA InternHub" },
    {
      name: "description",
      content: "See and manage your members.",
    },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  if (payload.intent === "invite-member") {
    return await sendInviteCode(request, payload);
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const queryClient = getQueryClientRsc();
  const cohorts = queryClient.ensureQueryData(
    getActiveCohortWithMembersQuery(request),
  );
  return {
    dehydratedState: dehydrate(queryClient),
    cohorts,
  };
}

export default function MembersRoute({ loaderData }: Route.ComponentProps) {
  const { user } = useOutletContext() as { user: UserData };
  const { cohorts } = loaderData;
  const location = useLocation();
  const currentPath = location.pathname === "/members";

  return (
    <PageWrapper>
      <PageSection index={0} className="space-y-8 xl:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
              Members
            </h1>
            <p className="text-muted-foreground text-sm">
              View cohort members, invite new members and more.
            </p>
          </div>
          <Suspense fallback={<div className="loading" />}>
            <Await
              resolve={cohorts}
              errorElement={
                <p className="text-xs text-muted-foreground">
                  Error loading cohorts.
                </p>
              }
            >
              {(resolvedCohorts) => (
                <CanPermit user={user} permission="MANAGE_MEMBERS">
                  <InviteMember cohort={resolvedCohorts} />
                </CanPermit>
              )}
            </Await>
          </Suspense>
        </div>
        <div className="flex gap-4 md:gap-8 mb-8 border-b w-full">
          {["Current", "Cohorts", "Stats"].filter((s) => {
            if (["Stats"].includes(s)) {
              return hasPermission(user.role, "MANAGE_MEMBERS");
            }
            return true;
          }).map((s) => (
            <NavLink
              key={s}
              to={s === "Current" ? "/members" : `/members/${s.toLowerCase()}`}
              end={s === "Current"}
              className={({ isActive }) =>
                cn(
                  "py-2 font-bold text-sm border-b-2 transition-colors duration-300 ease-in-out truncate",
                  isActive
                    ? "border-mainBlue dark:border-darkBlue text-mainBlue dark:text-darkBlue"
                    : "border-transparent text-muted-foreground hover:border-mainBlue/40 dark:hover:border-darkBlue/40",
                )
              }
            >
              {s}
            </NavLink>
          ))}
        </div>
        {currentPath ? (
          <>
            <PageSection index={1} className="space-y-6">
              <Alert className="max-w-full rounded-sm border-amber-200 bg-amber-50 text-amber-900 dark:border-blue-900 dark:bg-blue-900/40 dark:text-blue-50">
                <RiInformationFill />
                <AlertTitle>View members of your current cohort</AlertTitle>
              </Alert>
              <Suspense fallback={<MembersSkeleton />}>
                <Await resolve={cohorts} errorElement={<DataError />}>
                  {(resolvedCohorts) => (
                    <MembersList cohort={resolvedCohorts} user={user} />
                  )}
                </Await>
              </Suspense>
            </PageSection>
          </>
        ) : (
          <Outlet context={{ user }} />
        )}
      </PageSection>
    </PageWrapper>
  );
}
