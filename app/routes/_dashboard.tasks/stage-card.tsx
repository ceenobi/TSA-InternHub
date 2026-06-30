import {
  RiCheckLine,
  RiCloseCircleLine,
  RiLock2Line,
  RiPlayCircleLine,
  RiTimeLine,
} from "@remixicon/react";
import { cn, formatDate } from "~/lib/utils";
import type { StageData, StageProgressData, TaskData } from "~/types";
import { TaskCard } from "./task-card";

type StageCardProps = {
  stage: StageData;
  tasks: TaskData[];
  progress: StageProgressData | null;
  isFirst: boolean;
  isLastUnlocked: boolean;
  onActivate: (stageId: string) => void;
  onTaskClick: (task: TaskData) => void;
};

export function StageCard({
  stage,
  tasks,
  progress,
  isFirst,
  isLastUnlocked,
  onActivate,
  onTaskClick,
}: StageCardProps) {
  const isReady = isFirst && !progress;
  const isLocked = !isReady && !progress && !isLastUnlocked;
  const isActive = progress?.status === "active";
  const isCompleted = progress?.status === "completed";
  const isFailed = progress?.status === "failed";

  const statusIcon = () => {
    if (isReady) return <RiPlayCircleLine className="h-5 w-5 text-mainBlue" />;
    if (isActive) return <RiTimeLine className="h-5 w-5 text-amber-500" />;
    if (isCompleted) return <RiCheckLine className="h-5 w-5 text-green-500" />;
    if (isFailed) return <RiCloseCircleLine className="h-5 w-5 text-red-500" />;
    return <RiLock2Line className="h-5 w-5 text-muted-foreground" />;
  };

  const statusLabel = () => {
    if (isReady) return "Ready to start";
    if (isActive) return "In progress";
    if (isCompleted) return "Completed";
    if (isFailed) return "Failed";
    return "Locked";
  };

  const stageColors = [
    "border-l-blue-500",
    "border-l-emerald-500",
    "border-l-amber-500",
    "border-l-violet-500",
    "border-l-rose-500",
  ];

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card border-l-4 overflow-hidden transition-all",
        stageColors[(stage.order - 1) % stageColors.length],
        (isLocked || isFailed) && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 shrink-0">{statusIcon()}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-foreground">
                Stage {stage.order}: {stage.title}
              </h3>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                  isReady && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                  isActive && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                  isCompleted && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                  isFailed && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                  isLocked && "bg-muted text-muted-foreground",
                )}
              >
                {statusLabel()}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Passmark: {stage.passPercentage}%
              {stage.endDate && ` · Ends ${formatDate(stage.endDate)}`}
            </p>
          </div>
        </div>
      </div>

      {progress && (
        <div className="px-5 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full transition-all",
                  progress.passed ? "bg-green-500" : "bg-amber-500",
                )}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">{progress.percentage}%</span>
          </div>
        </div>
      )}

      {isReady && (
        <div className="px-5 pb-4">
          <p className="mb-3 text-sm text-muted-foreground">
            {stage.description || "Start this stage to view and submit tasks."}
          </p>
          <button
            onClick={() => onActivate(stage._id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-mainBlue/30 bg-mainBlue/10 px-4 py-2 text-sm font-medium text-mainBlue transition-colors hover:bg-mainBlue/20 dark:border-darkBlue/30 dark:bg-darkBlue/20 dark:text-mainGold dark:hover:bg-darkBlue/30"
          >
            <RiPlayCircleLine className="h-4 w-4" />
            Start Stage {stage.order}
          </button>
        </div>
      )}

      {isActive && (
        <div className="border-t border-border px-5 py-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  stageProgress={progress}
                  onTaskClick={onTaskClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="border-t border-border px-5 py-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks in this stage.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  stageProgress={progress}
                  onTaskClick={onTaskClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {isFailed && (
        <div className="border-t border-border px-5 py-4">
          <p className="text-sm text-muted-foreground">
            You did not meet the passmark for this stage. Please contact your admin for further guidance.
          </p>
        </div>
      )}

      {isLocked && (
        <div className="border-t border-border px-5 py-4">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <RiLock2Line className="h-3.5 w-3.5" />
            Complete the previous stage to unlock this one.
          </p>
        </div>
      )}
    </div>
  );
}
