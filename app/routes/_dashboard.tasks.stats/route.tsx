import {
  RiBarChartBoxFill,
  RiCheckboxCircleFill,
  RiLineChartFill,
  RiPieChartFill,
  RiTimeFill,
  RiTrophyFill,
} from "@remixicon/react";
import { dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";
import { Await } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageSection } from "~/components/provider/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import DataError from "~/components/ui/data-error";
import { TaskStatsSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { getTaskStatsQuery } from "~/queries/tasks.server";
import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  const queryClient = getQueryClientRsc();
  const stats = queryClient.ensureQueryData(getTaskStatsQuery(request));
  return {
    dehydratedState: dehydrate(queryClient),
    stats,
  };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Task Stats | TSA InternHub" },
    {
      name: "description",
      content: "View your task performance statistics and trends.",
    },
  ];
}

export default function TaskStatsRoute({ loaderData }: Route.ComponentProps) {
  const { stats } = loaderData;

  return (
    <PageSection index={1} className="space-y-8">
      <Suspense fallback={<TaskStatsSkeleton />}>
        <Await resolve={stats} errorElement={<DataError />}>
          {(resolved) => {
            const { summary, trends } = resolved;
            return (
              <>
                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon={<RiCheckboxCircleFill size={22} />}
                    label="Tasks Completed"
                    value={`${summary.tasksCompleted}`}
                    sublabel={
                      summary.totalTasks > 0
                        ? `of ${summary.totalTasks} total`
                        : "No tasks"
                    }
                    iconClass="text-green-600 dark:text-green-400"
                  />
                  <StatCard
                    icon={<RiTrophyFill size={22} />}
                    label="Average Score"
                    value={`${summary.averageScore}%`}
                    sublabel={
                      summary.tasksCompleted > 0
                        ? `Across ${summary.tasksCompleted} tasks`
                        : "No grades yet"
                    }
                    iconClass="text-amber-500 dark:text-amber-400"
                  />
                  <StatCard
                    icon={<RiTimeFill size={22} />}
                    label="On-Time Rate"
                    value={`${summary.onTimeRate}%`}
                    sublabel={
                      summary.onTimeRate >= 80
                        ? "Great consistency"
                        : summary.onTimeRate >= 50
                          ? "Room for improvement"
                          : "Needs attention"
                    }
                    iconClass="text-blue-500 dark:text-blue-400"
                  />
                  <StatCard
                    icon={<RiBarChartBoxFill size={22} />}
                    label="Stage Progress"
                    value={`${summary.stageProgress}%`}
                    sublabel={
                      summary.stageProgress === 100
                        ? "All stages completed"
                        : "Stages in progress"
                    }
                    iconClass="text-violet-500 dark:text-violet-400"
                  />
                </div>

                {/* ── Charts Row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Score Trend Line Chart */}
                  <Card className="rounded-sm dark:bg-muted/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <RiLineChartFill
                          size={16}
                          className="text-mainBlue dark:text-darkBlue"
                        />
                        Score Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {trends.scoreTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={trends.scoreTrend}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="currentColor"
                              className="text-border/50"
                            />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              className="text-muted-foreground"
                            />
                            <YAxis
                              domain={[0, 100]}
                              tick={{ fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              className="text-muted-foreground"
                              unit="%"
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "4px",
                                border: "1px solid var(--border)",
                                background: "var(--card)",
                                fontSize: "13px",
                              }}
                              formatter={(value) => [`${value}%`, "Score"]}
                              labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Line
                              type="monotone"
                              dataKey="percentage"
                              stroke="#14233d"
                              strokeWidth={2.5}
                              dot={{ r: 4, fill: "#14233d" }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-60 text-sm text-muted-foreground">
                          No graded submissions yet
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Stage Breakdown Bar Chart */}
                  <Card className="rounded-sm dark:bg-muted/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <RiBarChartBoxFill
                          size={16}
                          className="text-mainBlue dark:text-darkBlue"
                        />
                        Stage Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {trends.stageBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={trends.stageBreakdown}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="currentColor"
                              className="text-border/50"
                            />
                            <XAxis
                              dataKey="stageTitle"
                              tick={{ fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              className="text-muted-foreground"
                            />
                            <YAxis
                              domain={[0, 100]}
                              tick={{ fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              className="text-muted-foreground"
                              unit="%"
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "4px",
                                border: "1px solid var(--border)",
                                background: "var(--card)",
                                fontSize: "13px",
                              }}
                              formatter={(value, name) => {
                                if (name === "percentage")
                                  return [`${value}%` as string, "Your Score"];
                                return [value, name];
                              }}
                            />
                            <Bar
                              dataKey="percentage"
                              radius={[3, 3, 0, 0]}
                              barSize={36}
                              shape={(props: any) => {
                                const { x, y, width, height, index } = props;
                                const entry = trends.stageBreakdown[index];
                                const barFill =
                                  entry.status === "completed"
                                    ? entry.passed
                                      ? "#22c55e"
                                      : "#ef4444"
                                    : entry.status === "active"
                                      ? "#eab308"
                                      : "#6b7280";
                                return (
                                  <rect
                                    x={x}
                                    y={y}
                                    width={width}
                                    height={height}
                                    fill={barFill}
                                    rx={3}
                                    ry={3}
                                  />
                                );
                              }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-60 text-sm text-muted-foreground">
                          No stage progress data yet
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* ── Submission Donut Chart ── */}
                <Card className="rounded-sm dark:bg-muted/30 max-w-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <RiPieChartFill
                        size={16}
                        className="text-mainBlue dark:text-darkBlue"
                      />
                      Submission Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {trends.submissionSummary.some((s) => s.value > 0) ? (
                      <div className="flex items-center gap-8">
                        <ResponsiveContainer width={180} height={180}>
                          <PieChart>
                            <Pie
                              data={trends.submissionSummary
                                .filter((s) => s.value > 0)
                                .map((s) => ({ ...s, fill: s.color }))}
                              cx="50%"
                              cy="50%"
                              innerRadius={52}
                              outerRadius={80}
                              paddingAngle={3}
                              dataKey="value"
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "4px",
                                border: "1px solid var(--border)",
                                background: "var(--card)",
                                fontSize: "13px",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-col gap-2.5">
                          {trends.submissionSummary
                            .filter((s) => s.value > 0)
                            .map((s) => (
                              <div
                                key={s.name}
                                className="flex items-center gap-2.5 text-sm"
                              >
                                <span
                                  className="size-3 rounded-sm shrink-0"
                                  style={{ background: s.color }}
                                />
                                <span className="text-muted-foreground">
                                  {s.name}
                                </span>
                                <span className="font-semibold text-foreground">
                                  {s.value}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                        No submissions yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            );
          }}
        </Await>
      </Suspense>
    </PageSection>
  );
}

// ── Stat Card Component ──

function StatCard({
  icon,
  label,
  value,
  sublabel,
  iconClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  iconClass: string;
}) {
  return (
    <Card size="sm" className="rounded-sm dark:bg-muted/30">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <div
            className={`size-9 rounded-full flex items-center justify-center bg-muted dark:bg-muted/50 ${iconClass}`}
          >
            {icon}
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">
            {sublabel}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
