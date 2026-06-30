import { dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";
import { Await, useOutletContext } from "react-router";
import { PageSection, PageWrapper } from "~/components/provider/page-wrapper";
import { CanPermit } from "~/components/provider/rbac-permit";
import AccessDenied from "~/components/ui/access-denied";
import DataError from "~/components/ui/data-error";
import NotFound from "~/components/ui/not-found";
import { ProjectListSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { getTasksSubmissionsQuery } from "~/queries/tasks.server";
import type { UserData } from "~/types";
import type { Route } from "../_dashboard.tasks.submissions/+types/route";
import SubmissionList from "./submission-list";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Task Submissions | TSA InternHub" },
    {
      name: "description",
      content: "View your task submissions",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const queryClient = getQueryClientRsc();
  const taskSubmissions = queryClient.ensureQueryData(
    getTasksSubmissionsQuery(request),
  );
  return {
    dehydratedState: dehydrate(queryClient),
    taskSubmissions,
  };
}

export default function TaskSubmissions({ loaderData }: Route.ComponentProps) {
  const { taskSubmissions } = loaderData;
  const { user } = useOutletContext() as { user: UserData };
  return (
    <>
      <PageSection index={1}>
        <CanPermit
          user={user}
          permission="MANAGE_TASK"
          fallback={<AccessDenied />}
        >
          <Suspense fallback={<ProjectListSkeleton />}>
            <Await resolve={taskSubmissions} errorElement={<DataError />}>
              {(resolvedSubmissions) => (
                <>
                  {resolvedSubmissions.submissions.length === 0 ? (
                    <NotFound
                      title="No task submission history"
                      message="You have no task submissions yet. Complete a task to see your submissions."
                    />
                  ) : (
                    <SubmissionList
                      submissions={resolvedSubmissions}
                      user={user}
                    />
                  )}
                </>
              )}
            </Await>
          </Suspense>
        </CanPermit>
      </PageSection>
    </>
  );
}
