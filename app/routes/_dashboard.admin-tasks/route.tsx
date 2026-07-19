import { RiExternalLinkLine } from "@remixicon/react";
import { dehydrate } from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import { Await, Link, NavLink, Outlet, useLocation, useParams } from "react-router";
import { createTask, editTask } from "~/.server/action/task";
import { PageSection, PageWrapper } from "~/components/provider/page-wrapper";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import DataError from "~/components/ui/data-error";
import NotFound from "~/components/ui/not-found";
import { ProjectListSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { cn } from "~/lib/utils";
import { requirePermission } from "~/middleware/auth.middleware";
import { getTasksQuery } from "~/queries/tasks.server";
import type { StageWithData } from "~/types";
import type { Route } from "./+types/route";
import CreateTask from "./create-task";
import EditTask from "./edit-task";

export const middleware = [requirePermission("MANAGE_TASKS")];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Manage Tasks | TSA InternHub" },
    {
      name: "description",
      content:
        "Manage tasks by creating, editing, and grading them across different stages.",
    },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  if (payload.intent === "create-task") {
    return await createTask(request, payload);
  }
  if (payload.intent === "edit-task") {
    return await editTask(request, payload);
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const queryClient = getQueryClientRsc();
  const tasksData = queryClient.ensureQueryData(getTasksQuery(request));
  return {
    dehydratedState: dehydrate(queryClient),
    tasksData,
  };
}

export default function ManageTasks({ loaderData }: Route.ComponentProps) {
  const { tasksData } = loaderData;
  const [currentTask, setCurrentTask] = useState({
    project: { title: "" },
  });
  const location = useLocation();
  const { taskId } = useParams();
  const currentPath = location.pathname === "/admin-tasks";

  useEffect(() => {
    let isMounted = true;
    tasksData.then((data) => {
      if (isMounted) setCurrentTask(data);
    });
    return () => {
      isMounted = false;
    };
  }, [tasksData]);

  return (
    <PageWrapper>
      <PageSection index={0} className="space-y-8 xl:px-8">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
            Tasks
          </h1>
          <p className="text-muted-foreground text-sm">
            Create, edit, and grade tasks{" "}
            {currentPath && currentTask && currentTask?.project
              ? `for "${currentTask?.project?.title}"`
              : null}
          </p>
        </div>
        <div className="flex gap-4 md:gap-8 mb-8 border-b w-full">
          {["admin-tasks", "stats"].map((s) => (
            <NavLink
              key={s}
              to={
                s === "admin-tasks"
                  ? "/admin-tasks"
                  : `/admin-tasks/${s.toLowerCase()}`
              }
              className={({ isActive }) =>
                cn(
                  "py-2 font-bold text-sm border-b-2 transition-colors duration-300 ease-in-out truncate capitalize",
                  isActive && location.pathname.endsWith(s) || (location.pathname.endsWith("grade") && s === "admin-tasks")
                    ? "border-mainBlue dark:border-darkBlue text-mainBlue dark:text-darkBlue"
                    : "border-transparent text-muted-foreground hover:border-mainBlue/40 dark:hover:border-darkBlue/40",
                )
              }
            >
              {s === "admin-tasks" ? "Current" : s}
            </NavLink>
          ))}
        </div>
        {currentPath ? (
          <Suspense fallback={<ProjectListSkeleton />}>
            <Await resolve={tasksData} errorElement={<DataError />}>
              {(resolvedTask) => (
                <>
                  {!resolvedTask || !resolvedTask.project ? (
                    <NotFound
                      title="No active project"
                      message="Create a project first to manage tasks."
                    />
                  ) : (
                    <TaskList stages={resolvedTask.stages} />
                  )}
                </>
              )}
            </Await>
          </Suspense>
        ) : (
          <Outlet />
        )}
      </PageSection>
    </PageWrapper>
  );
}

function TaskList({ stages }: { stages: StageWithData[] }) {
  const [createStageId, setCreateStageId] = useState<string | null>(null);
  const [isOpenEdit, setIsOpenEdit] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {stages.map((stageData: StageWithData, index: number) => (
        <Card
          key={stageData.stage._id}
          className="group rounded-md dark:bg-muted/30 hover:border-mainBlue/30 dark:hover:border-darkBlue/40 hover:shadow-sm transition-[border-color,box-shadow] duration-300 animate-in fade-in slide-in-from-bottom-3"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardHeader className="flex items-center justify-between border-b px-5">
            <CardTitle>
              <h3 className="text-md">
                Stage {stageData.stage.order}: {stageData.stage.title}
              </h3>
              <p className="text-sm mt-0.5">
                {stageData.tasks.length} task
                {stageData.tasks.length !== 1 ? "s" : ""}
                {" · "}Passmark: {stageData.stage.passPercentage}%
              </p>
            </CardTitle>
            {stageData.tasks.length === 0 && (
              <button
                onClick={() => setCreateStageId(stageData.stage._id)}
                className="px-4 py-2 rounded-sm text-mainBlue dark:text-muted-foreground group-hover:dark:text-darkBlue transition-[color]"
              >
                Add Task
              </button>
            )}
          </CardHeader>
          <div className="px-5 py- space-y-2">
            {stageData.tasks.length === 0 ? (
              <p className="text-center">
                No tasks created yet. Click "Add Task" to create one.
              </p>
            ) : (
              stageData.tasks.map((task) => (
                <div
                  key={task._id}
                  className="space-y-4 rounded-md border bg-muted/50 px-4 py-3"
                >
                  <div>
                    <p className="text-base font-semibold truncate">
                      {task.title}
                    </p>
                    <p className="text-sm">
                      {task.description || "No description"}
                    </p>
                    <p className="text-[13px] mt-0.5 text-muted-foreground">
                      {task.maxScore}pts · {task.type}
                      {task.isBonus ? " · Bonus" : " · Required"}
                    </p>
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
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/admin-tasks/${task._id}/grade`}
                      className="px-3 py-1.5 rounded-sm border transition-[background-color,border-color] hover:bg-accent"
                    >
                      Grade
                    </Link>
                    <button
                      className="px-3 py-1.5 rounded-sm border transition-[background-color,border-color] hover:bg-accent"
                      type="button"
                      onClick={() => {
                        setIsOpenEdit(true);
                        setEditingTask(task);
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {createStageId === stageData.stage._id && (
            <CreateTask
              stageId={stageData.stage._id}
              isOpen={createStageId === stageData.stage._id}
              onClose={() => setCreateStageId(null)}
            />
          )}
          {isOpenEdit && (
            <EditTask
              task={editingTask}
              isOpen={isOpenEdit}
              onClose={() => setIsOpenEdit(false)}
            />
          )}
        </Card>
      ))}
    </div>
  );
}
