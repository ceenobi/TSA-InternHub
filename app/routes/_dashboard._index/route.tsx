import {
  RiArrowRightDownLine,
  RiArrowRightUpLine,
  RiBarChartBoxLine,
  RiCalendarCheckLine,
  RiCheckboxCircleLine,
  RiFilter3Line,
  RiGroupLine,
  RiStarLine,
  RiTimeLine,
} from "@remixicon/react";
import { Suspense, useMemo } from "react";
import { Await, Link, useOutletContext, useSearchParams } from "react-router";
import { PageSection, PageWrapper } from "~/components/provider/page-wrapper";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import DataError from "~/components/ui/data-error";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { DashboardSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { cn } from "~/lib/utils";
import { getDashboardQuery } from "~/queries/dashboard.server";
import type {
  AdminDashboardData,
  AnnouncementData,
  ScoreBoardEntry,
  UserDashboardData,
  UserData,
} from "~/types";
import type { Route } from "./+types/route";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard | TSA InternHub. View your program's dashboard and manage your interns." },
    { name: "description", content: "Welcome to TSA InternHub Dashboard. Here you can view your program's dashboard and manage your interns." },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const queryClient = getQueryClientRsc();
  const dashboardData = queryClient.ensureQueryData(getDashboardQuery(request));
  return { dashboardData };
}

