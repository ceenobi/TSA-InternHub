import {
  RiCheckLine,
  RiCloseLine,
  RiFilter3Line,
  RiTimeLine,
} from "@remixicon/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import NotFound from "~/components/ui/not-found";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "~/components/ui/select";
import TableView from "~/components/ui/table-view";
import { useIsMobile } from "~/hooks/useMobile";
import { getScoreBoardQuery } from "~/queries/scoreboard.server";
import type { ScoreBoardUser, UserData } from "~/types";
import type { Route } from "./+types/route";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Records | TSA InternHub" },
    {
      name: "description",
      content: "View user grades and performance per cohort.",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { getQueryClientRsc } = await import("~/lib/getQueryClient");
  const queryClient = getQueryClientRsc();
  const scoreboard = await queryClient.ensureQueryData(
    getScoreBoardQuery(request),
  );
  return scoreboard;
}

function statusIcon(status: string) {
  switch (status) {
    case "completed":
      return <RiCheckLine size={14} className="text-emerald-500" />;
    case "failed":
      return <RiCloseLine size={14} className="text-red-500" />;
    default:
      return <RiTimeLine size={14} className="text-muted-foreground" />;
  }
}

function GradeBadge({ percentage }: { percentage: number }) {
  const color =
    percentage >= 70
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : percentage > 0
        ? "bg-red-500/10 text-red-600 dark:text-red-400"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {percentage > 0 ? `${percentage}%` : "---"}
    </span>
  );
}

export default function ProjectRecordsRoute({
  loaderData,
}: Route.ComponentProps) {
  const scoreboard = loaderData;
  const { user } = useOutletContext() as { user: UserData };
  const [selectedCohortId, setSelectedCohortId] = useState<string>(
    scoreboard.length > 0 ? scoreboard[0].cohort._id : "",
  );
  const isMobile = useIsMobile({ MOBILE_BREAKPOINT: 768 });

  const selectedEntry = scoreboard.find(
    (e) => e.cohort._id === selectedCohortId,
  );

  const stages = selectedEntry?.users[0]?.stages ?? [];

  const columns = useMemo<ColumnDef<ScoreBoardUser>[]>(() => {
    const cols: ColumnDef<ScoreBoardUser>[] = [
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-foreground">
            {row.original.user.name}
          </span>
        ),
        enableSorting: true,
      },
    ];

    stages.forEach((s) => {
      cols.push({
        id: s.stage._id,
        header: () => (
          <span
            className="text-[10px] leading-tight block max-w-28 truncate"
            title={`${s.stage.project.title}: ${s.stage.title}`}
          >
            {s.stage.title}
          </span>
        ),
        cell: ({ row }) => {
          const stage = row.original.stages.find(
            (sp) => sp.stage._id === s.stage._id,
          );
          if (!stage) return <span className="text-muted-foreground">---</span>;
          return (
            <div className="flex items-center gap-1.5">
              {statusIcon(stage.status)}
              <GradeBadge percentage={stage.percentage} />
            </div>
          );
        },
      });
    });

    cols.push({
      id: "average",
      header: "Average",
      cell: ({ row }) => (
        <span className="text-xs font-bold">
          <GradeBadge percentage={row.original.average} />
        </span>
      ),
    });

    return cols;
  }, [stages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Records
          </h1>
          <p className="text-muted-foreground text-sm">
            View user grades and performance per cohort.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted/30 px-3 rounded-md border border-border/80">
          <RiFilter3Line size={16} className="text-muted-foreground" />
          <Select
            value={selectedCohortId}
            onValueChange={(value) => {
              if (value) setSelectedCohortId(value);
            }}
          >
            <SelectTrigger className="rounded-sm w-full sm:w-56 border-none bg-transparent h-fit p-0 focus:ring-0 shadow-none text-xs font-bold uppercase tracking-widest ">
              {selectedEntry?.cohort.name || "Select cohort"}
            </SelectTrigger>
            <SelectContent className="rounded-sm">
              {scoreboard.map((entry) => (
                <SelectItem key={entry.cohort._id} value={entry.cohort._id}>
                  {entry.cohort.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedEntry || selectedEntry.users.length === 0 ? (
        <NotFound
          title="No data"
          message="No records found for the selected cohort."
        />
      ) : stages.length === 0 ? (
        <NotFound
          title="No stages"
          message="This cohort has no stages configured yet."
        />
      ) : isMobile ? (
        <div className="grid grid-cols-1 gap-4">
          {selectedEntry.users.map((su) => (
            <Card key={su.user._id} size="sm" className="dark:bg-muted/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{su.user.name}</span>
                  <GradeBadge percentage={su.average} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 divide-y divide-border/50">
                  {su.stages.map((s) => (
                    <div
                      key={s.stage._id}
                      className="flex items-center justify-between pt-2 first:pt-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {statusIcon(s.status)}
                        <span className="text-xs text-muted-foreground truncate">
                          {s.stage.title}
                        </span>
                      </div>
                      <GradeBadge percentage={s.percentage} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <TableView columns={columns} data={selectedEntry.users} />
      )}
    </div>
  );
}
