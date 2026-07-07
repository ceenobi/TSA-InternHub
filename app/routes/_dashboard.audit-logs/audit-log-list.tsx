import { RiFilter3Line } from "@remixicon/react";
import { useSearchParams } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import Paginate from "~/components/ui/paginate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import usePaginate from "~/hooks/usePaginate";
import { cn, formatDate } from "~/lib/utils";
import type { AuditLogData, UsePaginateProps } from "~/types";

export function AuditLogList({
  logs,
  meta,
}: {
  logs: AuditLogData[];
  meta: UsePaginateProps;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get("category") || "all";
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

  const handleCategoryChange = (value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (!value || value === "all") {
      newParams.delete("category");
    } else {
      newParams.set("category", value);
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };
  
  const categories = [
    { label: "All Activities", value: "all" },
    { label: "Authentication", value: "auth" },
    { label: "Tasks", value: "tasks" },
    { label: "Staff Management", value: "staff" },
    { label: "Security", value: "security" },
    { label: "Settings", value: "settings" },
  ];

  return (
    <Card className="rounded-sm dark:bg-muted/30">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <h1>Audit History</h1>
          <div className="flex items-center gap-2 bg-muted/30 px-3 rounded-md border border-border/80">
            <RiFilter3Line size={16} className="text-muted-foreground" />
            <Select
              value={currentCategory}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="rounded-sm border-none bg-transparent h-fit p-0 focus:ring-0 shadow-none text-xs font-bold uppercase tracking-widest min-w-32">
                <SelectValue placeholder="Filter Category" />
              </SelectTrigger>
              <SelectContent className="rounded-sm">
                {categories.map((cat) => (
                  <SelectItem
                    key={cat.value}
                    value={cat.value}
                    className="text-xs hover:rounded-sm"
                  >
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
        <CardContent className="p-0">
          <div className="mt-6 space-y-4">
            {logs.map((log, i) => (
              <div
                key={log._id}
                className="group relative p-4 rounded-sm border border-border/60 bg-background hover:border-mainBlue/30 dark:hover:border-darkBlue/40 hover:shadow-sm dark:bg-muted/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="p-0 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-foreground uppercase tracking-tight">
                        {log.action}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Performed by {log.userName}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "text-[9px] uppercase font-bold py-0.5 px-2",
                        log.status === "success"
                          ? "bg-green-500/10 text-green-600"
                          : "bg-rose-500/10 text-rose-600",
                      )}
                    >
                      {log.status}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border/40">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                        Category
                      </span>
                      <span className="text-[11px] font-medium capitalize">
                        {log.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                        Time
                      </span>
                      <span className="text-[10px] font-mono">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    {log.description && (
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                          Description
                        </span>
                        <span className="text-[10px] font-mono">
                          {log.description}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Paginate
            totalPages={totalPages}
            hasMore={hasMore}
            handlePageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            currentPage={currentPage}
            limit={pageLimit}
          />
        </CardContent>
      </CardHeader>
    </Card>
  );
}
