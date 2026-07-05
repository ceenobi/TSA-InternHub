import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { useCallback, useMemo, useState } from "react";
import Modal from "~/components/ui/modal";
import NotFound from "~/components/ui/not-found";
import { cn } from "~/lib/utils";
import type { CalendarQueryResult } from "~/queries/calendar.server";
import type { CalendarEvent } from "~/types";
import { DayCell } from "./day-cell";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalendarViewProps = {
  data: CalendarQueryResult;
};

export function CalendarView({ data }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  const { events } = data;
  const gridStart = days[0];
  const gridEnd = days[days.length - 1];

  const prevMonth = () => setCurrentDate((d: Date) => subMonths(d, 1));
  const nextMonth = () => setCurrentDate((d: Date) => addMonths(d, 1));
  const goToday = () => setCurrentDate(new Date());

  const monthLabel = format(currentDate, "MMMM yyyy");

  const projectRow = useMemo(() => {
    const projectEvents = events.filter(
      (e: CalendarEvent) => e.type === "project" && e.startDate && e.endDate,
    );
    if (projectEvents.length === 0) return null;

    const event = projectEvents[0];
    const start = parseISO(event.startDate!);
    const end = parseISO(event.endDate!);

    if (end < gridStart || start > gridEnd) return null;

    const lastIndex = (predicate: (d: Date) => boolean) => {
      for (let i = days.length - 1; i >= 0; i--) {
        if (predicate(days[i])) return i;
      }
      return -1;
    };

    const startIndex = days.findIndex(
      (d: Date) =>
        isSameDay(d, start) || (d > start && days.indexOf(d) === 0),
    );
    const endIndex = lastIndex(
      (d: Date) =>
        isSameDay(d, end) || (d < end && days.indexOf(d) === days.length - 1),
    );

    const colStart = Math.max(startIndex, 0);
    const colEnd = Math.min(endIndex, days.length - 1);
    const span = colEnd - colStart + 1;

    if (span <= 0) return null;

    return { event, colStart, span };
  }, [events, days, gridStart, gridEnd]);

  const getEventsForDay = useCallback(
    (day: Date): CalendarEvent[] => {
      return events.filter((e: CalendarEvent) => {
        if (e.type === "task" && e.date) {
          return isSameDay(day, parseISO(e.date));
        }
        if (
          e.type === "stage" &&
          e.startDate &&
          e.endDate
        ) {
          return isWithinInterval(day, {
            start: parseISO(e.startDate),
            end: parseISO(e.endDate),
          });
        }
        return false;
      });
    },
    [events],
  );

  if (!data || !data.project) {
    return <NotFound title="No active project" message="Please create a project to view your calendar." />;
  }

  return (
    <>
      <div className="rounded-sm border border-border bg-card dark:bg-muted/30">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Previous month"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
            </button>
            <h2 className="min-w-40 text-center text-base font-semibold text-foreground">
              {monthLabel}
            </h2>
            <button
              onClick={nextMonth}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Next month"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5 15.75 12 8.25 19.5"
                />
              </svg>
            </button>
          </div>
          <button
            onClick={goToday}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-mainBlue dark:text-mainGold transition-colors hover:bg-mainBlue/10"
          >
            Today
          </button>
        </div>

        <div className="grid grid-cols-7">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="border-r border-b border-border px-2 py-2 text-center text-xs font-semibold uppercase text-muted-foreground last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {projectRow && (
          <div className="grid grid-cols-7 border-b border-border">
            <button
              onClick={() => setSelectedEvent(projectRow.event)}
              className={cn(
                "mx-0.5 my-1 flex items-center overflow-hidden rounded px-2 py-1 text-left text-xs font-medium text-white transition-opacity hover:opacity-80",
                projectRow.event.color,
              )}
              style={{
                gridColumn: `${projectRow.colStart + 1} / span ${projectRow.span}`,
              }}
            >
              <span className="truncate">{projectRow.event.title}</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-7">
          {days.map((day: Date) => (
            <DayCell
              key={day.toISOString()}
              day={day}
              currentMonth={currentDate}
              events={getEventsForDay(day)}
              onEventClick={setSelectedEvent}
            />
          ))}
        </div>
      </div>

      <Modal
        isOpen={!!selectedEvent}
        setIsOpen={(open) => {
          if (!open) setSelectedEvent(null);
        }}
        title={selectedEvent?.title || ""}
        description={`${selectedEvent?.type ? selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1) : ""} event`}
      >
        {selectedEvent && (
          <div className="space-y-4 text-sm">
            {selectedEvent.description && (
              <p className="text-muted-foreground">
                {selectedEvent.description}
              </p>
            )}
            <div className="dark:bg-muted/30 divide-y divide-border rounded-lg border border-border">
              {selectedEvent.date && (
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-muted-foreground">Due date</span>
                  <span className="font-medium text-foreground">
                    {format(parseISO(selectedEvent.date), "MMM dd, yyyy")}
                  </span>
                </div>
              )}
              {selectedEvent.startDate && (
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-muted-foreground">Start</span>
                  <span className="font-medium text-foreground">
                    {format(parseISO(selectedEvent.startDate), "MMM dd, yyyy")}
                  </span>
                </div>
              )}
              {selectedEvent.endDate && (
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-muted-foreground">End</span>
                  <span className="font-medium text-foreground">
                    {format(parseISO(selectedEvent.endDate), "MMM dd, yyyy")}
                  </span>
                </div>
              )}
              {selectedEvent.status && (
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-muted-foreground">Status</span>
                  <span className="capitalize font-medium text-foreground">
                    {selectedEvent.status.replace("-", " ")}
                  </span>
                </div>
              )}
              {selectedEvent.stageOrder && (
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-muted-foreground">Stage</span>
                  <span className="font-medium text-foreground">
                    Stage {selectedEvent.stageOrder}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
