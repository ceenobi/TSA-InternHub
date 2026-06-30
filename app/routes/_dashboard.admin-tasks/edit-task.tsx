import { zodResolver } from "@hookform/resolvers/zod";
import { RiAddLine, RiCloseLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import AlertBox from "~/components/provider/alert-box";
import ActionButton from "~/components/ui/action-button";
import { Button } from "~/components/ui/button";
import { FormBox } from "~/components/ui/formbox";
import Modal from "~/components/ui/modal";
import { Separator } from "~/components/ui/separator";
import { taskFields } from "~/lib/constants";
import { taskSchema } from "~/lib/schemaValidation";

type EditTaskProps = {
  task: any;
  isOpen: boolean;
  onClose: () => void;
};

export default function EditTask({ task, isOpen, onClose }: EditTaskProps) {
  const form = useForm({
    resolver: zodResolver(taskSchema),
    mode: "onChange",
    defaultValues: {
      stage: task.stage,
      title: task.title || "",
      description: task.description || "",
      instructions: task.instructions || "",
      resources: [],
      type: task.type || "individual",
      maxScore: task.maxScore ?? 100,
      isBonus: task.isBonus ?? false,
      order: task.order ?? 1,
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
      maxAttempts: task.maxAttempts ?? 2,
      allowLate: task.allowLate ?? true,
      latePenaltyPercent: task.latePenaltyPercent ?? 5,
    },
  });
  const [resources, setResources] = useState<{ name: string; url: string }[]>(
    task.resources || [],
  );
  const fetcher = useFetcher();

  const actionData = fetcher.data as
    | { success?: boolean; message?: string }
    | undefined;

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Task updated successfully");
      onClose();
    }
  }, [actionData, onClose]);

  useEffect(() => {
    if (isOpen) {
      fetcher.data = undefined;
    }
  }, [isOpen]);

  const onFormSubmit = (data: Record<string, unknown>) => {
    const cleanedResources = resources.filter(
      (r) => r.name.trim() && r.url.trim(),
    );
    fetcher.submit(
      {
        ...data,
        resources: cleanedResources,
        taskId: task._id,
        intent: "edit-task",
      },
      {
        method: "post",
        action: "/admin-tasks",
        encType: "application/json",
      },
    );
  };

  const handleClose = () => {
    form.reset();
    setResources(task.resources || []);
    fetcher.data = undefined;
  };

  const addResource = () => {
    setResources([...resources, { name: "", url: "" }]);
  };

  const updateResource = (
    index: number,
    field: "name" | "url",
    value: string,
  ) => {
    const updated = [...resources];
    updated[index] = { ...updated[index], [field]: value };
    setResources(updated);
  };

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={onClose}
      title="Edit Task"
      description={task.title || "Edit the task details."}
    >
      <Separator />
      <div className="px-2 max-h-[60vh] overflow-y-auto">
        <div className="mb-4 space-y-4">
          {actionData !== undefined && actionData.success === false && (
            <AlertBox
              title="Error"
              description={actionData.message || "Error updating task"}
              variant="error"
              onClose={handleClose}
            />
          )}
          <fetcher.Form
            id="edit-task-form"
            onSubmit={form.handleSubmit(onFormSubmit)}
          >
            {taskFields.map((field) => (
              <FormBox
                key={field.name}
                label={field.label}
                type={field.type}
                placeholder={field.placeholder}
                id={field.name}
                register={form.register}
                errors={form.formState.errors}
                control={form.control}
                name={field.name as any}
                options={(field as any).options}
                classname="w-full"
              />
            ))}
            <input
              type="hidden"
              {...form.register("stage")}
              value={task.stage}
            />
            {/* Resources Section */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Resources</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addResource}
                  className="text-mainBlue dark:text-mainGold"
                >
                  <RiAddLine className="mr-1" size={14} />
                  Add Resource
                </Button>
              </div>
              {resources.map((resource, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <input
                      value={resource.name}
                      onChange={(e) =>
                        updateResource(index, "name", e.target.value)
                      }
                      placeholder="Resource name"
                      className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:border-mainBlue dark:focus:border-darkBlue"
                    />
                    <input
                      value={resource.url}
                      onChange={(e) =>
                        updateResource(index, "url", e.target.value)
                      }
                      placeholder="https://example.com"
                      className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:border-mainBlue dark:focus:border-darkBlue"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeResource(index)}
                    className="mt-2 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <RiCloseLine size={18} />
                  </button>
                </div>
              ))}
            </div>

            <ActionButton
              text="Update Task"
              type="submit"
              loading={fetcher.state !== "idle"}
              classname="mt-6 w-full rounded-sm border dark:border-darkBlue bg-mainBlue dark:bg-darkBlue/20 hover:bg-mainBlue/90 hover:dark:bg-darkBlue/30 text-white"
            />
          </fetcher.Form>
        </div>
      </div>
    </Modal>
  );
}
