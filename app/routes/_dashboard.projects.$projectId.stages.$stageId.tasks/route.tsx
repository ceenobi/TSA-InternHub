import {
  RiArrowLeftLine,
  RiExternalLinkLine,
  RiGroupLine,
  RiInformationFill,
  RiUserLine,
} from "@remixicon/react";
import { dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";
import { Await, Link } from "react-router";
import { PageSection } from "~/components/provider/page-wrapper";
import { Alert, AlertTitle } from "~/components/ui/alert";
import DataError from "~/components/ui/data-error";
import NotFound from "~/components/ui/not-found";
import { CardListSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { getStageTasksQuery } from "~/queries/tasks.server";
import type { TaskData } from "~/types";
import type { Route } from "../_dashboard.projects.$projectId.stages.$stageId.tasks/+types/route";
import { requirePermission } from "~/middleware/auth.middleware";

export const middleware = [requirePermission("MANAGE_COHORTS", "loader")];

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Stage ${params.stageId} Tasks | TSA InternHub` },
    {
      name: "description",
      content: "View tasks for this stage",
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const queryClient = getQueryClientRsc();
  const tasks = queryClient.ensureQueryData(
    getStageTasksQuery(request, params.stageId),
  );
  return {
    dehydratedState: dehydrate(queryClient),
    tasks,
  };
}

export default function StageTasks({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { tasks } = loaderData;
  const projectId = params.projectId;

  return (
    <PageSection index={0}>
      <div className="space-y-6">
        <Link
          to={`/projects/${projectId}/stages`}
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:underline hover:dark:text-white mb-8"
        >
          <RiArrowLeftLine size={13} /> Back to stages
        </Link>
        <Suspense fallback={<CardListSkeleton count={4} />}>
          <Await resolve={tasks} errorElement={<DataError />}>
            {(resolvedTasks: TaskData[]) =>
              resolvedTasks.length === 0 ? (
                <NotFound
                  title="No tasks"
                  message="No tasks have been created for this stage yet."
                />
              ) : (
                <>
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    Stage {resolvedTasks[0].order} task
                  </h1>
                  <Alert className="max-w-full rounded-sm border-amber-200 bg-amber-50 text-amber-900 dark:border-blue-900 dark:bg-blue-900/40 dark:text-blue-50">
                    <RiInformationFill />
                    <AlertTitle>
                      To manage stage tasks, visit the tasks page on the sidebar
                    </AlertTitle>
                  </Alert>
                  <div className="flex flex-col gap-3">
                    {resolvedTasks.map((task) => (
                      <TaskCard key={task._id} task={task} />
                    ))}
                  </div>
                </>
              )
            }
          </Await>
        </Suspense>
      </div>
    </PageSection>
  );
}

function TaskCard({ task }: { task: TaskData }) {
  return (
    <div className="flex items-start gap-4 bg-card dark:bg-muted/30 border rounded-sm p-4 hover:bg-accent transition-all dark:hover:border-darkBlue/40 hover:shadow-sm duration-300 animate-in fade-in slide-in-from-bottom-3">
      <div className="size-10 rounded-full bg-mainBlue/10 dark:bg-darkBlue/10 flex items-center justify-center text-mainBlue dark:text-darkBlue shrink-0 mt-0.5">
        {task.type === "group" ? (
          <RiGroupLine size={20} />
        ) : (
          <RiUserLine size={20} />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{task.title}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs bg-mainBlue/10 dark:bg-darkBlue/10 text-mainBlue dark:text-darkBlue px-2 py-0.5 rounded-sm font-medium">
              {task.type}
            </span>
            {task.isBonus && (
              <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-sm font-medium">
                Bonus
              </span>
            )}
          </div>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {task.instructions && (
          <p className="text-xs text-muted-foreground/75 italic line-clamp-1">
            {task.instructions}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium">{task.maxScore}pts</span>
          {task.maxAttempts && (
            <span>
              {task.maxAttempts} attempt{task.maxAttempts > 1 ? "s" : ""}
            </span>
          )}
          {task.dueDate && (
            <span>
              Due{" "}
              {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>

        {task.resources && task.resources.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {task.resources.map((r, i) => (
              <a
                href={r.url}
                key={i}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-mainBlue dark:text-darkBlue bg-mainBlue/5 dark:bg-darkBlue/5 px-2 py-0.5 rounded-sm"
              >
                <RiExternalLinkLine size={12} />
                {r.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
