import { RiHistoryLine } from "@remixicon/react";
import { dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";
import { Await, useOutletContext } from "react-router";
import { CanPermit } from "~/components/provider/rbac-permit";
import AccessDenied from "~/components/ui/access-denied";
import DataError from "~/components/ui/data-error";
import { AuditLogsSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { requirePermission } from "~/middleware/auth.middleware";
import { getAllAuditLogsQuery } from "~/queries/auditlogs.server";
import type { UserData } from "~/types";
import type { Route } from "../_dashboard.audit-logs.general/+types/route";
import { AuditLogList } from "../_dashboard.audit-logs/audit-log-list";

export const middleware = [requirePermission("MANAGE_ROLES")];

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
  const logs = queryClient.ensureQueryData(getAllAuditLogsQuery(request));
  return {
    dehydratedState: dehydrate(queryClient),
    logs,
  };
}

export default function AuditLogsGeneral({ loaderData }: Route.ComponentProps) {
  const { logs: logsPromise } = loaderData;
  const { user } = useOutletContext() as { user: UserData };
  return (
    <>
      <CanPermit
        user={user}
        permission="MANAGE_ROLES"
        fallback={<AccessDenied />}
      >
        <Suspense fallback={<AuditLogsSkeleton />}>
          <Await resolve={logsPromise} errorElement={<DataError />}>
            {(resolvedLogs) => (
              <div className="space-y-6">
                <AuditLogList
                  logs={resolvedLogs.logs}
                  meta={resolvedLogs.meta}
                />
                {resolvedLogs?.logs.length === 0 && (
                  <div className="py-24 flex flex-col items-center justify-center border border-dashed border-border rounded-md bg-muted/10">
                    <RiHistoryLine
                      size={48}
                      className="text-muted-foreground mb-4 opacity-20"
                    />
                    <h3 className="font-bold text-lg">No Activity Logged</h3>
                    <p className="text-muted-foreground text-xs mt-1">
                      Significant actions will appear here as you manage your
                      account.
                    </p>
                  </div>
                )}
              </div>
            )}
          </Await>
        </Suspense>
      </CanPermit>
    </>
  );
}
