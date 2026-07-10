import { dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";
import { Await, useOutletContext } from "react-router";
import { createTicket, ticketActions } from "~/.server/action/ticket";
import { PageSection, PageWrapper } from "~/components/provider/page-wrapper";
import DataError from "~/components/ui/data-error";
import { HelpCenterSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { getProgramCoordinatorsQuery } from "~/queries/cohorts.server";
import { getTicketsQuery } from "~/queries/tickets.server";
import type { UserData } from "~/types";
import type { Route } from "./+types/route";
import CreateTicket from "./create-ticket";
import Filter from "./filter";
import StatsCard from "./stats-card";
import TicketCard from "./ticket-card";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "View and manage issues regarding your account" },
    { name: "description", content: "Help Desk! - Contact support" },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  if (payload.intent === "create-ticket") {
    return await createTicket(request, payload);
  }
  if (payload.intent === "assign-ticket") {
    return await ticketActions(request, payload);
  }
  if (payload.intent === "update-ticketStatus") {
    return await ticketActions(request, payload);
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const queryClient = getQueryClientRsc();
  const tickets = queryClient.ensureQueryData(getTicketsQuery(request));
  const coordinators = await queryClient.ensureQueryData(
    getProgramCoordinatorsQuery(request),
  );
  return {
    dehydratedState: dehydrate(queryClient),
    tickets,
    coordinators,
  };
}

export default function HelpCenterRoute({ loaderData }: Route.ComponentProps) {
  const { tickets, coordinators } = loaderData;
  const { user } = useOutletContext() as { user: UserData };
  return (
    <PageWrapper>
      <PageSection index={0} className="space-y-8 xl:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
              Help Desk & Support
            </h1>
            <p className="text-muted-foreground text-sm">
              Get assistance with account issues, submit tickets, and access
              support resources
            </p>
          </div>
          <CreateTicket />
        </div>
        <Suspense fallback={<HelpCenterSkeleton />}>
          <Await resolve={tickets} errorElement={<DataError />}>
            {(resolvedTickets) => (
              <div className="space-y-8">
                <StatsCard summary={resolvedTickets.summary} />

                {/*<div className="flex gap-4 md:gap-8 mb-8 border-b w-full">
                  {["Tickets", "Cohorts", "Stats"]
                    .filter((s) => {
                      if (["Stats"].includes(s)) {
                        return hasPermission(user.role, "MANAGE_MEMBERS");
                      }
                      return true;
                    })
                    .map((s) => (
                      <NavLink
                        key={s}
                        to={
                          s === "Tickets"
                            ? "/help-center"
                            : `/help-center/${s.toLowerCase()}`
                        }
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
                </div>*/}
                <Filter />
                <TicketCard
                  tickets={resolvedTickets.tickets}
                  meta={resolvedTickets.meta}
                  user={user}
                  coordinators={coordinators}
                />
              </div>
            )}
          </Await>
        </Suspense>
      </PageSection>
    </PageWrapper>
  );
}
