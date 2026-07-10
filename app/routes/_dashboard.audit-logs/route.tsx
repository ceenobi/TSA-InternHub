import { dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";
import {
    Await,
    Outlet,
    useLocation,
    useNavigate,
    useOutletContext,
} from "react-router";
import { PageSection, PageWrapper } from "~/components/provider/page-wrapper";
import DataError from "~/components/ui/data-error";
import NotFound from "~/components/ui/not-found";
import { AuditLogsSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { hasPermission } from "~/lib/rbac";
import { cn } from "~/lib/utils";
import { getUserAuditLogsQuery } from "~/queries/auditlogs.server";
import type { UserData } from "~/types";
import type { Route } from "../_dashboard.audit-logs/+types/route";
import { AuditLogList } from "./audit-log-list";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Audit Logs — TSA InternHub" },
    {
      name: "description",
      content: "Track administrative activity and security events.",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const queryClient = getQueryClientRsc();
  const logs = queryClient.ensureQueryData(getUserAuditLogsQuery(request));
  return {
    dehydratedState: dehydrate(queryClient),
    logs,
  };
}

export default function AuditLogsRoute({ loaderData }: Route.ComponentProps) {
  const { logs: logsPromise } = loaderData;
  const { user } = useOutletContext() as { user: UserData };
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname === "/audit-logs";

  return (
    <PageWrapper>
      <PageSection index={0} className="space-y-8 xl:px-8">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
              Audit Logs
            </h1>
            <p className="text-muted-foreground text-sm">
              Audit logs for security and compliance teams to monitor
              information access.
            </p>
          </div>
        </div>
        <div className="flex gap-4 md:gap-8 mb-8 border-b w-full">
          {["audit-logs", "General"]
            .filter((s) => {
              if (["General"].includes(s)) {
                return hasPermission(user.role, "MANAGE_ROLES");
              }
              return true;
            })
            .map((s, i) => (
              <button
                key={s}
                onClick={
                  ["General"].includes(s)
                    ? () => {
                        navigate(`/audit-logs/${s.toLowerCase()}`);
                      }
                    : () => {
                        navigate(`/audit-logs`);
                      }
                }
                className={cn(
                  "py-2 font-bold text-sm border-b-2 transition-colors duration-300 ease-in-out truncate",
                  location.pathname === `/audit-logs/${s.toLowerCase()}` ||
                    (location.pathname === "/audit-logs" &&
                      s === "audit-logs" &&
                      i === 0)
                    ? "border-mainBlue dark:border-darkBlue text-mainBlue dark:text-darkBlue"
                    : "border-transparent text-muted-foreground hover:border-mainBlue/40 dark:hover:border-darkBlue/40",
                )}
              >
                {s === "audit-logs" ? "Audit Logs" : s}
              </button>
            ))}
        </div>
        {currentPath ? (
          <Suspense fallback={<AuditLogsSkeleton />}>
            <Await resolve={logsPromise} errorElement={<DataError />}>
              {(resolvedLogs) => (
                <div className="space-y-6">
                  {resolvedLogs?.logs.length === 0 ? (
                    <NotFound
                      title="No Activity Logged"
                      message="Significant actions will appear here as you manage your
                    account."
                    />
                  ) : (
                    <AuditLogList
                      logs={resolvedLogs.logs}
                      meta={resolvedLogs.meta}
                    />
                  )}
                </div>
              )}
            </Await>
          </Suspense>
        ) : (
          <Outlet context={{ user }} />
        )}
      </PageSection>
    </PageWrapper>
  );
}
