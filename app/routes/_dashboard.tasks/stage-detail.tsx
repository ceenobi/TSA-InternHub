import { Link } from "react-router";
import ActionButton from "~/components/ui/action-button";
import { Badge } from "~/components/ui/badge";
import type { StageData, StageProgressData, TaskData } from "~/types";
import { ProgressRing } from "./progress-ring";

type StageDetailProps = {
  stage: StageData;
  tasks: TaskData[];
  progress: StageProgressData | null;
  isFirst: boolean;
  isLastUnlocked: boolean;
  onActivate: (stageId: string) => void;
  onTaskClick: (task: TaskData) => void;
  stageNumber: number;
  totalStages: number;
  projectTitle: string;
  isActivating: boolean;
};

export function StageDetail({
  stage,
  tasks,
  progress,
  isFirst,
  isLastUnlocked,
  onActivate,
  onTaskClick,
  stageNumber,
  totalStages,
  isActivating,
  projectTitle,
}: StageDetailProps) {
  const isReady = (isFirst || isLastUnlocked) && !progress;
  const isLocked = !isReady && !progress && !isLastUnlocked;
  const isActive = progress?.status === "active";
  const isCompleted = progress?.status === "completed";
  const isFailed = progress?.status === "failed";

  const daysRemaining = stage.endDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(stage.endDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  const formattedDate = stage.endDate
    ? new Date(stage.endDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const statusBadge = () => {
    if (isReady)
      return {
        label: "Not Started",
        color: "bg-muted text-muted-foreground",
        dot: "bg-muted-foreground",
      };
    if (isActive)
      return {
        label: "In Progress",
        color: "bg-mainBlue text-white dark:bg-darkBlue/10 dark:text-darkBlue",
        dot: "bg-red-500",
      };
    if (isCompleted)
      return {
        label: "Completed",
        color: "bg-green-100 text-green-700",
        dot: "bg-green-500",
      };
    if (isFailed)
      return {
        label: "Failed",
        color: "bg-destructive/10 text-destructive",
        dot: "bg-destructive",
      };
    return {
      label: "Locked",
      color: "bg-muted text-muted-foreground",
      dot: "bg-muted-foreground",
    };
  };

  const badge = statusBadge();
  const percentage = progress?.percentage ?? 0;
  const passed = progress?.passed ?? false;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Column: Main Content */}
      <div className="flex-1 flex flex-col gap-8 min-w-0">
        {/* Breadcrumbs */}
        <nav className="hidden lg:flex items-center gap-2 text-muted-foreground text-md">
          <Link
            to="/"
            className="hover:text-mainBlue dark:hover:text-darkBlue transition-colors"
          >
            Dashboard
          </Link>
          <span className="material-symbols-outlined text-[16px]">
            chevron_right
          </span>
          <Link
            to="/tasks"
            className="hover:text-mainBlue dark:hover:text-darkBlue transition-colors"
          >
            {projectTitle}
          </Link>
          <span className="material-symbols-outlined text-[16px]">
            chevron_right
          </span>
          <span className="text-foreground">
            Stage {stageNumber}: {stage.title}
          </span>
        </nav>

        {/* Header Section */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-lg text-foreground">
              Stage {stageNumber}: {stage.title}
            </h1>
            <span
              className={`${badge.color} text-xs px-2 py-0.5 rounded-sm font-medium`}
            >
              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
              {badge.label}
            </span>
          </div>
          <p className="text-base text-muted-foreground max-w-3xl">
            {stage.description ||
              `Welcome to stage ${stageNumber}. Complete the tasks below to progress.`}
          </p>
        </section>

        {/* Locked State */}
        {isLocked && (
          <div className="bg-card rounded-xl border p-10 flex flex-col items-center justify-center text-center gap-2">
            <span className="material-symbols-outlined text-[48px] text-muted-foreground/50">
              lock
            </span>
            <h4 className="text-headline-md text-muted-foreground">
              Stage Locked
            </h4>
            <p className="text-muted-foreground max-w-sm">
              Complete the previous stage to unlock this one.
            </p>
          </div>
        )}

        {/* Ready State - Start CTA */}
        {isReady && (
          <div className="bg-card dark:bg-muted/30 rounded-md border p-10 flex flex-col items-center justify-center text-center gap-4">
            <span className="material-symbols-outlined text-[48px] text-mainBlue dark:text-darkBlue">
              play_circle
            </span>
            <div>
              <h4 className="text-md text-foreground">Ready to Begin</h4>
              <p className="text-muted-foreground mt-1">
                Start this stage to view and submit your tasks.
              </p>
            </div>
            <ActionButton
              text={`Start Stage ${stageNumber}`}
              type="button"
              onClick={() => onActivate(stage._id)}
              loading={isActivating}
              classname="rounded-sm w-fit border dark:border-darkBlue bg-mainBlue dark:bg-darkBlue/20 text-white hover:bg-mainBlue/90 hover:dark:bg-darkBlue/30"
            />
          </div>
        )}

        {/* Failed State */}
        {isFailed && (
          <div className="bg-destructive/10 rounded-sm border border-destructive/30 p-10 flex flex-col items-center justify-center text-center gap-2">
            <span className="material-symbols-outlined text-[48px] text-destructive">
              cancel
            </span>
            <h4 className="text-md text-destructive">Stage Failed</h4>
            <p className="text-muted-foreground max-w-sm">
              You did not meet the passmark for this stage. Please contact your
              admin for further guidance.
            </p>
          </div>
        )}

        {/* Active State - Tasks + Content */}
        {(isActive || isCompleted) && (
          <>
            {/* Bento Grid: Learning Objectives & Submission Requirements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card dark:bg-muted/30 p-6 rounded-sm border flex flex-col gap-2">
                <div className="flex items-center gap-3 text-mainBlue dark:text-darkBlue">
                  <span className="material-symbols-outlined">menu_book</span>
                  <h3 className="text-md">Learning Objectives</h3>
                </div>
                <ul className="flex flex-col gap-3 mt-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-mainBlue dark:text-darkBlue text-[20px]">
                      check_circle
                    </span>
                    <span>
                      Complete all tasks with a score above the passmark.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-mainBlue dark:text-darkBlue text-[20px]">
                      check_circle
                    </span>
                    <span>Submit your work before the stage deadline.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-mainBlue dark:text-darkBlue text-[20px]">
                      check_circle
                    </span>
                    <span>Review feedback from your mentor to improve.</span>
                  </li>
                </ul>
              </div>
              <div className="bg-card dark:bg-muted/30 p-6 rounded-sm border flex flex-col gap-2">
                <div className="flex items-center gap-3 text-mainBlue dark:text-darkBlue">
                  <span className="material-symbols-outlined">
                    assignment_late
                  </span>
                  <h3 className="text-md">Submission Requirements</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tasks must meet the following criteria:
                </p>
                <ul className="flex flex-col gap-2 list-disc pl-5 text-sm text-muted-foreground">
                  <li>
                    Passmark: {stage.passPercentage}% minimum score required
                  </li>
                  <li>Each task has its own submission guidelines</li>
                  <li>Resubmissions capped at 2 attempts where allowed</li>
                </ul>
              </div>
            </div>

            {/* Task List */}
            <section className="flex flex-col gap-4">
              <h3 className="text-headline-md text-foreground">Tasks</h3>
              {tasks.length === 0 ? (
                <div className="bg-card dark:bg-muted/30 border rounded-sm p-10 flex flex-col items-center justify-center text-center gap-2">
                  <span className="material-symbols-outlined text-[48px] text-muted-foreground/50">
                    assignment
                  </span>
                  <h4 className="text-md text-muted-foreground">
                    No Tasks Yet
                  </h4>
                  <p className="text-muted-foreground max-w-sm">
                    Tasks for this stage have not been created yet.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {tasks.map((task) => (
                    <TaskDetailCard
                      key={task._id}
                      task={task}
                      progress={progress}
                      onTaskClick={() => onTaskClick(task)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Grading Feedback */}
            {isCompleted && (
              <section className="flex flex-col gap-4">
                <h3 className="text-md text-foreground">Grading Feedback</h3>
                {passed ? (
                  <div className="bg-card border border-green-200 rounded-xl p-6 flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-green-600">
                      <span className="material-symbols-outlined">
                        check_circle
                      </span>
                      <h4 className="text-md">Stage Passed</h4>
                    </div>
                    <p className="text-muted-foreground">
                      Congratulations! You have successfully passed this stage
                      with {percentage}%.
                    </p>
                  </div>
                ) : (
                  <div className="bg-card border rounded-xl p-10 flex flex-col items-center justify-center text-center gap-2">
                    <span className="material-symbols-outlined text-[48px] text-muted-foreground/50">
                      pending_actions
                    </span>
                    <h4 className="text-md text-muted-foreground">
                      No Feedback Yet
                    </h4>
                    <p className="text-muted-foreground max-w-sm">
                      Feedback and grading will appear here once a coordinator
                      has reviewed your submissions.
                    </p>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {/* Right Column: Sidebar */}
      <aside className="w-full lg:w-[320px] flex flex-col md:flex-row lg:flex-col gap-4 shrink-0">
        {/* Status Card */}
        <div className="w-full bg-card/70 backdrop-blur-md border p-6 rounded-md flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-sm uppercase tracking-wider text-muted-foreground font-bold">
              Current Status
            </span>
            <Badge
              className={`${badge.color} text-xs bg-mainBlue/10 dark:bg-darkBlue/10 text-mainBlue dark:text-darkBlue px-2 py-0.5 rounded-sm font-medium`}
            >
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${badge.dot}`}
              />
              {badge.label}
            </Badge>
          </div>

          {isActive && (
            <ProgressRing
              percentage={percentage}
              label={`Pass threshold: ${stage.passPercentage}/100 points`}
              sublabel="Required"
            />
          )}

          {isCompleted && (
            <ProgressRing
              percentage={percentage}
              label={`Pass threshold: ${stage.passPercentage}/100 points`}
              sublabel={passed ? "Passed" : "Failed"}
            />
          )}

          <div className="border-t pt-4 flex flex-col gap-4">
            {daysRemaining !== null && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="material-symbols-outlined text-[20px]">
                    schedule
                  </span>
                  <span className="text-md">Time Remaining</span>
                </div>
                <span className="font-bold text-foreground">
                  {daysRemaining > 0
                    ? `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`
                    : "Overdue"}
                </span>
              </div>
            )}
            {formattedDate && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="material-symbols-outlined text-[20px]">
                    event_available
                  </span>
                  <span className="text-md">Due Date</span>
                </div>
                <span className="font-bold text-foreground">
                  {formattedDate}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Resources */}
        <div className="w-full bg-muted/30 p-6 rounded-md border flex flex-col gap-4">
          <h4 className="text-headline-md text-foreground">Quick Resources</h4>
          <div className="flex flex-col gap-3">
            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-accent group transition-all"
              onClick={(e) => e.preventDefault()}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-muted-foreground group-hover:text-mainBlue dark:group-hover:text-darkBlue">
                  description
                </span>
                <span className="text-md text-muted-foreground">
                  Stage Guide
                </span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-muted-foreground/50">
                open_in_new
              </span>
            </a>
            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-accent group transition-all"
              onClick={(e) => e.preventDefault()}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-muted-foreground group-hover:text-mainBlue dark:group-hover:text-darkBlue">
                  video_library
                </span>
                <span className="text-md text-muted-foreground">
                  Help Center
                </span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-muted-foreground/50">
                open_in_new
              </span>
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}

function TaskDetailCard({
  task,
  progress,
  onTaskClick,
}: {
  task: TaskData;
  progress: StageProgressData | null;
  onTaskClick: () => void;
}) {
  const isActive = progress?.status === "active";

  return (
    <button
      type="button"
      onClick={onTaskClick}
      disabled={!isActive}
      className="flex items-start gap-4 w-full text-left bg-card dark:bg-muted/30 border rounded-sm p-4 hover:bg-accent transition-all group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="w-10 h-10 rounded-full bg-mainBlue/10 dark:bg-darkBlue/10 flex items-center justify-center text-mainBlue dark:text-darkBlue shrink-0 mt-0.5">
        <span className="material-symbols-outlined text-[20px]">
          {task.type === "group" ? "group" : "person"}
        </span>
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
                className="inline-flex items-center gap-1 text-xs text-mainBlue dark:text-darkBlue bg-mainBlue/5 dark:bg-darkBlue/5 px-2 py-0.5 rounded-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="material-symbols-outlined text-[14px]">
                  link
                </span>
                {r.name}
              </a>
            ))}
          </div>
        )}
      </div>
      {isActive && (
        <span className="material-symbols-outlined text-muted-foreground group-hover:text-mainBlue dark:group-hover:text-darkBlue transition-colors shrink-0 mt-1">
          chevron_right
        </span>
      )}
    </button>
  );
}
