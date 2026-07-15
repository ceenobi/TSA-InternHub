import type { StageProgressData } from "~/types";

type StageInfo = {
  _id: string;
  order: number;
  title: string;
};

type StageNavProps = {
  stages: StageInfo[];
  progressMap: Record<string, StageProgressData | null>;
  activeStageId: string;
  onSelect: (stageId: string) => void;
};

export function StageNav({
  stages,
  progressMap,
  activeStageId,
  onSelect,
}: StageNavProps) {
  return (
    <div className="flex items-center gap-1">
      {stages.map((stage, index) => {
        const progress = progressMap[stage._id];
        const isActive = stage._id === activeStageId;
        const isCompleted = progress?.status === "completed";
        const isFailed = progress?.status === "failed";
        const isCurrentActive = progress?.status === "active";

        const stateIcon = () => {
          if (isCompleted) return "check_circle";
          if (isFailed) return "cancel";
          if (isCurrentActive) return "play_circle";
          if (isActive) return "radio_button_checked";
          return "radio_button_unchecked";
        };

        const stateColor = () => {
          if (isCompleted) return "text-green-500";
          if (isFailed) return "text-destructive";
          if (isCurrentActive || isActive) return "text-darkBlue";
          return "text-mainBlue";
        };

        return (
          <div key={stage._id} className="flex items-center gap-1 flex-1">
            <button
              onClick={() => onSelect(stage._id)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-sm transition-[background-color,border-color] text-left
                ${
                  isActive
                    ? "bg-white/5 border shadow"
                    : "hover:bg-white/5 hover:border hover:border-white/10"
                }
                ${isLocked(stages, progressMap, index) && !isActive ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
              `}
              disabled={isLocked(stages, progressMap, index) && !isActive}
            >
              <span
                className={`material-symbols-outlined text-mainBlue dark:text-darkBlue text-[20px] ${stateColor()}`}
              >
                {stateIcon()}
              </span>
              <span
                className={`text-sm font-semibold truncate ${isActive ? "text-mainBlue dark:text-white" : "text-muted-foreground"}`}
              >
                S{stage.order}
              </span>
            </button>
            {index < stages.length - 1 && (
              <div className="flex-1 h-px bg-muted-foreground/20 last:hidden" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function isLocked(
  stages: StageInfo[],
  progressMap: Record<string, StageProgressData | null>,
  index: number,
): boolean {
  if (index === 0) return false;
  const prevProgress = progressMap[stages[index - 1]._id];
  return prevProgress?.status !== "completed";
}
