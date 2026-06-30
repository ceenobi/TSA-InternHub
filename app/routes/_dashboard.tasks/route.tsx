import { dehydrate } from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import {
  Await,
  NavLink,
  Outlet,
  useFetcher,
  useLocation,
  useOutletContext,
} from "react-router";
import { activateStage, submitTask } from "~/.server/action/task";
import { PageSection, PageWrapper } from "~/components/provider/page-wrapper";

import { toast } from "sonner";
import AlertBox from "~/components/provider/alert-box";
import { CanPermit } from "~/components/provider/rbac-permit";
import AccessDenied from "~/components/ui/access-denied";
import DataError from "~/components/ui/data-error";
import NotFound from "~/components/ui/not-found";
import { TaskViewSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { cn } from "~/lib/utils";
import { getTasksQuery } from "~/queries/tasks.server";
import type { TaskData, TasksPageData, UserData } from "~/types";
import type { Route } from "./+types/route";
import { StageDetail } from "./stage-detail";
import { StageNav } from "./stage-nav";
import { SubmitTaskModal } from "./submit-task";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Tasks | TSA InternHub" },
    {
      name: "description",
      content:
        "Tasks are grouped in stages, finish a task, get graded and unlock the next stage.",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const queryClient = getQueryClientRsc();
  const tasksData = queryClient.ensureQueryData(getTasksQuery(request));
  return {
    dehydratedState: dehydrate(queryClient),
    tasksData,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  if (payload.intent === "activate-stage") {
    return await activateStage(request, payload);
  }
  if (payload.intent === "submit-task") {
    return await submitTask(request, payload);
  }
}

export default function MyTaskRoute({ loaderData }: Route.ComponentProps) {
  const { tasksData } = loaderData;
  const { user } = useOutletContext() as { user: UserData };
  const location = useLocation();
  const currentPath = location.pathname === "/tasks";

  return (
    <>
      <PageWrapper>
        <PageSection index={0} className="space-y-8 xl:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
                My Tasks
              </h1>
              <p className="text-muted-foreground text-sm">
                Complete stages to progress through your internship program.
              </p>
            </div>
          </div>
          <div className="flex gap-4 md:gap-8 mb-8 border-b w-full">
            {["Current", "Submissions", "Stats"].map((s) => (
              <NavLink
                key={s}
                to={s === "Current" ? "/tasks" : `/tasks/${s.toLowerCase()}`}
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
            <CanPermit
              user={user}
              permission="MANAGE_TASK"
              fallback={<AccessDenied />}
            >
              <Suspense fallback={<TaskViewSkeleton />}>
                <Await resolve={tasksData} errorElement={<DataError />}>
                  {(resolvedTask) => (
                    <>
                      {!resolvedTask || !resolvedTask.project ? (
                        <NotFound
                          title="No active project"
                          message="Tasks haven't been created yet. Come back later."
                        />
                      ) : (
                        <TaskView resolvedTask={resolvedTask} />
                      )}
                    </>
                  )}
                </Await>
              </Suspense>
            </CanPermit>
          ) : (
            <Outlet context={{ user }} />
          )}
        </PageSection>
      </PageWrapper>
    </>
  );
}

function TaskView({ resolvedTask }: { resolvedTask: TasksPageData }) {
  const { stages, project } = resolvedTask;
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const fetcher = useFetcher();
  const isActivating = fetcher.state === "submitting";

  const actionData = fetcher.data as
    | { success?: boolean; message?: string; body?: any }
    | undefined;

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Stage unlocked successfully");
    } else if (actionData !== undefined && actionData.success === false) {
      setShowAlert(true);
    }
  }, [actionData]);

  const handleActivate = (stageId: string) => {
    fetcher.submit(
      { stageId, intent: "activate-stage" },
      { method: "post", action: "/tasks", encType: "application/json" },
    );
  };
  const progressMap: Record<string, (typeof stages)[number]["progress"]> = {};
  for (const s of stages) {
    progressMap[s.stage._id] = s.progress;
  }

  const firstUnlockedId = stages.find((s, i) => {
    if (s.progress?.status === "active") return true;
    if (i === 0 && !s.progress) return true;
    if (s.progress?.status === "completed") return i === stages.length - 1;
    const prev = stages[i - 1]?.progress?.status;
    if (prev === "completed" && !s.progress) return true;
    return false;
  })?.stage._id;

  const [activeStageId, setActiveStageId] = useState(
    firstUnlockedId || stages[0]?.stage._id,
  );
  const activeStageData = stages.find((s) => s.stage._id === activeStageId);
  const stageIndex = stages.findIndex((s) => s.stage._id === activeStageId);

  // Auto-advance to the next unlocked stage when the current one is completed
  useEffect(() => {
    const currentProgress = stages.find(
      (s) => s.stage._id === activeStageId,
    )?.progress;
    if (currentProgress?.status === "completed") {
      const nextUnlockedId = stages.find((s, i) => {
        if (s.progress?.status === "active") return true;
        if (i === 0 && !s.progress) return true;
        if (s.progress?.status === "completed") return i === stages.length - 1;
        const prev = stages[i - 1]?.progress?.status;
        if (prev === "completed" && !s.progress) return true;
        return false;
      })?.stage._id;

      if (nextUnlockedId && nextUnlockedId !== activeStageId) {
        setActiveStageId(nextUnlockedId);
      }
    }
  }, [stages, activeStageId]);

  return (
    <>
      <div className="rounded-sm border p-3">
        <StageNav
          stages={stages.map((s) => ({
            _id: s.stage._id,
            order: s.stage.order,
            title: s.stage.title,
          }))}
          progressMap={progressMap}
          activeStageId={activeStageId}
          onSelect={setActiveStageId}
        />
      </div>
      {showAlert && (
        <AlertBox
          title={"Error"}
          description={
            (actionData && actionData.message) || "Error unlocking stage"
          }
          variant={"error"}
          onClose={() => setShowAlert(false)}
        />
      )}
      {/* Stage Detail */}
      {activeStageData && (
        <StageDetail
          stage={activeStageData.stage}
          tasks={activeStageData.tasks}
          progress={activeStageData.progress}
          isFirst={stageIndex === 0}
          isLastUnlocked={
            stageIndex === 0 ||
            stages[stageIndex - 1]?.progress?.status === "completed"
          }
          onActivate={handleActivate}
          isActivating={isActivating}
          onTaskClick={setSelectedTask}
          stageNumber={activeStageData.stage.order}
          totalStages={stages.length}
          projectTitle={project.title}
        />
      )}
      <SubmitTaskModal
        task={selectedTask}
        isOpen={!!selectedTask}
        setIsOpen={(open) => {
          if (!open) setSelectedTask(null);
        }}
      />
    </>
  );
}
