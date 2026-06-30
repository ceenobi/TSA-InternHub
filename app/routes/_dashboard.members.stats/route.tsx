import { dehydrate } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { Await, useOutletContext } from "react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageSection } from "~/components/provider/page-wrapper";
import { CanPermit } from "~/components/provider/rbac-permit";
import AccessDenied from "~/components/ui/access-denied";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { CohortStatsSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { requirePermission } from "~/middleware/auth.middleware";
import { getCohortStatsQuery } from "~/queries/cohorts";
import type { UserData } from "~/types";
import type { Route } from "../_dashboard.members.stats/+types/route";

export const middleware = [requirePermission("MANAGE_COHORTS")];

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const queryClient = getQueryClientRsc();
  const cohortStats = queryClient.ensureQueryData(getCohortStatsQuery(request));
  return {
    dehydratedState: dehydrate(queryClient),
    cohortStats,
  };
}

export function HydrateFallback() {
  return <CohortStatsSkeleton />;
}

export default function MembersStats({ loaderData }: Route.ComponentProps) {
  const { cohortStats } = loaderData;
  const { user } = useOutletContext() as { user: UserData };
  const [viewMode, setViewMode] = useState<"allTime" | "activeSnapshot">(
    "allTime",
  );

  return (
    <CanPermit
      user={user}
      permission="MANAGE_COHORTS"
      fallback={<AccessDenied />}
    >
      <PageSection index={1} className="space-y-8">
        <Suspense fallback={<CohortStatsSkeleton />}>
          <Await resolve={cohortStats}>
            {(stats) => {
              const data =
                viewMode === "allTime"
                  ? stats.programComparison[0]?.allTime
                  : stats.programComparison[0]?.activeSnapshot;

              return (
                <div className="space-y-6">
                  {/* Stat Cards */}
                  <PageSection
                    index={2}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <StatCard
                      title="Active Cohort"
                      value={stats.activeCohortStats?.name || "N/A"}
                    />
                    <StatCard
                      title="Total Invites"
                      value={stats.activeCohortStats?.totalInvites || 0}
                    />
                    <StatCard
                      title="Suspended Users"
                      value={stats.activeCohortStats?.suspendedUsers || 0}
                    />
                  </PageSection>

                  {/* Charts */}
                  <PageSection
                    index={3}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <Card className="rounded-md dark:bg-muted/30">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Program Comparison</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={
                              viewMode === "allTime" ? "default" : "outline"
                            }
                            className={
                              viewMode === "allTime"
                                ? "dark:border dark:border-mainGold dark:bg-mainGold/20 dark:text-white"
                                : undefined
                            }
                            onClick={() => setViewMode("allTime")}
                          >
                            All-Time
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              viewMode === "activeSnapshot"
                                ? "default"
                                : "outline"
                            }
                            className={
                              viewMode === "activeSnapshot"
                                ? "dark:border dark:border-mainGold dark:bg-mainGold/20 dark:text-white"
                                : undefined
                            }
                            onClick={() => setViewMode("activeSnapshot")}
                          >
                            Active
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="h-64 flex min-h-0 w-full">
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                          minWidth={0}
                        >
                          <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="_id" />
                            <YAxis />
                            <Tooltip />
                            {viewMode === "allTime" ? (
                              <>
                                <Bar
                                  dataKey="totalCohorts"
                                  fill="#3b82f6"
                                  name="Total Cohorts"
                                />
                                <Bar
                                  dataKey="activeCohorts"
                                  fill="#10b981"
                                  name="Active Cohorts"
                                />
                              </>
                            ) : (
                              <Bar
                                dataKey="activeCohortCount"
                                fill="#10b981"
                                name="Active Cohorts"
                              />
                            )}
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="rounded-md dark:bg-muted/30">
                      <CardHeader>
                        <CardTitle>Registration Trends (30 Days)</CardTitle>
                      </CardHeader>
                      <CardContent className="h-64 flex min-h-0 w-full">
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                          minWidth={0}
                        >
                          <AreaChart data={stats.trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="_id" />
                            <YAxis />
                            <Tooltip />
                            <Area
                              type="monotone"
                              dataKey="registrations"
                              stroke="#8884d8"
                              fill="#8884d8"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </PageSection>
                </div>
              );
            }}
          </Await>
        </Suspense>
      </PageSection>
    </CanPermit>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card
      className="rounded-md dark:bg-muted/30 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{ animationDelay: `${1 * 100}ms` }}
    >
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
