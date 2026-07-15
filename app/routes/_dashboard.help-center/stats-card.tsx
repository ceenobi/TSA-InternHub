import {
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiLoader4Fill,
  RiProgress8Fill,
  RiTicket2Fill,
} from "@remixicon/react";
import { Card, CardContent } from "~/components/ui/card";

export default function StatsCard({
  summary,
}: {
  summary: Record<string, any>;
}) {
  const stats = [
    {
      label: "Total Tickets",
      value: summary.totalTickets ?? 0,
      icon: RiTicket2Fill,
      color: "text-mainBlue dark:text-darkBlue",
      bg: "bg-mainBlue/10 dark:bg-darkBlue/10",
    },
    {
      label: "Open",
      value: summary.openTickets ?? 0,
      icon: RiErrorWarningFill,
      color: "text-red-500",
      bg: "bg-red-50 dark:bg-red-500/10",
    },
    {
      label: "In Progress",
      value: summary.inProgressTickets ?? 0,
      icon: RiLoader4Fill,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-500/10",
    },
    {
      label: "Resolved",
      value: summary.resolvedTickets ?? 0,
      icon: RiProgress8Fill,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-500/10",
    },
    {
      label: "Closed",
      value: summary.closedTickets ?? 0,
      icon: RiCheckboxCircleFill,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <Card
          key={stat.label}
          size="sm"
          className="rounded-sm dark:bg-muted/30 transition-[border-color,box-shadow] duration-300 animate-in fade-in slide-in-from-bottom-3"
            style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className="flex items-center gap-4">
            <div
              className={`size-10 rounded-full flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}
            >
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </p>
              <p className="text-xl font-bold tracking-tight text-foreground">
                {stat.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
