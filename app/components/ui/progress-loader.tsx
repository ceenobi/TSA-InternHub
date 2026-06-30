import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cn } from "~/lib/utils"

function ProgressLoader({
  className,
  value = 0,
  indicatorClassName,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string;
  value?: number;
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        "bg-muted h-1 relative flex w-full items-center overflow-x-hidden",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "bg-primary size-full flex-1 transition-all",
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { ProgressLoader };