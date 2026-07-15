import { zodResolver } from "@hookform/resolvers/zod";
import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCalendarLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiEditLine,
  RiLockLine,
  RiTeamLine,
  RiUserStarLine,
  RiVideoChatLine,
} from "@remixicon/react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Await, useFetcher, useOutletContext } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { PageSection, PageWrapper } from "~/components/provider/page-wrapper";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import DataError from "~/components/ui/data-error";
import { FormSelect } from "~/components/ui/form-select";
import { FormBox } from "~/components/ui/formbox";
import Modal from "~/components/ui/modal";
import { getOptimizedImageUrl } from "~/lib/cloudinary";
import { cn } from "~/lib/utils";
import type { HubLoaderData, HubTaskData, UserData } from "~/types";

import { dehydrate } from "@tanstack/react-query";
import {
  assignTeamLeader,
  createHubTask,
  deleteHubTask,
  updateHubTask,
  updateHubTaskStatus,
  updateMeetingUrl,
} from "~/.server/action/hub";
import ActionButton from "~/components/ui/action-button";
import { HubSkeleton } from "~/components/ui/skeleton-ui";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { getHubDataQuery } from "~/queries/hub.server";
import type { Route } from "./+types/route";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Stage 5 Hub | TSA InternHub" },
    {
      name: "description",
      content:
        "Centralized workspace for Stage 5 team collaboration and task tracking.",
    },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  const { intent, ...data } = payload;

  switch (intent) {
    case "assign-leader":
      return await assignTeamLeader(request, data);
    case "create-task":
      return await createHubTask(request, data);
    case "update-task":
      return await updateHubTask(request, data);
    case "update-status":
      return await updateHubTaskStatus(request, data);
    case "delete-task":
      return await deleteHubTask(request, data);
    case "update-meeting-url":
      return await updateMeetingUrl(request, data);
    default:
      return Response.json(
        { success: false, message: "Invalid action" },
        { status: 400 },
      );
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const queryClient = getQueryClientRsc();
  const hubData = queryClient.ensureQueryData(getHubDataQuery(request));
  return {
    dehydratedState: dehydrate(queryClient),
    hubData,
  };
}
// Zod schemas for client validation
const taskFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().max(500).optional(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
  assignedTo: z.array(z.string()),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function HubRoute({ loaderData }: Route.ComponentProps) {
  const { hubData } = loaderData;
  const { user } = useOutletContext() as { user: UserData };

  return (
    <Suspense fallback={<HubSkeleton />}>
      <Await resolve={hubData} errorElement={<DataError />}>
        {(resolvedHubData) => <HubView hubData={resolvedHubData} user={user} />}
      </Await>
    </Suspense>
  );
}

function HubView({
  hubData,
  user,
}: {
  hubData: HubLoaderData;
  user: UserData;
}) {
  const fetcher = useFetcher();

  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HubTaskData | null>(null);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>("");

  const actionData = fetcher.data as
    | { success?: boolean; message?: string }
    | undefined;

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Operation successful");
      setIsLeaderModalOpen(false);
      setIsTaskModalOpen(false);
      setIsMeetingModalOpen(false);
      setSelectedTask(null);
    } else if (actionData && actionData.success === false) {
      toast.error(actionData.message || "Something went wrong");
    }
  }, [actionData]);

  // Form for Creating/Editing task
  const taskForm = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
      assignedTo: [],
    },
  });

  useEffect(() => {
    if (selectedTask) {
      taskForm.reset({
        title: selectedTask.title,
        description: selectedTask.description || "",
        priority: selectedTask.priority,
        dueDate: selectedTask.dueDate ? selectedTask.dueDate.split("T")[0] : "",
        assignedTo: selectedTask.assignedTo.map((a) => a._id),
      });
    } else {
      taskForm.reset({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        assignedTo: [],
      });
    }
  }, [selectedTask, isTaskModalOpen]);

  // Form for Meeting URL
  const meetingForm = useForm<{ meetingUrl: string }>({
    defaultValues: {
      meetingUrl: hubData?.hubTeam?.meetingUrl || "",
    },
  });

  useEffect(() => {
    if (hubData?.hubTeam?.meetingUrl) {
      meetingForm.reset({ meetingUrl: hubData.hubTeam.meetingUrl });
    }
  }, [hubData?.hubTeam?.meetingUrl]);

  if (!hubData.isQualified) {
    return (
      <PageWrapper>
        <PageSection
          index={0}
          className="max-w-2xl mx-auto py-16 px-4 text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400">
              <RiLockLine size={48} />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-4">
            Stage 5 Hub Locked
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            The Capstone Hub is locked. To qualify, you must reach Stage 4 and
            maintain an overall average score of at least 70% across stages 1–4.
          </p>

          <div className="bg-card dark:bg-muted/30 border rounded-sm p-6 text-left space-y-4 mb-8">
            <h3 className="font-semibold text-lg border-b pb-2">
              Qualified Members ({hubData.members.length})
            </h3>
            {hubData.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No members have qualified yet. Be the first!
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {hubData.members.map((member) => (
                  <div key={member._id} className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarImage src={getOptimizedImageUrl(member.image, 24)} alt={member.name} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">
                      {member.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PageSection>
      </PageWrapper>
    );
  }

  const { hubTeam, tasks, members, stage5Task } = hubData;
  const teamLeader = hubTeam?.teamLeader;
  const isLeader = hubData.isTeamLeader;
  const hasEditRights = isLeader || hubData.isAdmin;
  const memberOptions = useMemo(
    () =>
      members.map((m) => ({
        name: `${m.name} (${m.email})`,
        id: m._id,
      })),
    [members],
  );

  const getStatusList = useMemo(() => {
    const cache: Record<string, typeof tasks> = {};
    return (status: "todo" | "in-progress" | "in-review" | "done") => {
      if (!cache[status]) {
        cache[status] = tasks.filter((t) => t.status === status);
      }
      return cache[status];
    };
  }, [tasks]);

  const handleUpdateStatus = (
    taskId: string,
    currentStatus: string,
    direction: "next" | "prev",
  ) => {
    const statuses: Array<"todo" | "in-progress" | "in-review" | "done"> = [
      "todo",
      "in-progress",
      "in-review",
      "done",
    ];
    const currentIndex = statuses.indexOf(currentStatus as any);
    let nextIndex = currentIndex + (direction === "next" ? 1 : -1);
    if (nextIndex >= 0 && nextIndex < statuses.length) {
      fetcher.submit(
        {
          intent: "update-status",
          taskId,
          status: statuses[nextIndex],
        } as any,
        { method: "post", encType: "application/json" },
      );
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      fetcher.submit({ intent: "delete-task", taskId } as any, {
        method: "post",
        encType: "application/json",
      });
    }
  };

  const onTaskSubmit = (values: TaskFormValues) => {
    fetcher.submit(
      {
        intent: selectedTask ? "update-task" : "create-task",
        taskId: selectedTask?._id,
        ...values,
      } as any,
      { method: "post", encType: "application/json" },
    );
  };

  const onLeaderSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLeaderId) return;

    fetcher.submit(
      {
        intent: "assign-leader",
        userId: selectedLeaderId,
        cohortId: hubTeam?.cohort,
      } as any,
      { method: "post", encType: "application/json" },
    );
  };

  const onMeetingSubmit = (values: { meetingUrl: string }) => {
    fetcher.submit(
      {
        intent: "update-meeting-url",
        meetingUrl: values.meetingUrl,
      } as any,
      { method: "post", encType: "application/json" },
    );
  };

  // Helper colors for task priority
  const getPriorityBadge = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400">
            Medium
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400">
            Low
          </Badge>
        );
    }
  };

  return (
    <PageWrapper>
      <PageSection index={0} className="space-y-6 xl:px-8 py-6">
        {/* Banner/Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-sm bg-linear-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20">
          <div className="space-y-1">
            <Badge className="rounded-sm bg-blue-600 text-white border-0 mb-1">
              Stage 5 Capstone
            </Badge>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {stage5Task?.title || "Team Collaboration Hub"}
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl">
              {stage5Task?.description ||
                "Work together, assign subtasks, set milestones and build something amazing."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hubTeam?.meetingUrl ? (
              <Button
                variant="outline"
                className="rounded-sm gap-2 text-blue-600 dark:text-blue-400 border-blue-500/30"
                onClick={() => window.open(hubTeam.meetingUrl, "_blank")}
              >
                <RiVideoChatLine size={16} />
                Join Standup
              </Button>
            ) : (
              hasEditRights && (
                <Button
                  variant="outline"
                  className="rounded-sm gap-2"
                  onClick={() => setIsMeetingModalOpen(true)}
                >
                  <RiVideoChatLine size={16} />
                  Add Standup Link
                </Button>
              )
            )}

            {hasEditRights && hubTeam?.meetingUrl && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-sm hover:bg-muted"
                onClick={() => setIsMeetingModalOpen(true)}
                title="Edit Standup Link"
              >
                <RiEditLine size={16} />
              </Button>
            )}

            {hasEditRights && (
              <Button
                className="rounded-sm gap-1.5 bg-mainBlue dark:bg-darkBlue/20 border dark:border-darkBlue/50 hover:bg-mainBlue/90 hover:dark:bg-darkBlue/30 text-white"
                onClick={() => {
                  setSelectedTask(null);
                  setIsTaskModalOpen(true);
                }}
              >
                <RiAddLine size={18} />
                Add Task
              </Button>
            )}
          </div>
        </div>

        {/* Team Leader & Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card dark:bg-muted/30  border rounded-sm p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-sm bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                <RiUserStarLine size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Team Leader
                </p>
                <p className="text-sm font-semibold">
                  {teamLeader ? (teamLeader as any).name : "Unassigned"}
                </p>
              </div>
            </div>
            {hubData.isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-sm text-xs"
                onClick={() => setIsLeaderModalOpen(true)}
              >
                Assign
              </Button>
            )}
          </div>

          <div className="bg-card dark:bg-muted/30 border rounded-sm p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
              <RiTeamLine size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Qualified Members
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-sm font-semibold mr-1">{members.length}</p>
                <AvatarGroup>
                  {members.slice(0, 4).map((member) => (
                    <Avatar
                      key={member._id}
                      size="sm"
                      className="border-2 border-background"
                    >
                      <AvatarImage src={getOptimizedImageUrl(member.image, 24)} alt={member.name} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ))}
                </AvatarGroup>
              </div>
            </div>
          </div>

          <div className="bg-card dark:bg-muted/30 border rounded-sm p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
              <RiCalendarLine size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Stage Deadline
              </p>
              <p className="text-sm font-semibold">
                {hubData.stage5Deadline
                  ? new Date(hubData.stage5Deadline).toLocaleDateString(
                      "en-GB",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      },
                    )
                  : "Not set"}
              </p>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {(
            ["todo", "in-progress", "in-review", "done"] as Array<
              "todo" | "in-progress" | "in-review" | "done"
            >
          ).map((columnKey) => {
            const list = getStatusList(columnKey);
            const titles: Record<string, string> = {
              todo: "To Do",
              "in-progress": "In Progress",
              "in-review": "In Review",
              done: "Done",
            };
            const columnColors: Record<string, string> = {
              todo: "border-t-zinc-400 dark:border-t-zinc-600",
              "in-progress": "border-t-blue-500",
              "in-review": "border-t-yellow-500",
              done: "border-t-emerald-500",
            };

            return (
              <div
                key={columnKey}
                className={cn(
                  "flex flex-col bg-muted/30 rounded-sm border p-4 min-h-125",
                  columnColors[columnKey],
                  "border-t-4",
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-sm capitalize">
                    {titles[columnKey]}
                  </span>
                  <Badge variant="outline" className="rounded-full">
                    {list.length}
                  </Badge>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-150 pr-1">
                  {list.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 border border-dashed border-muted-foreground/20 rounded-xl text-xs text-muted-foreground">
                      No tasks
                    </div>
                  ) : (
                    list.map((task) => {
                      const isAssigned = task.assignedTo.some(
                        (a) => a._id === user._id,
                      );
                      const hasMoveRights = hasEditRights || isAssigned;

                      return (
                        <div
                          key={task._id}
                          className="bg-card border hover:border-blue-500/30 transition-[border-color,box-shadow] rounded-xl p-4 shadow-xs space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-sm leading-tight text-foreground block">
                              {task.title}
                            </span>
                            {hasEditRights && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setIsTaskModalOpen(true);
                                  }}
                                  aria-label="Edit task"
                                  className="p-1 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                                >
                                  <RiEditLine size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task._id)}
                                  aria-label="Delete task"
                                  className="p-1 rounded-sm text-muted-foreground hover:bg-muted hover:text-destructive transition"
                                >
                                  <RiDeleteBinLine size={14} />
                                </button>
                              </div>
                            )}
                          </div>

                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-3">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between gap-2 border-t pt-2 mt-2">
                            <div className="flex items-center gap-1.5">
                              {getPriorityBadge(task.priority)}
                              {task.dueDate && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <RiCalendarLine size={10} />
                                  {new Date(task.dueDate).toLocaleDateString(
                                    "en-GB",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                    },
                                  )}
                                </span>
                              )}
                            </div>

                            <AvatarGroup>
                              {task.assignedTo.map((a) => (
                                  <Avatar
                                    key={a._id}
                                    size="sm"
                                    className="border border-background shrink-0 size-6"
                                    title={a.name}
                                  >
                                    <AvatarImage src={getOptimizedImageUrl(a.image, 24)} alt={a.name} />
                                  <AvatarFallback>
                                    {a.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </AvatarGroup>
                          </div>

                          {/* Quick Shift Status Controls */}
                          {hasMoveRights && (
                            <div className="flex items-center justify-end gap-1.5 border-t pt-2">
                              {columnKey !== "todo" && (
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="size-6 rounded-full"
                                  onClick={() =>
                                    handleUpdateStatus(
                                      task._id,
                                      columnKey,
                                      "prev",
                                    )
                                  }
                                  title="Move Left"
                                  aria-label="Move task left"
                                >
                                  <RiArrowLeftSLine size={14} />
                                </Button>
                              )}
                              {columnKey !== "done" && (
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="size-6 rounded-full"
                                  onClick={() =>
                                    handleUpdateStatus(
                                      task._id,
                                      columnKey,
                                      "next",
                                    )
                                  }
                                  title="Move Right"
                                  aria-label="Move task right"
                                >
                                  <RiArrowRightSLine size={14} />
                                </Button>
                              )}
                              {columnKey === "in-review" && isLeader && (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  className="rounded-full px-2 text-[10px] h-6 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  onClick={() =>
                                    handleUpdateStatus(
                                      task._id,
                                      columnKey,
                                      "next",
                                    )
                                  }
                                >
                                  <RiCheckLine size={10} /> Approve
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </PageSection>

      {/* MODAL: Assign Team Leader */}
      <Modal
        isOpen={isLeaderModalOpen}
        setIsOpen={setIsLeaderModalOpen}
        title="Assign Team Leader"
        description="Select a qualified Stage 5 member to lead the cohort team."
      >
        <form onSubmit={onLeaderSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Member</label>
            <FormSelect
              options={memberOptions}
              value={selectedLeaderId}
              onValueChange={(value) => setSelectedLeaderId(value ?? "")}
              placeholder="-- Select User --"
            />
          </div>
          <ActionButton
            text="Assign Team Leader"
            type="submit"
            loading={fetcher.state !== "idle"}
            classname="w-full rounded-sm bg-mainBlue dark:bg-darkBlue text-white"
          />
        </form>
      </Modal>

      {/* MODAL: Create / Edit Hub Task */}
      <Modal
        isOpen={isTaskModalOpen}
        setIsOpen={setIsTaskModalOpen}
        title={selectedTask ? "Edit Hub Task" : "Create Hub Task"}
        description={
          selectedTask
            ? "Modify details of the task."
            : "Define a subtask for your team members."
        }
      >
        <fetcher.Form
          onSubmit={taskForm.handleSubmit(onTaskSubmit as any)}
          className="space-y-4 pt-2"
        >
          <FormBox
            label="Task Title"
            type="text"
            id="title"
            register={taskForm.register}
            errors={taskForm.formState.errors}
            name="title"
            placeholder="e.g. Design user profiles"
          />

          <FormBox
            label="Description (optional)"
            type="textarea"
            id="description"
            register={taskForm.register}
            errors={taskForm.formState.errors}
            name="description"
            placeholder="Provide context, deliverables, or checklist items…"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="priority" className="text-xs font-medium">Priority</label>
              <select
                id="priority"
                {...taskForm.register("priority")}
                className="w-full h-10 rounded-sm border border-zinc-200 dark:border-accentBlack/60 bg-background px-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <FormBox
              label="Due Date (optional)"
              type="date"
              id="dueDate"
              register={taskForm.register}
              errors={taskForm.formState.errors}
              name="dueDate"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Assign To</label>
            <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1 bg-background">
              {members.map((member) => (
                <label
                  key={member._id}
                  className="flex items-center gap-2 py-1 px-1.5 hover:bg-muted/40 rounded-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    value={member._id}
                    aria-label={member.name}
                    defaultChecked={selectedTask?.assignedTo.some(
                      (a) => a._id === member._id,
                    )}
                    {...taskForm.register("assignedTo")}
                    className="rounded-sm border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                    <Avatar size="sm" className="size-5">
                      <AvatarImage src={getOptimizedImageUrl(member.image, 20)} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{member.name}</span>
                </label>
              ))}
            </div>
          </div>
          <ActionButton
            text={selectedTask ? "Save Changes" : "Create Task"}
            type="submit"
            loading={fetcher.state !== "idle"}
            classname="w-full rounded-sm bg-mainBlue dark:bg-darkBlue text-white"
          />
        </fetcher.Form>
      </Modal>

      {/* MODAL: Update Standup Link */}
      <Modal
        isOpen={isMeetingModalOpen}
        setIsOpen={setIsMeetingModalOpen}
        title="Set Standup Meeting URL"
        description="Share a recurring Google Meet or Zoom link for the daily standup."
      >
        <fetcher.Form
          onSubmit={meetingForm.handleSubmit(onMeetingSubmit)}
          className="space-y-4 pt-2"
        >
          <FormBox
            label="Meeting Link URL"
            type="url"
            id="meetingUrl"
            register={meetingForm.register}
            name="meetingUrl"
            placeholder="https://meet.google.com/abc-defg-hij"
          />
          <ActionButton
            text="Update Link"
            type="submit"
            loading={fetcher.state !== "idle"}
            classname="w-full rounded-sm bg-mainBlue dark:bg-darkBlue text-white"
          />
        </fetcher.Form>
      </Modal>
    </PageWrapper>
  );
}