export default function DashboardRoute({ loaderData }: Route.ComponentProps) {
  const { user } = useOutletContext() as { user: UserData };
  const { dashboardData } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const currentProgram = searchParams.get("program") || "";

  const handleProgramChange = (value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (!value || value === "") {
      newParams.delete("program");
    } else {
      newParams.set("program", value);
    }
    setSearchParams(newParams);
  };

  return (
    <PageWrapper>
      <PageSection index={0} className="space-y-8 xl:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
              Welcome back, {user.name?.split(" ")[0] || "there"}
            </h1>
            <p className="text-muted-foreground text-sm">
              Here&apos;s what&apos;s happening across your program.
            </p>
          </div>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <Await resolve={dashboardData} errorElement={<DataError />}>
            {(data) => (
              <>
                {data.role === "admin" ? (
                  <AdminDashboard
                    data={data as AdminDashboardData}
                    user={user}
                    currentProgram={currentProgram}
                    onProgramChange={handleProgramChange}
                  />
                ) : (
                  <UserDashboard data={data as UserDashboardData} user={user} />
                )}
              </>
            )}
          </Await>
        </Suspense>
      </PageSection>
    </PageWrapper>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { direction: "up" | "down"; label: string };
  color: string;
}) {
  return (
    <Card className="rounded-md dark:bg-muted/30 hover:border-mainBlue/30 dark:hover:border-darkBlue/40 transition-[border-color,box-shadow] duration-300 animate-in fade-in slide-in-from-bottom-3">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div
            className={cn(
              "size-9 rounded-lg flex items-center justify-center",
              color,
            )}
          >
            <Icon size={18} className="text-white" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-3">
            {trend.direction === "up" ? (
              <RiArrowRightUpLine size={14} className="text-emerald-500" />
            ) : (
              <RiArrowRightDownLine size={14} className="text-rose-500" />
            )}
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UserDashboard({
  data,
  user,
}: {
  data: UserDashboardData;
  user: UserData;
}) {
  const { summary, scoreTrend, stageBreakdown, announcements, scoreboard } =
    data;

  const latestScore =
    scoreTrend.length > 0 ? scoreTrend[scoreTrend.length - 1] : null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tasks Completed"
          value={`${summary.tasksCompleted}/${summary.totalTasks}`}
          icon={RiCheckboxCircleLine}
          color="bg-emerald-500"
          trend={
            summary.totalTasks > 0
              ? {
                  direction: summary.tasksCompleted > 0 ? "up" : "down",
                  label: `${Math.round((summary.tasksCompleted / summary.totalTasks) * 100)}% completion`,
                }
              : undefined
          }
        />
        <StatCard
          label="Average Score"
          value={`${summary.averageScore}%`}
          icon={RiBarChartBoxLine}
          color="bg-blue-500"
          trend={
            summary.averageScore >= 70
              ? { direction: "up", label: "Above pass mark" }
              : summary.averageScore > 0
                ? { direction: "down", label: "Below pass mark" }
                : undefined
          }
        />
        <StatCard
          label="On-Time Rate"
          value={`${summary.onTimeRate}%`}
          icon={RiTimeLine}
          color="bg-amber-500"
          trend={
            summary.onTimeRate >= 80
              ? { direction: "up", label: "Great consistency" }
              : summary.onTimeRate > 0
                ? { direction: "down", label: "Room for improvement" }
                : undefined
          }
        />
        <StatCard
          label="Stage Progress"
          value={`${summary.stageProgress}%`}
          icon={RiStarLine}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-md dark:bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Stage Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stageBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No stages available yet. Check back once your program starts.
                </p>
              ) : (
                <div className="space-y-4">
                  {stageBreakdown.map((stage, i) => (
                    <div
                      key={stage.stageId}
                      className="animate-in fade-in slide-in-from-bottom-3"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              "size-2 rounded-full shrink-0",
                              stage.passed
                                ? "bg-emerald-500"
                                : stage.status === "active"
                                  ? "bg-amber-400"
                                  : "bg-muted-foreground/30",
                            )}
                          />
                          <span className="text-sm font-medium truncate">
                            Stage {stage.order}: {stage.stageTitle}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-xs font-semibold shrink-0 ml-2",
                            stage.passed
                              ? "text-emerald-600 dark:text-emerald-400"
                              : stage.status === "active"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-muted-foreground",
                          )}
                        >
                          {stage.percentage > 0
                            ? `${stage.percentage}%`
                            : "---"}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-[width] duration-500",
                            stage.passed
                              ? "bg-emerald-500"
                              : stage.status === "active"
                                ? "bg-amber-400"
                                : "bg-muted-foreground/20",
                          )}
                          style={{ width: `${stage.percentage || 0}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {stage.status}
                        </span>
                        {stage.maxScore > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {stage.score}/{stage.maxScore} pts &middot;
                            Passmark: {stage.passPercentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {latestScore && (
            <Card className="rounded-md dark:bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Latest Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "size-14 rounded-xl flex items-center justify-center text-lg font-bold text-white",
                      latestScore.percentage >= 70
                        ? "bg-emerald-500"
                        : "bg-rose-500",
                    )}
                  >
                    {latestScore.percentage}%
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {latestScore.taskTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {latestScore.score}/{latestScore.maxScore} pts &middot;{" "}
                      {latestScore.date}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="rounded-md dark:bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Recent Announcements
              </CardTitle>
              <Link
                to="/announcements"
                className="text-xs text-mainBlue dark:text-darkBlue hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No announcements yet.
                </p>
              ) : (
                announcements.map((a) => (
                  <AnnouncementPreview key={a._id} announcement={a} />
                ))
              )}
            </CardContent>
          </Card>

          {data.calendar && data.calendar.events.length > 0 && (
            <Card className="rounded-md dark:bg-muted/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Upcoming
                </CardTitle>
                <Link
                  to="/calendar"
                  className="text-xs text-mainBlue dark:text-darkBlue hover:underline"
                >
                  Calendar
                </Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.calendar.events
                  .filter((e) => e.date || e.startDate)
                  .slice(0, 4)
                  .map((event, i) => {
                    const date = event.date || event.startDate || "";
                    return (
                      <div
                        key={event._id}
                        className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <div
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: event.color || "#6366f1" }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">
                            {event.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(date).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {scoreboard.length > 0 && (
        <ScoreboardSection
          scoreboard={scoreboard}
          currentUserId={user._id}
          role="user"
        />
      )}
    </div>
  );
}

function AdminDashboard({
  data,
  user,
  currentProgram,
  onProgramChange,
}: {
  data: AdminDashboardData;
  user: UserData;
  currentProgram: string;
  onProgramChange: (value: string | null) => void;
}) {
  const {
    summary,
    scoreboard,
    tickets,
    auditLogs,
    announcements,
    isSuperAdmin,
    programs,
  } = data;

  return (
    <div className="space-y-8">
      {isSuperAdmin && programs.length > 0 && (
        <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-md border border-border/80 w-fit">
          <RiFilter3Line size={16} className="text-muted-foreground" />
          <Select value={currentProgram} onValueChange={onProgramChange}>
            <SelectTrigger className="rounded-sm border-none bg-transparent h-fit p-0 focus:ring-0 shadow-none text-xs font-bold uppercase tracking-widest min-w-32">
              <SelectValue placeholder="All Programs" />
            </SelectTrigger>
            <SelectContent className="rounded-sm">
              <SelectItem value="" className="text-xs">
                All Programs
              </SelectItem>
              {programs.map((p) => (
                <SelectItem key={p} value={p} className="text-xs">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={summary.totalUsers}
          icon={RiGroupLine}
          color="bg-blue-500"
          trend={{
            direction: summary.activeUsers > 0 ? "up" : "down",
            label: `${summary.activeUsers} active`,
          }}
        />
        <StatCard
          label="Submissions Pending"
          value={summary.pendingCount}
          icon={RiTimeLine}
          color="bg-amber-500"
          trend={
            summary.pendingCount > 0
              ? { direction: "down", label: "Needs attention" }
              : { direction: "up", label: "All caught up" }
          }
        />
        <StatCard
          label="Average Score"
          value={`${summary.averageScore}%`}
          icon={RiBarChartBoxLine}
          color="bg-emerald-500"
        />
        <StatCard
          label="On-Time Rate"
          value={`${summary.onTimeRate}%`}
          icon={RiCalendarCheckLine}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-md dark:bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Tickets Overview
              </CardTitle>
              <Link
                to="/tickets"
                className="text-xs text-mainBlue dark:text-darkBlue hover:underline"
              >
                Manage
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { label: "Open", value: tickets.open, color: "bg-rose-500" },
                  {
                    label: "In Progress",
                    value: tickets.inProgress,
                    color: "bg-amber-500",
                  },
                  {
                    label: "Resolved",
                    value: tickets.resolved,
                    color: "bg-emerald-500",
                  },
                ].map((t) => (
                  <div key={t.label} className="text-center">
                    <p className="text-2xl font-bold">{t.value}</p>
                    <p className="text-xs text-muted-foreground">{t.label}</p>
                  </div>
                ))}
              </div>
              <div className="w-full h-2 rounded-full bg-muted flex overflow-hidden">
                {tickets.open + tickets.inProgress + tickets.resolved > 0 && (
                  <>
                    <div
                      className="bg-rose-500 h-full transition-[width]"
                      style={{
                        width: `${(tickets.open / (tickets.open + tickets.inProgress + tickets.resolved)) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-amber-500 h-full transition-[width]"
                      style={{
                        width: `${(tickets.inProgress / (tickets.open + tickets.inProgress + tickets.resolved)) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-emerald-500 h-full transition-[width]"
                      style={{
                        width: `${(tickets.resolved / (tickets.open + tickets.inProgress + tickets.resolved)) * 100}%`,
                      }}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {auditLogs.length > 0 && (
            <Card className="rounded-md dark:bg-muted/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Recent Activity
                </CardTitle>
                <Link
                  to="/audit-logs"
                  className="text-xs text-mainBlue dark:text-darkBlue hover:underline"
                >
                  View all
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {auditLogs.map((log, i) => (
                  <div
                    key={log._id}
                    className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div
                      className={cn(
                        "size-2 rounded-full shrink-0",
                        log.status === "success"
                          ? "bg-emerald-500"
                          : log.status === "failure"
                            ? "bg-rose-500"
                            : "bg-amber-500",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">
                        {log.action}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {log.userName} &middot;{" "}
                        {new Date(log.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="rounded-md dark:bg-muted/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Recent Announcements
              </CardTitle>
              <Link
                to="/announcements"
                className="text-xs text-mainBlue dark:text-darkBlue hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No announcements yet.
                </p>
              ) : (
                announcements.map((a) => (
                  <AnnouncementPreview key={a._id} announcement={a} />
                ))
              )}
            </CardContent>
          </Card>

          {data.topUsers.length > 0 && (
            <Card className="rounded-md dark:bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.topUsers.slice(0, 5).map((u, i) => (
                  <div
                    key={u.userId}
                    className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <span className="text-xs font-bold text-muted-foreground w-4">
                      {i + 1}
                    </span>
                    <Avatar size="sm" className="size-6">
                      <AvatarFallback className="text-[9px]">
                        {u.userName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">
                        {u.userName}
                      </p>
                    </div>
                    <span className="text-xs font-semibold">
                      {u.averageScore}%
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {scoreboard.length > 0 && (
        <ScoreboardSection
          scoreboard={scoreboard}
          currentUserId={user._id}
          role="admin"
        />
      )}
    </div>
  );
}

function AnnouncementPreview({
  announcement,
}: {
  announcement: AnnouncementData;
}) {
  const priorityColor = (p: string) => {
    switch (p) {
      case "urgent":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
      case "high":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
      case "low":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3">
      <div className="flex items-center gap-2 mb-0.5">
        <span
          className={cn(
            "text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm",
            priorityColor(announcement.priority),
          )}
        >
          {announcement.priority}
        </span>
        {announcement.pinned && (
          <span className="text-[9px] font-semibold text-blue-500">Pinned</span>
        )}
      </div>
      <p className="text-sm font-medium truncate">{announcement.title}</p>
      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
        {announcement.content.slice(0, 100)}
      </p>
      <p className="text-[10px] text-muted-foreground mt-1">
        {announcement.createdBy.name} &middot;{" "}
        {(() => {
          const diff = Date.now() - new Date(announcement.createdAt).getTime();
          const mins = Math.floor(diff / 60000);
          if (mins < 1) return "just now";
          if (mins < 60) return `${mins}m ago`;
          const hours = Math.floor(mins / 60);
          if (hours < 24) return `${hours}h ago`;
          const days = Math.floor(hours / 24);
          if (days < 7) return `${days}d ago`;
          return new Date(announcement.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          });
        })()}
      </p>
    </div>
  );
}

function ScoreboardSection({
  scoreboard,
  currentUserId,
  role,
}: {
  scoreboard: ScoreBoardEntry[];
  currentUserId: string;
  role: "user" | "admin";
}) {
  const topUsers = useMemo(() => {
    const allUsers = scoreboard.flatMap((entry) =>
      entry.users.map((u) => ({ ...u, cohortName: entry.cohort.name })),
    );
    return allUsers
      .filter((u) => u.average > 0)
      .sort((a, b) => b.average - a.average)
      .slice(0, 8);
  }, [scoreboard]);

  if (topUsers.length === 0) return null;

  return (
    <Card className="rounded-md dark:bg-muted/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Scoreboard</CardTitle>
        <Link
          to="/projects/records"
          className="text-xs text-mainBlue dark:text-darkBlue hover:underline"
        >
          Full rankings
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {topUsers.map((u, i) => {
            const avg = u.average;
            const isMe = u.user._id === currentUserId;
            return (
              <div
                key={u.user._id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-md transition-colors",
                  isMe
                    ? "bg-mainBlue/5 dark:bg-darkBlue/10 ring-1 ring-mainBlue/20 dark:ring-darkBlue/30"
                    : "hover:bg-muted/50",
                )}
              >
                <span
                  className={cn(
                    "text-xs font-bold w-5 text-center",
                    i === 0
                      ? "text-amber-500"
                      : i === 1
                        ? "text-slate-400"
                        : i === 2
                          ? "text-amber-700"
                          : "text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <Avatar size="sm" className="size-7">
                  <AvatarFallback className="text-[10px]">
                    {u.user.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {u.user.name}
                    {isMe && (
                      <span className="text-[10px] text-muted-foreground ml-1">
                        (you)
                      </span>
                    )}
                  </p>
                  {role === "admin" && (
                    <p className="text-[10px] text-muted-foreground">
                      {u.cohortName || ""}
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold tabular-nums">
                  {avg > 0 ? `${Math.round(avg)}%` : "---"}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
