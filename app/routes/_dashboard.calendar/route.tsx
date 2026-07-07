import { dehydrate } from "@tanstack/react-query";
import { PageSection, PageWrapper } from "~/components/provider/page-wrapper";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { getCalendarQuery } from "~/queries/calendar.server";
import type { Route } from "./+types/route";
import { CalendarView } from "./calendar-view";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Team Calendar | TSA InternHub" },
    {
      name: "description",
      content: "Stay updated with upcoming projects, tasks, and deadlines.",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const queryClient = getQueryClientRsc();
  const calendarData = await queryClient.ensureQueryData(
    getCalendarQuery(request),
  );
  return {
    dehydratedState: dehydrate(queryClient),
    calendarData,
  };
}

export default function CalendarRoute({ loaderData }: Route.ComponentProps) {
  const { calendarData } = loaderData;

  return (
    <PageWrapper>
      <PageSection index={0} className="space-y-8 xl:px-8">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
            Team Calendar
          </h1>
          <p className="text-muted-foreground text-sm">
            Stay updated with upcoming projects, tasks, and deadlines.
          </p>
        </div>
        <PageSection index={1}>
          <CalendarView data={calendarData} />
        </PageSection>
      </PageSection>
    </PageWrapper>
  );
}
