import {
  RiArchiveStackLine,
  RiKey2Line,
  RiLoader2Line,
  RiQuestionLine,
  RiShieldLine,
  RiTaskLine,
} from "@remixicon/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useFetcher } from "react-router";
import { toast } from "sonner";
import AlertBox from "~/components/provider/alert-box";
import { Card, CardContent } from "~/components/ui/card";
import { FormSelect } from "~/components/ui/form-select";
import Modal from "~/components/ui/modal";
import NotFound from "~/components/ui/not-found";
import Paginate from "~/components/ui/paginate";
import { Separator } from "~/components/ui/separator";
import { useIsMobile } from "~/hooks/useMobile";
import usePaginate from "~/hooks/usePaginate";
import { getTicketStatusColor, getTicketStatusIcon } from "~/lib/constants";
import { hasPermission } from "~/lib/rbac";
import { formatDate } from "~/lib/utils";
import type { TicketData, UsePaginateProps, UserData } from "~/types";
import RenderTable from "./render-table";

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case "auth":
      return <RiKey2Line className="h-4 w-4 text-blue-600" />;
    case "task":
      return <RiTaskLine className="h-4 w-4 text-green-600" />;
    case "security":
      return <RiShieldLine className="h-4 w-4 text-purple-600" />;
    case "other":
      return <RiArchiveStackLine className="h-4 w-4 text-orange-600" />;
    default:
      return <RiQuestionLine className="h-4 w-4 text-gray-600" />;
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "low":
      return "bg-green-100 text-green-700";
    case "medium":
      return "bg-yellow-100 text-yellow-700";
    case "high":
      return "bg-orange-100 text-orange-700";
    case "critical":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const StatusIcon = ({ status }: { status: string | undefined }) => {
  const Icon = getTicketStatusIcon(status || "open");
  return <Icon className="h-4 w-4" />;
};

const ticketStatusOptions = [
  { id: "open", name: "Open" },
  { id: "in-progress", name: "In Progress" },
  { id: "resolved", name: "Resolved" },
  { id: "closed", name: "Closed" },
];

