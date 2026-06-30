import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import TableView from "~/components/ui/table-view";
import type { UserData } from "~/types";

export default function RenderTable({ data }: { data: UserData[] }) {
  const columns = useMemo<ColumnDef<UserData>[]>(() => {
    return [
      {
        id: "index",
        header: "#",
        cell: ({ row }) => {
          return (
            <span className="text-xs font-medium text-muted-foreground">
              {row.index + 1}
            </span>
          );
        },
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={row.original.image} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {row.original.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-muted-foreground">
                {row.original.name}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => {
          return (
            <a
              href={`mailto:${row.original.email}`}
              className="text-xs font-medium text-muted-foreground"
              title={`Send email to:${row.original.email}`}
            >
              {row.original.email}
            </a>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => {
          return (
            <span
              className="cursor-pointer text-xs font-medium text-muted-foreground"
              onClick={() => window.open(`tel:${row.original.phone}`, "_blank")}
              title={`Call: ${row.original.phone}`}
            >
              {row.original.phone || "N/A"}
            </span>
          );
        },
      },
      {
        accessorKey: "gender",
        header: "Gender",
        cell: ({ row }) => {
          return (
            <span className="text-xs font-medium text-muted-foreground">
              {row.original.gender || "N/A"}
            </span>
          );
        },
      },
    ];
  }, []);
  return <TableView columns={columns} data={data} />;
}
