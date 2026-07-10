import {
  RiBarChartBoxFill,
  RiFileList3Fill,
  RiGitBranchFill,
  RiGroupFill,
  RiLineChartFill,
  RiPieChartFill,
  RiShieldUserFill,
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
import { Skeleton } from "~/components/ui/skeleton";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { cn } from "~/lib/utils";
import { requirePermission } from "~/middleware/auth.middleware";
import { getAdminTaskStatsQuery } from "~/queries/tasks.server";
import type { Route } from "./+types/route";

export const middleware = [requirePermission("MANAGE_TASKS")];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Task Stats | TSA InternHub" },
    {
      name: "description",
      content: "View program-wide task performance statistics.",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const queryClient = getQueryClientRsc();
  const stats = queryClient.ensureQueryData(getAdminTaskStatsQuery(request));
  return {
    dehydratedState: dehydrate(queryClient),
    stats,
  };
}

export default function AdminTaskStats({ loaderData }: Route.ComponentProps) {
  const { stats } = loaderData;

  return (
    <PageSection index={1} className="space-y-8">
      <Suspense fallback={<AdminTaskStatsSkeleton />}>
        <Await resolve={stats} errorElement={<DataError />}>
          {(resolved) => {
            const { summary, trends } = resolved;
            return (
              <>
                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon={<RiGroupFill size={20} />}
                    label="Total Users"
                    value={`${summary.totalUsers}`}
                    sublabel={`${summary.activeUsers} active · ${summary.suspendedUsers} suspended`}
                    iconClass="text-blue-500 dark:text-blue-400"
                  />
                  <StatCard
                    icon={<RiFileList3Fill size={20} />}
                    label="Submissions"
                    value={`${summary.totalSubmissions}`}
                    sublabel={`${summary.gradedCount} graded · ${summary.pendingCount} pending · ${summary.returnedCount} returned`}
                    iconClass="text-violet-500 dark:text-violet-400"
                  />
                  <StatCard
                    icon={<RiTrophyFill size={20} />}
                    label="Average Score"
                    value={`${summary.averageScore}%`}
                    sublabel={`Across ${summary.gradedCount} graded submissions`}
                    iconClass="text-amber-500 dark:text-amber-400"
                  />
                  <StatCard
                    icon={<RiTimeFill size={20} />}
                    label="On-Time Rate"
                    value={`${summary.onTimeRate}%`}
                    sublabel={
                      summary.onTimeRate >= 80
                        ? "Great consistency"
                        : summary.onTimeRate >= 50
                          ? "Moderate"
                          : "Needs improvement"
                    }
                    iconClass="text-green-500 dark:text-green-400"
                  />
                </div>

                {/* ── Charts Row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Score Distribution */}
                  <Card className="rounded-sm dark:bg-muted/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <RiBarChartBoxFill
                          size={16}
                          className="text-mainBlue dark:text-darkBlue"
                        />
                        Score Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {trends.scoreDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={trends.scoreDistribution}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="currentColor"
                              className="text-border/50"
                            />
                            <XAxis
                              dataKey="label"
                              tick={{ fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              className="text-muted-foreground"
                            />
                            <YAxis
                              tick={{ fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              className="text-muted-foreground"
                              allowDecimals={false}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "4px",
                                border: "1px solid var(--border)",
                                background: "var(--card)",
                                fontSize: "13px",
                              }}
                              formatter={(value, name) => {
                                if (name === "count")
                                  return [value, "Submissions"];
                                return [value, name];
                              }}
                            />
                            <Bar
                              dataKey="count"
                              radius={[3, 3, 0, 0]}
                              barSize={40}
                              shape={(props: any) => {
                                const { x, y, width, height, index } = props;
                                const colors = [
                                  "#ef4444",
                                  "#f97316",
                                  "#eab308",
                                  "#22c55e",
                                  "#16a34a",
                                  "#059669",
                                ];
                                return (
                                  <rect
                                    x={x}
                                    y={y}
                                    width={width}
                                    height={height}
                                    fill={colors[index % colors.length]}
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
                          No graded submissions yet
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Submission Activity */}
                  <Card className="rounded-sm dark:bg-muted/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <RiLineChartFill
                          size={16}
                          className="text-mainBlue dark:text-darkBlue"
                        />
                        Submission Activity (30 days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {trends.submissionActivity.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={trends.submissionActivity}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="currentColor"
                              className="text-border/50"
                            />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 10 }}
                              tickLine={false}
                              axisLine={false}
                              className="text-muted-foreground"
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis
                              tick={{ fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              className="text-muted-foreground"
                              allowDecimals={false}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "4px",
                                border: "1px solid var(--border)",
                                background: "var(--card)",
                                fontSize: "13px",
                              }}
                              formatter={(value) => [value, "Submissions"]}
                              labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Line
                              type="monotone"
                              dataKey="count"
                              stroke="#14233d"
                              strokeWidth={2.5}
                              dot={false}
                              activeDot={{ r: 5, fill: "#14233d" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-60 text-sm text-muted-foreground">
                          No submission activity in the last 30 days
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* ── Stage Completion ── */}
                <Card className="rounded-sm dark:bg-muted/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <RiGitBranchFill
                        size={16}
                        className="text-mainBlue dark:text-darkBlue"
                      />
                      Stage Completion Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {trends.stageCompletion.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 font-medium text-muted-foreground">
                                Stage
                              </th>
                              <th className="text-center py-3 font-medium text-muted-foreground">
                                Pass %
                              </th>
                              <th className="text-center py-3 font-medium text-muted-foreground">
                                Completed
                              </th>
                              <th className="text-center py-3 font-medium text-muted-foreground">
                                Active
                              </th>
                              <th className="text-center py-3 font-medium text-muted-foreground">
                                Failed
                              </th>
                              <th className="text-center py-3 font-medium text-muted-foreground">
                                Inactive
                              </th>
                              <th className="text-right py-3 font-medium text-muted-foreground">
                                Progress
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {trends.stageCompletion.map((stage) => {
                              const inactive =
                                stage.totalUsers -
                                stage.completedCount -
                                stage.activeCount -
                                stage.failedCount;
                              const completionRate =
                                stage.totalUsers > 0
                                  ? Math.round(
                                      (stage.completedCount /
                                        stage.totalUsers) *
                                        100,
                                    )
                                  : 0;
                              return (
                                <tr
                                  key={stage.stageId}
                                  className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                                >
                                  <td className="py-3.5 font-medium">
                                    <span className="text-xs text-muted-foreground mr-2">
                                      S{stage.order}
                                    </span>
                                    {stage.stageTitle}
                                  </td>
                                  <td className="text-center py-3.5 text-muted-foreground text-xs">
                                    {stage.passPercentage}%
                                  </td>
                                  <td className="text-center py-3.5">
                                    <span className="text-green-600 dark:text-green-400 font-semibold">
                                      {stage.completedCount}
                                    </span>
                                  </td>
                                  <td className="text-center py-3.5">
                                    <span className="text-yellow-500 font-semibold">
                                      {stage.activeCount}
                                    </span>
                                  </td>
                                  <td className="text-center py-3.5">
                                    <span className="text-red-500 font-semibold">
                                      {stage.failedCount}
                                    </span>
                                  </td>
                                  <td className="text-center py-3.5 text-muted-foreground">
                                    {inactive}
                                  </td>
                                  <td className="text-right py-3.5">
                                    <div className="flex items-center gap-2 justify-end">
                                      <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                                        <div
                                          className="h-full rounded-full bg-mainBlue dark:bg-darkBlue transition-all"
                                          style={{
                                            width: `${completionRate}%`,
                                          }}
                                        />
                                      </div>
                                      <span className="text-xs font-medium tabular-nums w-8 text-right">
                                        {completionRate}%
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                        No stage progress data yet
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ── Top Performing Users + Submission Donut ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Users */}
                  <Card className="rounded-sm dark:bg-muted/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <RiShieldUserFill
                          size={16}
                          className="text-mainBlue dark:text-darkBlue"
                        />
                        Top Performing Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {trends.topUsers.length > 0 ? (
                        <div className="space-y-2">
                          {trends.topUsers.map((user, index) => (
                            <div
                              key={user.userId}
                              className="flex items-center justify-between py-2 px-3 rounded-sm hover:bg-muted/40 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className={cn(
                                    "size-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                    index === 0
                                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                      : index === 1
                                        ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300"
                                        : index === 2
                                          ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                                          : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  {index + 1}
                                </span>
                                <span className="text-sm font-medium truncate">
                                  {user.userName}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 shrink-0">
                                <span className="text-xs text-muted-foreground">
                                  {user.submissionsGraded} graded
                                </span>
                                <span className="text-sm font-semibold tabular-nums">
                                  {user.averageScore}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                          No graded submissions yet
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Submission Donut */}
                  <Card className="rounded-sm dark:bg-muted/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <RiPieChartFill
                          size={16}
                          className="text-mainBlue dark:text-darkBlue"
                        />
                        Submission Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {summary.totalSubmissions > 0 ? (
                        <div className="flex items-center gap-8">
                          <ResponsiveContainer width={180} height={180}>
                            <PieChart>
                              <Pie
                                data={[
                                  {
                                    name: "Graded",
                                    value: summary.gradedCount,
                                    fill: "#22c55e",
                                  },
                                  {
                                    name: "Pending",
                                    value: summary.pendingCount,
                                    fill: "#eab308",
                                  },
                                  {
                                    name: "Returned",
                                    value: summary.returnedCount,
                                    fill: "#f97316",
                                  },
                                ].filter((s) => s.value > 0)}
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
                            {[
                              {
                                name: "Graded",
                                value: summary.gradedCount,
                                color: "#22c55e",
                              },
                              {
                                name: "Pending",
                                value: summary.pendingCount,
                                color: "#eab308",
                              },
                              {
                                name: "Returned",
                                value: summary.returnedCount,
                                color: "#f97316",
                              },
                            ]
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
                </div>
              </>
            );
          }}
        </Await>
      </Suspense>
    </PageSection>
  );
}

// ── Stat Card ──

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

// ── Skeleton ──

function AdminTaskStatsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} size="sm" className="rounded-sm dark:bg-muted/30">
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="size-9 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="rounded-sm dark:bg-muted/30">
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-60 w-full rounded-sm" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="rounded-sm dark:bg-muted/30">
        <CardHeader>
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full rounded-sm" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="rounded-sm dark:bg-muted/30">
            <CardHeader>
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-44 w-full rounded-sm" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
