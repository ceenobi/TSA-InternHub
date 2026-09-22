import { dehydrate, useQuery } from "@tanstack/react-query";
import { useOutletContext, useSearchParams } from "react-router";
import { PageSection } from "~/components/provider/page-wrapper";
import { CanPermit } from "~/components/provider/rbac-permit";
import AccessDenied from "~/components/ui/access-denied";
import DataError from "~/components/ui/data-error";
import NotFound from "~/components/ui/not-found";
import { ProjectListSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { getTasksSubmissionsClientQuery, tasksSubmissionsQueryOptions } from "~/queries/tasks";
import type { UserData } from "~/types";
import type { Route } from "./+types/route";
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

export async function loader() {
  return { dehydratedState: undefined };
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const queryClient = getQueryClientRsc();
  await queryClient.ensureQueryData(getTasksSubmissionsClientQuery(request));
  return {
    dehydratedState: dehydrate(queryClient),
  };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <ProjectListSkeleton />;
}

export default function TaskSubmissions() {
  const { user } = useOutletContext() as { user: UserData };
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const taskId = searchParams.get("taskId") || undefined;
  const {
    data: resolvedSubmissions,
    isPending,
    isError,
  } = useQuery(tasksSubmissionsQueryOptions({ page, limit, taskId }));
  return (
      <PageSection index={1}>
        <CanPermit
          user={user}
          permission="MANAGE_TASK"
          fallback={<AccessDenied />}
        >
          {isPending ? (
            <ProjectListSkeleton />
          ) : isError ? (
            <DataError />
          ) : (
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
        </CanPermit>
      </PageSection>
  );
}
