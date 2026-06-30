import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import TableView from "~/components/ui/table-view";
import { getTicketStatusColor, getTicketStatusIcon } from "~/lib/constants";
import { formatDate } from "~/lib/utils";
import type { TicketData } from "~/types";
import { getCategoryIcon, getPriorityColor } from "./ticket-card";

export default function RenderTable({
  tickets,
  onRowClick,
}: {
  tickets: TicketData[];
  onRowClick?: (ticket: TicketData) => void;
}) {
  const StatusIcon = ({ status }: { status: string | undefined }) => {
    const Icon = getTicketStatusIcon(status || "open");
    return <Icon className="size-3" />;
  };

  const columns = useMemo<ColumnDef<TicketData>[]>(
    () => [
      {
        id: "index",
        header: "#",
        cell: ({ row }) => (
          <span className="text-xs font-medium text-muted-foreground">
            {row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "ticketId",
        header: "Ticket ID",
        cell: ({ row }) => (
          <span className="text-xs font-mono font-medium text-muted-foreground">
            {row.original.ticketId}
          </span>
        ),
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 max-w-55">
            <div className="size-7 rounded-full flex items-center justify-center bg-muted dark:bg-muted/50 shrink-0">
              {getCategoryIcon(row.original.category)}
            </div>
            <span className="text-xs font-medium text-foreground truncate">
              {row.original.title}
            </span>
          </div>
        ),
      },
      {
        id: "priority",
        header: "Priority",
        cell: ({ row }) => (
          <span
            className={`${getPriorityColor(row.original.priority)} text-[10px] px-1.5 py-0.5 rounded-sm font-semibold`}
          >
            {row.original.priority.toUpperCase()}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={`${getTicketStatusColor(row.original.status)} text-[10px] px-2 py-0.5 rounded-sm font-semibold inline-flex items-center gap-1`}
          >
            <StatusIcon status={row.original.status} />
            <span className="capitalize">{row.original.status}</span>
          </span>
        ),
      },
      {
        id: "createdBy",
        header: "Created By",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                {row.original.userId?.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-muted-foreground truncate max-w-25">
              {row.original.userId?.name || "Unknown"}
            </span>
          </div>
        ),
      },
      {
        id: "assignedTo",
        header: "Assigned To",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.assignedTo ? (
              <>
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                    {row.original.assignedTo.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-muted-foreground truncate max-w-25">
                  {row.original.assignedTo.name}
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground/50">—</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(row.original.createdAt as unknown as string)}
          </span>
        ),
      },
    ],
    [],
  );

  return <TableView columns={columns} data={tickets} onRowClick={onRowClick} />;
}
