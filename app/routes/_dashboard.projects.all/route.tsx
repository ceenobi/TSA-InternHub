import { RiFilter3Line } from "@remixicon/react";
import { dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";
import { Await, useOutletContext, useSearchParams } from "react-router";
import Search from "~/components/nav/search";
import { PageSection } from "~/components/provider/page-wrapper";
import { CanPermit } from "~/components/provider/rbac-permit";
import AccessDenied from "~/components/ui/access-denied";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
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
import { getProjectsQuery } from "~/queries/projects.server";
import type { UserData } from "~/types";
import type { Route } from "./+types/route";
import ProjectList from "../_dashboard.projects/project-list";
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

export async function loader({ request }: Route.LoaderArgs) {
  const queryClient = getQueryClientRsc();
  const projects = queryClient.ensureQueryData(getProjectsQuery(request));
  return {
    dehydratedState: dehydrate(queryClient),
    projects,
  };
}

export default function AllProjectsRoute({ loaderData }: Route.ComponentProps) {
  const { projects } = loaderData;
  const { user } = useOutletContext() as { user: UserData };
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get("status") || "all";

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
        <Card className="rounded-md dark:bg-muted/30">
          <CardHeader>
            <CardTitle className="flex flex-col md:flex-row justify-between md:items-center gap-4 md:gap-0">
              <div>
                <span>All Projects</span>
                <p className="text-sm text-muted-foreground">
                  Click on a cohort to view its members
                </p>
              </div>
              <div className="flex gap-4 items-center">
                <Search id="project-search" placeholder="Search project name" />
                <div className="flex items-center gap-2 bg-muted/30 px-3 rounded-md border border-border/80">
                  <RiFilter3Line size={16} className="text-muted-foreground" />
                  <Select
                    value={currentStatus}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="rounded-sm border-none bg-transparent h-fit p-0 focus:ring-0 shadow-none text-xs font-bold uppercase tracking-widest min-w-28">
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
            </CardTitle>
          </CardHeader>
        </Card>
        <Suspense fallback={<ProjectListSkeleton />}>
          <Await resolve={projects} errorElement={<DataError />}>
            {(resolvedProjects) => (
              <>
                {resolvedProjects?.projects.length === 0 ? (
                  <NotFound
                    title="No projects found"
                    message="Your project is currently empty. Come back later to see your project."
                  />
                ) : (
                  <>
                    {resolvedProjects?.projects?.map((project) => (
                      <ProjectList
                        key={project._id}
                        project={project}
                        user={user}
                      />
                    ))}
                    <Paginated meta={resolvedProjects.meta} />
                  </>
                )}
              </>
            )}
          </Await>
        </Suspense>
      </PageSection>
    </CanPermit>
  );
}
