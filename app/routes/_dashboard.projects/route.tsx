import { dehydrate, useQuery } from "@tanstack/react-query";
import { NavLink, Outlet, useLocation, useOutletContext } from "react-router";
import {
  createProject,
  deleteProject,
  updateProject,
} from "~/.server/action/project";
import { PageSection, PageWrapper } from "~/components/provider/page-wrapper";
import { CanPermit } from "~/components/provider/rbac-permit";
import { ProjectListSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { cn } from "~/lib/utils";
import { requirePermission } from "~/middleware/auth.middleware";
import { projectsLayoutQueryOptions } from "~/queries/projects";
import type { UserData } from "~/types";
import type { Route } from "./+types/route";
import NewProject from "./new-project";
import ProjectList from "./project-list";
import { hasPermission } from "~/lib/rbac";

export const middleware = [requirePermission("MANAGE_COHORTS", "action")];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Projects | TSA InternHub" },
    {
      name: "description",
      content:
        "Manage your projects, track progress, and collaborate with your team.",
    },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  if (payload.intent === "create-project") {
    return await createProject(request, payload);
  }
  if (payload.intent === "update-project") {
    return await updateProject(request, payload);
  }
  if (payload.intent === "delete-project") {
    return await deleteProject(request, payload);
  }
}

export async function loader() {
  return { dehydratedState: undefined };
}

export async function clientLoader() {
  const queryClient = getQueryClientRsc();
  await queryClient.ensureQueryData(projectsLayoutQueryOptions());
  return {
    dehydratedState: dehydrate(queryClient),
  };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <ProjectListSkeleton />;
}

export default function ProjectRoute() {
  const { user } = useOutletContext() as { user: UserData };
  const location = useLocation();
  const currentPath = location.pathname === "/projects";
  const { data: layoutData, isPending, isError } = useQuery(
    projectsLayoutQueryOptions(),
  );
  const cohorts = layoutData?.cohorts;
  const currentProject = layoutData?.currentProject;

  return (
    <PageWrapper>
      <PageSection index={0} className="space-y-8 xl:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
              Projects
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage your projects, stages, track progress, and collaborate with
              your team
            </p>
          </div>
          <CanPermit user={user} permission="MANAGE_COHORTS">
            {cohorts && <NewProject cohorts={cohorts} />}
          </CanPermit>
        </div>
      </PageSection>
      <PageSection index={1} className="mt-8 space-y-8 xl:px-8">
        {["/projects", "/projects/all", "/projects/records"].includes(
          location.pathname,
        ) && (
          <div className="flex gap-6 md:gap-8 mb-8 border-b w-full">
            {["Projects", "All", "Records"].filter((s) => {
              if (["All","Records"].includes(s)) {
                return hasPermission(user.role, "MANAGE_COHORTS");
              }
              return true;
            }).map((s) => (
              <NavLink
                key={s}
                to={
                  s === "Projects"
                    ? "/projects"
                    : `/projects/${s.toLowerCase()}`
                }
                prefetch="intent"
                end
                className={({ isActive }) =>
                  cn(
                    "py-2 font-bold text-sm border-b-2 transition-colors duration-300 ease-in-out truncate",
                    isActive
                      ? "border-mainBlue dark:border-darkBlue text-mainBlue dark:text-darkBlue"
                      : "border-transparent text-muted-foreground hover:border-mainBlue/40 dark:hover:border-darkBlue/40",
                  )
                }
              >
                {s === "Projects" ? "Current" : s}
              </NavLink>
            ))}
          </div>
        )}
        {currentPath ? (
          <>
            <PageSection index={1} className="space-y-6">
              {isPending ? (
                <ProjectListSkeleton />
              ) : isError ? (
                <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                  Failed to load project. Please try again.
                </div>
              ) : (
                <ProjectList project={currentProject} user={user} />
              )}
            </PageSection>
          </>
        ) : (
          <Outlet context={{ user }} />
        )}
      </PageSection>
    </PageWrapper>
  );
}