export default function TicketCard({
  tickets,
  meta,
  user,
  coordinators,
}: {
  tickets: TicketData[];
  meta: UsePaginateProps;
  user: UserData;
  coordinators: Partial<UserData>[];
}) {
  const isMobile = useIsMobile({ MOBILE_BREAKPOINT: 820 });
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
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
  const getMembers = useMemo(() => {
    if (!Array.isArray(coordinators)) return [];
    return coordinators.map((member: any) => ({
      name: member?.name,
      id: member?._id,
    }));
  }, [coordinators]);

  const isSubmitting = fetcher.state !== "idle";

  const actionData = fetcher.data as
    | { success?: boolean; message?: string }
    | undefined;

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Ticket created successfully");
      setSelectedTicket(null);
    }
  }, [actionData]);

  useEffect(() => {
    if (selectedTicket) {
      fetcher.data = undefined;
    }
  }, [selectedTicket]);

  const isPermitted = hasPermission(user.role, "MANAGE_ROLES");

  const handleAssignedToChange = (value: string | null, id: string) => {
    fetcher.submit(
      {
        assignedTo: value,
        id,
        intent: "assign-ticket",
      },
      {
        method: "post",
        action: `/help-center`,
        encType: "application/json",
      },
    );
  };

  const handleStatusChange = (status: string, id: string) => {
    fetcher.submit(
      {
        status,
        id,
        intent: "update-ticketStatus",
      },
      {
        method: "post",
        action: `/help-center`,
        encType: "application/json",
      },
    );
  };

  return (
    <>
      {tickets.length === 0 ? (
        <NotFound
          title="No tickets found"
          message="You have no ticket issues. All tickets resolved"
        />
      ) : (
        <>
          {isMobile ? (
            <div className="grid grid-cols-1 gap-4">
              {tickets.map((ticket, index: number) => (
                <Card
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="rounded-sm border bg-card dark:bg-muted/30 hover:border-mainBlue/30 dark:hover:border-darkBlue/40 hover:shadow-sm transition-[border-color,box-shadow] animate-in fade-in slide-in-from-bottom-4 duration-300 cursor-pointer"
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Category icon circle */}
                      <div className="size-9 rounded-full flex items-center justify-center bg-muted dark:bg-muted/50 shrink-0 mt-0.5">
                        {getCategoryIcon(ticket.category)}
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-foreground truncate">
                              {ticket.title}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {ticket.ticketId}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`${getTicketStatusColor(ticket.status)} text-xs px-2 py-0.5 rounded-sm font-medium inline-flex items-center gap-1`}
                            >
                              <StatusIcon status={ticket.status || "open"} />
                              <span className="capitalize">
                                {ticket.status}
                              </span>
                            </span>
                            <span
                              className={`${getPriorityColor(ticket.priority)} text-[10px] px-1.5 py-0.5 rounded-sm font-semibold`}
                            >
                              {ticket.priority.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {ticket.description}
                        </p>

                        {/* Footer */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                          <span>
                            Created{" "}
                            {formatDate(ticket.createdAt as unknown as string)}
                          </span>
                          <div className="flex items-center gap-3">
                            <Link
                              to={`/members?query=${ticket?.userId?.name}`}
                              className="hover:text-mainBlue dark:hover:text-darkBlue transition-colors"
                            >
                              {ticket?.userId?.name}
                            </Link>
                            {ticket?.assignedTo && (
                              <span>
                                Assigned to{" "}
                                <Link
                                  to={`/members?query=${ticket?.assignedTo?.name}`}
                                  className="hover:text-mainBlue dark:hover:text-darkBlue transition-colors"
                                >
                                  {ticket?.assignedTo?.name}
                                </Link>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <RenderTable tickets={tickets} onRowClick={setSelectedTicket} />
          )}
          <Paginate
            totalPages={totalPages}
            hasMore={hasMore}
            handlePageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            currentPage={currentPage}
            limit={pageLimit}
          />
        </>
      )}
      <Modal
        title={selectedTicket?.title}
        isOpen={!!selectedTicket}
        setIsOpen={(open) => {
          if (!open) setSelectedTicket(null);
        }}
        classname="sm:max-w-xl"
      >
        {selectedTicket && (
          <div className="space-y-5">
            {actionData !== undefined && actionData?.success === false && (
              <AlertBox
                title="Error"
                description={
                  actionData.message || "Error performing ticket action"
                }
                variant="error"
                onClose={() => fetcher.reset()}
              />
            )}
            {/* Status & Priority */}
            <div className="flex items-center gap-2">
              <span
                className={`${getTicketStatusColor(selectedTicket.status)} text-xs px-2 py-0.5 rounded-sm font-medium inline-flex items-center gap-1`}
              >
                <span className="capitalize">{selectedTicket.status}</span>
              </span>
              <span
                className={`${getPriorityColor(selectedTicket.priority)} text-[10px] px-1.5 py-0.5 rounded-sm font-semibold`}
              >
                {selectedTicket.priority.toUpperCase()}
              </span>
            </div>

            {/* Description */}
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedTicket.description}
              </p>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Ticket ID
                </p>
                <p className="text-sm font-mono text-foreground mt-0.5">
                  {selectedTicket.ticketId}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Category
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {getCategoryIcon(selectedTicket.category)}
                  <span className="text-sm capitalize text-foreground">
                    {selectedTicket.category}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Created By
                </p>
                <p className="text-sm text-foreground mt-0.5">
                  {selectedTicket.userId?.name || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Assigned To
                </p>
                <p className="text-sm text-foreground mt-0.5">
                  {selectedTicket.assignedTo?.name || "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Created
                </p>
                <p className="text-sm text-foreground mt-0.5">
                  {formatDate(selectedTicket.createdAt as unknown as string)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Updated
                </p>
                <p className="text-sm text-foreground mt-0.5">
                  {formatDate(selectedTicket.updatedAt as unknown as string)}
                </p>
              </div>
            </div>
            {isPermitted && (
              <>
                <Separator />
                {isSubmitting && (
                  <div className="flex gap-2 items-center">
                    <RiLoader2Line className="animate-spin" size={18} />
                    <p className="text-xs">please wait</p>
                  </div>
                )}
                <div className="space-y-4">
                  <label className="text-sm">Assign ticket to an Admin</label>
                  <FormSelect
                    options={getMembers}
                    value={selectedTicket.assignedTo?._id}
                    onValueChange={(value: string | null) => {
                      setSelectedTicket((prev) =>
                        prev
                          ? {
                              ...prev,
                              assignedTo: {
                                ...(prev.assignedTo ||
                                  ({ _id: "", name: "" } as any)),
                                _id: value || "",
                              },
                            }
                          : prev,
                      );
                      handleAssignedToChange(value, selectedTicket._id);
                    }}
                    placeholder={
                      selectedTicket.assignedTo?.name
                        ? "Reassign"
                        : "Assign issue"
                    }
                    className="mt-1"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-sm">Update Ticket Status</label>
                  <FormSelect
                    options={ticketStatusOptions}
                    value={selectedTicket.status}
                    onValueChange={(value: string | null) => {
                      const newStatus = (value || "open") as
                        | "open"
                        | "in-progress"
                        | "resolved"
                        | "closed";
                      setSelectedTicket((prev) =>
                        prev ? { ...prev, status: newStatus } : prev,
                      );
                      handleStatusChange(newStatus, selectedTicket._id);
                    }}
                    placeholder="Update status"
                    className="mt-1"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
