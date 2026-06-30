import { isToday, isSameMonth } from "date-fns";
import { cn } from "~/lib/utils";
import type { CalendarEvent } from "~/types";

type DayCellProps = {
  day: Date;
  currentMonth: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
};

export function DayCell({ day, currentMonth, events, onEventClick }: DayCellProps) {
  const today = isToday(day);
  const sameMonth = isSameMonth(day, currentMonth);

  if (!sameMonth) {
    return <div className="min-h-22.5 border-r border-b border-border opacity-40" />;
  }

  const rangeEvents = events.filter((e) => e.type === "project" || e.type === "stage");
  const taskEvents = events.filter((e) => e.type === "task");

  return (
    <div className="min-h-22.5 border-r border-b border-border p-1 transition-colors hover:bg-muted/30">
      <div className="mb-1 flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
              today && "bg-mainBlue dark:bg-darkBlue text-white",
              !today && "text-foreground",
            )}
          >
            {day.getDate()}
          </span>
        </div>
        {rangeEvents.length > 0 && (
          <div className="flex gap-0.5">
            {rangeEvents.map((event) => (
              <button
                key={event._id}
                onClick={() => onEventClick?.(event)}
                title={event.title}
                className={cn("h-1.5 flex-1 rounded-full transition-opacity hover:opacity-80", event.color)}
              />
            ))}
          </div>
        )}
      </div>
      {taskEvents.length > 0 && (
        <div className="space-y-0.5">
          {taskEvents.slice(0, 3).map((event) => (
            <button
              key={event._id}
              onClick={() => onEventClick?.(event)}
              className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] leading-tight transition-colors hover:opacity-80"
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  event.color || "bg-red-400",
                )}
              />
              <span className="truncate">{event.title}</span>
            </button>
          ))}
          {taskEvents.length > 3 && (
            <span className="block px-1 text-[10px] text-muted-foreground">
              +{taskEvents.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
