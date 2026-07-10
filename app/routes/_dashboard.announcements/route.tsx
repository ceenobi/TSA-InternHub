import {
  RiDeleteBinLine,
  RiEarthLine,
  RiFilter3Line,
  RiPushpinFill,
  RiPushpinLine,
  RiTeamLine,
  RiUserLine,
} from "@remixicon/react";
import { Suspense, useState } from "react";
import { Await, useOutletContext, useSearchParams } from "react-router";
import {
  createAnnouncement,
  deleteAnnouncement,
  togglePinAnnouncement,
} from "~/.server/action/announcement";
import { fetchCohorts } from "~/.server/action/cohort";
import { PageSection, PageWrapper } from "~/components/provider/page-wrapper";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import DataError from "~/components/ui/data-error";
import NotFound from "~/components/ui/not-found";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { AnnouncementSkeleton } from "~/components/ui/skeleton-ui";
import { getOptimizedImageUrl } from "~/lib/cloudinary";
import { hasPermission } from "~/lib/rbac";
import { cn } from "~/lib/utils";
import { getAnnouncementsQuery } from "~/queries/announcements.server";
import type {
  AnnouncementData,
  AnnouncementsQueryResult,
  UserData,
} from "~/types";
import type { Route } from "../_dashboard.announcements/+types/route";
import CreateAnnouncement from "./create-announcement";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Announcements | TSA InternHub" },
    {
      name: "description",
      content: "View app updates, news as it comes out",
    },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  const { intent, ...data } = payload;
  switch (intent) {
    case "create-announcement":
      return await createAnnouncement(request, data);
    case "delete-announcement":
      return await deleteAnnouncement(request, data);
    case "toggle-pin":
      return await togglePinAnnouncement(request, data);
    default:
      return Response.json(
        { success: false, message: "Invalid action" },
        { status: 400 },
      );
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const { getQueryClientRsc } = await import("~/lib/getQueryClient");
  const queryClient = getQueryClientRsc();
  const cohortsRes = await fetchCohorts({
    request,
    page: 1,
    limit: 100,
    query: undefined,
  });
  const cohortsData = cohortsRes.ok
    ? (await cohortsRes.json()).body?.cohorts
    : [];
  const announcements = queryClient.ensureQueryData(
    getAnnouncementsQuery(request),
  );
  return { announcements, cohorts: cohortsData };
}

export default function AnnouncementsRoute({
  loaderData,
}: Route.ComponentProps) {
  const { user } = useOutletContext() as { user: UserData };
  const { announcements: initialAnnouncements, cohorts } = loaderData;
  const isAdmin = hasPermission(user.role, "MANAGE_MEMBERS");
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPriority = searchParams.get("priority") || "all";
  const currentTarget = searchParams.get("target") || "all";

  const handleFilterChange = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (!value || value === "all") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const priorityOptions = [
    { label: "All Priorities", value: "all" },
    { label: "Low", value: "low" },
    { label: "Normal", value: "normal" },
    { label: "High", value: "high" },
    { label: "Urgent", value: "urgent" },
  ];

  const targetOptions = [
    { label: "All Audiences", value: "all" },
    { label: "Everyone", value: "all" },
    { label: "Cohort", value: "cohort" },
    { label: "Program", value: "program" },
  ];

  return (
    <PageWrapper>
      <PageSection index={0} className="space-y-12 xl:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
              Announcements
            </h1>
            <p className="text-muted-foreground text-sm">
              View app updates, news as it comes out
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && <CreateAnnouncement cohorts={cohorts} />}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-muted/30 px-3 rounded-sm border border-border/80">
              <RiFilter3Line size={16} className="text-muted-foreground" />
              <Select
                value={currentPriority}
                onValueChange={(val) => handleFilterChange("priority", val)}
              >
                <SelectTrigger className="rounded-sm border-none bg-transparent h-fit p-0 focus:ring-0 shadow-none text-xs font-bold uppercase tracking-widest min-w-24">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  {priorityOptions.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-xs"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 bg-muted/30 px-3 rounded-sm border border-border/80">
              <RiFilter3Line size={16} className="text-muted-foreground" />
              <Select
                value={currentTarget}
                onValueChange={(val) => handleFilterChange("target", val)}
              >
                <SelectTrigger className="rounded-sm border-none bg-transparent h-fit p-0 focus:ring-0 shadow-none text-xs font-bold uppercase tracking-widest min-w-24">
                  <SelectValue placeholder="Target" />
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  {targetOptions.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-xs"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Suspense fallback={<AnnouncementSkeleton />}>
            <Await resolve={initialAnnouncements} errorElement={<DataError />}>
              {(resolvedAnnouncements) => (
                <>
                  {resolvedAnnouncements.announcements.length === 0 ? (
                    <NotFound
                      title="No announcements"
                      message={
                        isAdmin
                          ? "No announcements yet. Create the first one!"
                          : "No announcements yet. Check back later."
                      }
                    />
                  ) : (
                    <Announcements
                      resolvedAnnouncements={resolvedAnnouncements}
                      user={user}
                      isAdmin={isAdmin}
                    />
                  )}
                </>
              )}
            </Await>
          </Suspense>
        </div>
      </PageSection>
    </PageWrapper>
  );
}

function Announcements({
  resolvedAnnouncements,
  user,
  isAdmin,
}: {
  resolvedAnnouncements: AnnouncementsQueryResult;
  user: UserData;
  isAdmin: boolean;
}) {
  const [page, setPage] = useState(1);
  const [allAnnouncements, setAllAnnouncements] = useState<AnnouncementData[]>(
    resolvedAnnouncements.announcements,
  );
  const [hasMore, setHasMore] = useState(resolvedAnnouncements.meta.hasMore);
  const loadMore = async () => {
    const nextPage = page + 1;
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(nextPage));
    const res = await fetch(url.toString());
    const json = await res.json();
    if (json.body) {
      setAllAnnouncements((prev) => [...prev, ...json.body.announcements]);
      setPage(nextPage);
      setHasMore(json.body.meta.hasMore);
    }
  };

  return (
    <>
      {allAnnouncements.map((a) => (
        <AnnouncementCard
          key={a._id}
          announcement={a}
          isAdmin={isAdmin}
          user={user}
        />
      ))}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            className="rounded-full px-8"
            onClick={loadMore}
          >
            Load More
          </Button>
        </div>
      )}
    </>
  );
}

