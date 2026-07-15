import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import {
  RiCalendarLine,
  RiGroupLine,
  RiMoreLine,
  RiTimeLine,
  RiUserLine,
} from "@remixicon/react";
import { useState } from "react";
import { Link } from "react-router";
import { CanPermit } from "~/components/provider/rbac-permit";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import NotFound from "~/components/ui/not-found";
import { ProgressIndicator, ProgressTrack } from "~/components/ui/progress";
import { getProgressColor, getProjectStatusColor } from "~/lib/constants";
import { formatDate } from "~/lib/utils";
import type { ProjectData, UserData } from "~/types";
import DeleteProject from "./delete-project";
import EditProject from "./edit-project";

const programLabel: Record<string, string> = {
  "full-stack": "Full Stack",
  "product-design": "Product Design",
  "data-analysis": "Data Analysis",
  "cyber-security": "Cyber Security",
};

export default function ProjectList({
  project,
  user,
}: {
  project: ProjectData;
  user: UserData;
}) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOpenDelete, setIsOpenDelete] = useState<boolean>(false);

  if (!project) {
    return (
      <NotFound
        title="No active project found"
        message="Your project is currently empty. Come back later to see your project."
      />
    );
  }

  const cohort = typeof project.cohort === "object" ? project.cohort : null;
  const createdBy =
    typeof project.createdBy === "object" ? project.createdBy : null;
  const progress = project.progress ?? 0;
  const progColor = getProgressColor(
    progress >= 100
      ? 100
      : progress >= 75
        ? 75
        : progress >= 50
          ? 50
          : progress >= 25
            ? 25
            : 0,
  );

  return (
    <>
      <Card className="group rounded-md dark:bg-muted/30 hover:border-mainBlue/30 dark:hover:border-darkBlue/40 hover:shadow-sm transition-[border-color,box-shadow] duration-300 animate-in fade-in slide-in-from-bottom-3">
        <CardHeader>
          <div className="flex items-start justify-between w-full">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-semibold">{project.title}</span>
                <Badge className={getProjectStatusColor(project.status)}>
                  {project.status}
                </Badge>
              </CardTitle>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
            <CardAction>
              <CanPermit user={user} permission="MANAGE_COHORTS">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon" title="More actions">
                        <RiMoreLine size={20} />
                      </Button>
                    }
                  />
                  <DropdownMenuContent className="rounded-sm">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => setIsOpen(true)}
                      >
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Link
                          to={`/projects/${project._id}/stages`}
                          prefetch="intent"
                        >
                          Manage Stages
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive"
                        onClick={() => setIsOpenDelete(true)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CanPermit>
            </CardAction>
          </div>
        </CardHeader>
        <div className="mx-4 border-t border-border" />
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {progress}%
              </span>
            </div>
            <ProgressPrimitive.Root value={progress}>
              <ProgressTrack>
                <ProgressIndicator className={progColor} />
              </ProgressTrack>
            </ProgressPrimitive.Root>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {cohort && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-muted/60 border border-border/50">
                  <RiGroupLine size={13} />
                </div>
                <span className="truncate">
                  {programLabel[cohort.program] ?? cohort.program}
                  {" — "}
                  {cohort.cohort} {" — "} {project.cohort?.members?.length}{" "}
                  members
                </span>
              </div>
            )}
            {createdBy && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-muted/60 border border-border/50">
                  <RiUserLine size={13} />
                </div>
                <span className="truncate">Created by {createdBy.name}</span>
              </div>
            )}
            {project.startDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-muted/60 border border-border/50">
                  <RiCalendarLine size={13} />
                </div>
                <span className="truncate">
                  {formatDate(project.startDate)}
                  {project.endDate && ` — ${formatDate(project.endDate)}`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-muted/60 border border-border/50">
                <RiTimeLine size={13} />
              </div>
              <span className="truncate">
                Created {formatDate(project.createdAt)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      {isOpen && (
        <EditProject
          project={project}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
      {isOpenDelete && (
        <DeleteProject
          project={project}
          isOpen={isOpenDelete}
          onClose={() => setIsOpenDelete(false)}
        />
      )}
    </>
  );
}
