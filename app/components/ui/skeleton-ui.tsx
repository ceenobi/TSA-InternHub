import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Skeleton } from "./skeleton";

export function CohortSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-4 p-3 rounded-md border border-border/60 bg-background dark:bg-muted/20"
        >
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="size-8 rounded-md" />
          </div>
          <div className="flex gap-2 items-center">
            <Skeleton className="size-5 rounded-md" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="h-px bg-border/50" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CohortStatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-md" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64 w-full rounded-md" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    </div>
  );
}

export function MembersSkeleton() {
  return (
    <>
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-background border border-border rounded-2xl overflow-hidden flex flex-col h-full"
          >
            <Skeleton className="aspect-square w-full" />
            <div className="p-4 space-y-3 flex-1 flex flex-col">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex items-center justify-between pt-2 mt-auto">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden lg:block overflow-x-auto shadow rounded-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              {Array.from({ length: 8 }).map((_, index) => (
                <th key={index} className="p-4 font-medium text-gray-500">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-gray-100 last:border-0"
              >
                {Array.from({ length: 8 }).map((_, cellIndex) => (
                  <td key={cellIndex} className="p-4">
                    <Skeleton
                      className={`h-5 ${cellIndex === 1 || cellIndex === 3 ? "w-32" : "w-24"}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function StaffCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-4 p-5 rounded-xl border border-border/60 bg-background dark:bg-muted/20"
        >
          {/* Header: avatar + name/badge */}
          <div className="flex items-start gap-4">
            <Skeleton className="size-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
          {/* Divider */}
          <div className="h-px bg-border/50" />
          {/* Detail rows */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Skeleton className="size-6 rounded-md shrink-0" />
              <Skeleton className="h-3.5 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="size-6 rounded-md shrink-0" />
              <Skeleton className="h-3.5 w-28" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="size-6 rounded-md shrink-0" />
              <Skeleton className="h-3.5 w-36" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AuditLogsSkeleton() {
  return (
    <Card className="rounded-sm dark:bg-muted/30">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-40 rounded-md" />
        </CardTitle>
        <CardContent className="p-0">
          <div className="mt-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-sm border-border/80 bg-gray-50/30 dark:bg-muted/50"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-44" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border/40">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </CardHeader>
    </Card>
  );
}

export function ProjectListSkeleton() {
  return (
    <Card className="rounded-md dark:bg-muted/30">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between w-full">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="size-8 rounded-md shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-md shrink-0" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TaskViewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stage Nav Skeleton */}
      <div className="rounded-sm border p-3">
        <div className="flex items-center gap-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className="flex items-center gap-2 px-3 py-2">
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="h-4 w-8" />
              </div>
              {i < 3 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-8 min-w-0">
          {/* Breadcrumb */}
          <div className="hidden lg:flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-36" />
          </div>

          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-5 w-24 rounded-sm" />
            </div>
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card dark:bg-muted/30 p-6 rounded-sm border space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-5" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton className="size-4 shrink-0 mt-0.5" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card dark:bg-muted/30 p-6 rounded-sm border space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-5" />
                <Skeleton className="h-5 w-44" />
              </div>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="flex flex-col gap-4">
            <Skeleton className="h-5 w-24" />
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 bg-card dark:bg-muted/30 border rounded-sm p-4"
                >
                  <Skeleton className="size-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-48" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-14 rounded-sm" />
                        <Skeleton className="h-4 w-12 rounded-sm" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-3">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="w-full lg:w-[320px] flex flex-col md:flex-row lg:flex-col gap-4 shrink-0">
          <div className="w-full bg-card/70 border p-6 rounded-md space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-20 rounded-sm" />
            </div>
            <Skeleton className="size-32 rounded-full mx-auto" />
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
          <div className="w-full bg-muted/30 p-6 rounded-md border space-y-4">
            <Skeleton className="h-5 w-32" />
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-5" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="size-4" />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 bg-card dark:bg-muted/30 border rounded-sm p-4"
        >
          <Skeleton className="size-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-48" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-14 rounded-sm" />
                <Skeleton className="h-4 w-12 rounded-sm" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-3">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TaskStatsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} size="sm" className="rounded-sm dark:bg-muted/30">
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="size-9 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="rounded-sm dark:bg-muted/30">
            <CardHeader>
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-60 w-full rounded-sm" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="rounded-sm dark:bg-muted/30 max-w-lg">
        <CardHeader>
          <Skeleton className="h-4 w-36" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-44 w-full rounded-sm" />
        </CardContent>
      </Card>
    </div>
  );
}

export function HelpCenterSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} size="sm" className="rounded-sm dark:bg-muted/30">
            <CardContent className="flex items-center gap-4">
              <Skeleton className="size-10 rounded-full shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-4 md:gap-8 border-b pb-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-20 rounded-sm" />
        ))}
      </div>

      {/* Ticket list skeleton */}
      <div className="flex flex-col gap-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 bg-card dark:bg-muted/30 border rounded-sm p-4"
          >
            <Skeleton className="size-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Skeleton className="h-5 w-14 rounded-sm" />
                  <Skeleton className="h-4 w-10 rounded-sm" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
