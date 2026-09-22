import { RiFilter3Line } from "@remixicon/react";
import { dehydrate, useQuery } from "@tanstack/react-query";
import { useOutletContext, useSearchParams } from "react-router";
import Search from "~/components/nav/search";
import { PageSection } from "~/components/provider/page-wrapper";
import { CanPermit } from "~/components/provider/rbac-permit";
import AccessDenied from "~/components/ui/access-denied";
import DataError from "~/components/ui/data-error";
import NotFound from "~/components/ui/not-found";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { ProjectListSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { requirePermission } from "~/middleware/auth.middleware";
import { projectsQueryOptions } from "~/queries/projects";
import type { UserData } from "~/types";
import ProjectList from "../_dashboard.projects/project-list";
import type { Route } from "./+types/route";
import Paginated from "./paginated";
export const middleware = [requirePermission("MANAGE_COHORTS")];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Cohort Projects | TSA InternHub" },
    {
      name: "description",
      content: "Manage your cohort projects.",
    },
  ];
}

export async function loader() {
  return { dehydratedState: undefined };
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const queryClient = getQueryClientRsc();
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 20;
  const query = url.searchParams.get("query") || undefined;
  const status = url.searchParams.get("status") || undefined;
  await queryClient.ensureQueryData(
    projectsQueryOptions({ page, limit, query, status }),
  );
  return {
    dehydratedState: dehydrate(queryClient),
  };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <ProjectListSkeleton />;
}

export default function AllProjectsRoute() {
  const { user } = useOutletContext() as { user: UserData };
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get("status") || "all";
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const query = searchParams.get("query") || undefined;
  const status = searchParams.get("status") || undefined;
  const {
    data: resolvedProjects,
    isPending,
    isError,
  } = useQuery(projectsQueryOptions({ page, limit, query, status }));

  const handleStatusChange = (value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (!value || value === "all") {
      newParams.delete("status");
    } else {
      newParams.set("status", value);
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const statusOptions = [
    { label: "All", value: "all" },
    { label: "Upcoming", value: "upcoming" },
    { label: "Active", value: "active" },
    { label: "Completed", value: "completed" },
    { label: "On Hold", value: "on-hold" },
  ];

  return (
    <CanPermit
      user={user}
      permission="MANAGE_COHORTS"
      fallback={<AccessDenied />}
    >
      <PageSection index={1} className="space-y-8">
        <div className="flex gap-4 items-center">
          <Search id="project-search" placeholder="Search project name" />
          <div className="flex items-center gap-2 bg-muted/30 px-3 rounded-md border border-border/80">
            <RiFilter3Line size={16} className="text-muted-foreground" />
            <Select
              value={currentStatus}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="rounded-sm border bg-transparent h-fit p-0 focus:ring-0 shadow-none text-xs font-bold uppercase tracking-widest min-w-28">
                <SelectValue placeholder="Filter Category" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                {statusOptions.map((cat) => (
                  <SelectItem
                    key={cat.value}
                    value={cat.value}
                    className="text-xs"
                  >
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {isPending ? (
          <ProjectListSkeleton />
        ) : isError || !resolvedProjects ? (
          <DataError />
        ) : resolvedProjects.projects.length === 0 ? (
          <NotFound
            title="No projects found"
            message="Your project is currently empty. Come back later to see your project."
          />
        ) : (
          <>
            {resolvedProjects.projects.map((project) => (
              <ProjectList
                key={project._id}
                project={project}
                user={user}
              />
            ))}
            <Paginated meta={resolvedProjects.meta} />
          </>
        )}
      </PageSection>
    </CanPermit>
  );
}
