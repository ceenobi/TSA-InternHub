import { RiLoaderLine, RiMoreLine, RiTeamLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import AlertBox from "~/components/provider/alert-box";
import { CanPermit } from "~/components/provider/rbac-permit";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import NotFound from "~/components/ui/not-found";
import Paginate from "~/components/ui/paginate";
import { Separator } from "~/components/ui/separator";
import usePaginate from "~/hooks/usePaginate";
import { cohortStatusColor } from "~/lib/constants";
import { hasPermission } from "~/lib/rbac";
import { formatDate } from "~/lib/utils";
import type { CohortDataType, UsePaginateProps, UserData } from "~/types";

export default function ListCohort({
  cohorts,
  meta,
  user,
}: {
  cohorts: CohortDataType[];
  meta: UsePaginateProps;
  user: UserData;
}) {
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const {
    handlePageChange,
    handleLimitChange,
    totalPages,
    hasMore,
    currentPage,
    limit: pageLimit,
  } = usePaginate({
    totalPages: meta?.totalPages || 1,
    hasMore: meta?.hasMore || false,
    currentPage: meta?.currentPage || 1,
  });
  const fetcher = useFetcher();
  const actionData = fetcher.data as
    | { success?: boolean; message?: string; body?: any }
    | undefined;

  useEffect(() => {
    if (actionData?.success) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setShowAlert(true);
    }
  }, [actionData]);

  const isLoading = fetcher.state === "submitting";

  const handleStatusChange = (status: string, id: string) => {
    fetcher.submit(
      {
        status,
        id,
        intent: "update-cohort",
      },
      {
        method: "post",
        action: "/settings/cohorts",
        encType: "application/json",
      },
    );
  };

  return (
    <>
      <div className="space-y-4">
        {cohorts.length === 0 ? (
          <NotFound
            title="No cohort found"
            message="Your cohort catalog is currently empty. Start by adding your first cohort."
          />
        ) : (
          <>
            {actionData !== undefined && showAlert && (
              <AlertBox
                title={actionData.success ? "Success" : "Error"}
                description={actionData.message || ""}
                variant={actionData?.success ? "success" : "error"}
                onClose={() => setShowAlert(false)}
              />
            )}
            <div className="grid grid-cols-1 md:grid-cols-3">
              {Array.isArray(cohorts) &&
                cohorts.map((cohort, index) => (
                  <div
                    style={{ animationDelay: `${index * 100}ms` }}
                    key={cohort._id}
                    className="group relative flex flex-col gap-4 p-3 rounded-md border border-border/60 bg-background hover:border-mainBlue/30 dark:hover:border-darkBlue/40 hover:shadow-sm dark:bg-muted/20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
                  >
                    <div className="flex justify-between items-center">
                      <Badge className={cohortStatusColor(cohort.status)}>
                        {cohort.status}
                      </Badge>
                      <CanPermit user={user} permission="MANAGE_COHORTS">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Manage cohort status"
                              >
                                <RiMoreLine size={20} />
                              </Button>
                            }
                          />
                          <DropdownMenuContent className="rounded-sm">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>
                                Update status
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuCheckboxItem
                                checked={cohort.status === "active"}
                                onClick={() =>
                                  handleStatusChange("active", cohort._id)
                                }
                                className="cursor-pointer"
                              >
                                {isLoading && cohort.status === "active" && (
                                  <RiLoaderLine className="animate-spin" />
                                )}{" "}
                                Active
                              </DropdownMenuCheckboxItem>
                              <DropdownMenuCheckboxItem
                                checked={cohort.status === "inactive"}
                                onClick={() =>
                                  handleStatusChange("inactive", cohort._id)
                                }
                                className="cursor-pointer"
                              >
                                {isLoading && cohort.status === "inactive" && (
                                  <RiLoaderLine className="animate-spin" />
                                )}{" "}
                                Inactive
                              </DropdownMenuCheckboxItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CanPermit>
                    </div>
                    <div
                      className="flex gap-2 items-center animate-in fade-in slide-in-from-bottom-4 duration-500"
                      style={{ animationDelay: `${index * 100}ms` }}
                      title={`Update Cohort: ${cohort.cohort}`}
                    >
                      <RiTeamLine size={20} />
                      <h1 className="dark:text-white">{cohort.cohort}</h1>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center">
                      <p className="text-sm dark:text-white">
                        {cohort.members.length || 0}{" "}
                        <span className="text-xs text-gray-500">members</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Created{" "}
                        <span className="text-mainBlue dark:text-white">
                          {formatDate(cohort.createdAt)}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
        {hasPermission(user.role, "MANAGE_COHORTS") && cohorts.length > 0 && (
          <Paginate
            totalPages={totalPages}
            hasMore={hasMore}
            handlePageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            currentPage={currentPage}
            limit={pageLimit}
          />
        )}
      </div>
    </>
  );
}