function AnnouncementCard({
  announcement,
  isAdmin,
  user,
}: {
  announcement: AnnouncementData;
  isAdmin: boolean;
  user: UserData;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = announcement.content.length > 250;

  const priorityColor = (p: string) => {
    switch (p) {
      case "urgent":
        return "destructive";
      case "high":
        return "destructive";
      case "low":
        return "ghost";
      default:
        return "secondary";
    }
  };

  const targetLabel = () => {
    switch (announcement.target) {
      case "all":
        return { label: "Everyone", icon: RiEarthLine };
      case "program":
        return {
          label: announcement.targetProgram ?? "Program",
          icon: RiTeamLine,
        };
      case "cohort":
        return {
          label: announcement.targetCohort?.cohort ?? "Cohort",
          icon: RiUserLine,
        };
    }
  };
  const target = targetLabel();
  const TargetIcon = target.icon;

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <Card
      className={cn(
        "rounded-sm border-border/60 transition-all duration-200 dark:bg-muted/30",
        announcement.pinned && "border-blue-500/30 bg-blue-500/2",
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {announcement.pinned && (
              <RiPushpinFill
                size={14}
                className="shrink-0 text-blue-500 mt-0.5"
              />
            )}
            <span className="truncate">{announcement.title}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant={priorityColor(announcement.priority)}
              className="capitalize text-[10px] px-2 py-0.5"
            >
              {announcement.priority}
            </Badge>
            {isAdmin && (
              <div className="flex items-center gap-1">
                <button
                  onClick={async () => {
                    await fetch("/announcements", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        intent: "toggle-pin",
                        announcementId: announcement._id,
                      }),
                    });
                    window.location.reload();
                  }}
                  className="p-1 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  title={announcement.pinned ? "Unpin" : "Pin"}
                >
                  {announcement.pinned ? (
                    <RiPushpinFill size={14} className="text-blue-500" />
                  ) : (
                    <RiPushpinLine size={14} />
                  )}
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("Delete this announcement?")) return;
                    await fetch("/announcements", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        intent: "delete-announcement",
                        announcementId: announcement._id,
                      }),
                    });
                    window.location.reload();
                  }}
                  className="p-1 rounded-sm text-muted-foreground hover:bg-muted hover:text-destructive transition"
                  title="Delete"
                >
                  <RiDeleteBinLine size={14} />
                </button>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p
            className={cn(
              "text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap",
              !expanded && isLong && "line-clamp-3",
            )}
          >
            {announcement.content}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-1.5">
            <Avatar size="sm" className="size-5">
              <AvatarImage
                src={getOptimizedImageUrl(announcement.createdBy.image, 40)}
              />
              <AvatarFallback className="text-[8px]">
                {announcement.createdBy.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span>{announcement.createdBy.name}</span>
          </div>
          <span>&middot;</span>
          <span>{timeAgo(announcement.createdAt)}</span>
          <span>&middot;</span>
          <span className="flex items-center gap-1">
            <TargetIcon size={12} />
            {target.label}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
