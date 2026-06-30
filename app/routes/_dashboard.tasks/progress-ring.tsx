import { cn } from "~/lib/utils";

type ProgressRingProps = {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
  sublabel?: string;
};

export function ProgressRing({
  percentage,
  size = 128,
  strokeWidth = 8,
  className,
  label,
  sublabel,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="-rotate-90"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-mainBlue dark:text-darkBlue transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-manrope text-headline-lg font-bold text-foreground">
            {Math.round(percentage)}%
          </span>
          {sublabel && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {sublabel}
            </span>
          )}
        </div>
      </div>
      {label && (
        <p className="mt-4 text-center text-label-md text-muted-foreground">
          {label}
        </p>
      )}
    </div>
  );
}
