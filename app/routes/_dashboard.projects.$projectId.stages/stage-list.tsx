import {
  RiAwardLine,
  RiCalendarLine,
  RiFlagLine,
  RiMoreLine,
  RiTimeLine,
} from "@remixicon/react";
import { memo, useState } from "react";
import { Link } from "react-router";
import { CanPermit } from "~/components/provider/rbac-permit";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
import { formatDate } from "~/lib/utils";
import type { StageData, UserData } from "~/types";
import DeleteStage from "./delete-stage";
import EditStage from "./edit-stage";

const StageCard = memo(function StageCard({
  stage,
  stagesLength,
  user,
  projectId,
  index,
  onEdit,
  onDelete,
}: {
  stage: StageData;
  stagesLength: number;
  user: UserData;
  projectId: string;
  index: number;
  onEdit: (stage: StageData) => void;
  onDelete: (stage: StageData) => void;
}) {
  return (
    <Card
      className="group rounded-md dark:bg-muted/30 hover:border-mainBlue/30 dark:hover:border-darkBlue/40 hover:shadow-sm transition-[border-color,box-shadow] duration-300 animate-in fade-in slide-in-from-bottom-3"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-semibold">
                Stage {stage.order}: {stage.title}
              </span>
            </CardTitle>
            {stage.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {stage.description}
              </p>
            )}
          </div>
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
                    onClick={() => onEdit(stage)}
                  >
                    Edit Stage
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Link
                      to={`/projects/${projectId}/stages/${stage._id}/tasks`}
                      prefetch="intent"
                    >
                      Manage Tasks
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive"
                    onClick={() => onDelete(stage)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </CanPermit>
        </div>
      </CardHeader>
      <div className="mx-4 border-t border-border" />
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-blue-600/20 border border-blue-600">
              <RiFlagLine size={13} className="text-blue-600" />
            </div>
            <span className="truncate">
              Stage {stage.order} of {stagesLength}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-green-400/20 border border-green-400">
              <RiAwardLine size={13} className="text-green-400"/>
            </div>
            <span className="truncate">
              Passmark: {stage.passPercentage}%
            </span>
          </div>
          {stage.startDate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-amber-400/20 border border-amber-400">
                <RiCalendarLine size={13} className="text-amber-400"/>
              </div>
              <span className="truncate">
                {formatDate(stage.startDate)}
                {stage.endDate && ` — ${formatDate(stage.endDate)}`}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-red-400/20 border border-red-400">
              <RiTimeLine size={13} className="text-red-400"/>
            </div>
            <span className="truncate">
              {stage.endDate
                ? `Ends ${formatDate(stage.endDate)}`
                : "No end date"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default function StageList({
  stages,
  user,
  projectId,
}: {
  stages: StageData[];
  user: UserData;
  projectId: string;
}) {
  const [editStage, setEditStage] = useState<StageData | null>(null);
  const [deleteStageState, setDeleteStageState] = useState<StageData | null>(
    null,
  );

  if (!stages || stages.length === 0) {
    return (
      <NotFound
        title="No stages found"
        message="Your project stages is currently empty. Start by creating a stage."
      />
    );
  }

  return (
    <>
      {stages.map((stage, index) => (
        <StageCard
          key={stage._id}
          stage={stage}
          stagesLength={stages.length}
          user={user}
          projectId={projectId}
          index={index}
          onEdit={setEditStage}
          onDelete={setDeleteStageState}
        />
      ))}
      {editStage && (
        <EditStage
          stage={editStage}
          projectId={projectId}
          isOpen={!!editStage}
          onClose={() => setEditStage(null)}
        />
      )}
      {deleteStageState && (
        <DeleteStage
          stage={deleteStageState}
          projectId={projectId}
          isOpen={!!deleteStageState}
          onClose={() => setDeleteStageState(null)}
        />
      )}
    </>
  );
}
