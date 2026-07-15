import { memo } from "react";
import { RiGroupLine, RiUserLine } from "@remixicon/react";
import { cn, formatDate } from "~/lib/utils";
import type { TaskData } from "~/types";
import type { StageProgressData } from "~/types";

type TaskCardProps = {
  task: TaskData;
  stageProgress: StageProgressData | null;
  onTaskClick: (task: TaskData) => void;
};

export const TaskCard = memo(function TaskCard({ task, stageProgress, onTaskClick }: TaskCardProps) {
  const isActive = stageProgress?.status === "active";
  const isComplete = stageProgress?.status === "completed";
  const isLocked = !isActive && !isComplete;

  return (
    <button
      type="button"
      disabled={isLocked}
      onClick={() => onTaskClick(task)}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
        isActive && "border-border bg-card hover:bg-muted/50 cursor-pointer",
        isComplete && "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20",
        isLocked && "border-border/50 bg-muted/20 opacity-50 cursor-not-allowed",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
          isActive && "bg-mainBlue/10 text-mainBlue dark:bg-mainBlue/20",
          isComplete && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
          isLocked && "bg-muted text-muted-foreground",
        )}
      >
        {task.type === "group" ? <RiGroupLine className="h-4 w-4" /> : <RiUserLine className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium truncate", isActive && "text-foreground", isComplete && "text-green-700 dark:text-green-300")}>
          {task.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{task.maxScore}pts</span>
          {task.dueDate && (
            <>
              <span className="text-border">·</span>
              <span>Due {formatDate(task.dueDate)}</span>
            </>
          )}
          {task.isBonus && (
            <>
              <span className="text-border">·</span>
              <span className="text-amber-500 font-medium">Bonus</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
});
