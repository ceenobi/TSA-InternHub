import { zodResolver } from "@hookform/resolvers/zod";
import { RiAddLine, RiCloseLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import AlertBox from "~/components/provider/alert-box";
import ActionButton from "~/components/ui/action-button";
import { Button } from "~/components/ui/button";
import { FormBox } from "~/components/ui/formbox";
import Modal from "~/components/ui/modal";
import type { TaskData } from "~/types";

const submitSchema = z.object({
  content: z.string().min(10, "Submission must be at least 10 characters"),
  repoUrl: z.url("Must be a valid URL").optional().or(z.literal("")),
});

type SubmitSchemaType = z.infer<typeof submitSchema>;

type SubmitTaskModalProps = {
  task: TaskData | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

export function SubmitTaskModal({
  task,
  isOpen,
  setIsOpen,
}: SubmitTaskModalProps) {
  const form = useForm<SubmitSchemaType>({
    resolver: zodResolver(submitSchema),
    mode: "onChange",
    defaultValues: { content: "" },
  });
  const [fileUrls, setFileUrls] = useState<{ name: string; url: string }[]>([
    { name: "", url: "" },
  ]);
  const fetcher = useFetcher();

  const actionData = fetcher.data as
    | { success?: boolean; message?: string }
    | undefined;

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Task submitted successfully");
      form.reset();
      setFileUrls([{ name: "", url: "" }]);
      setIsOpen(false);
    }
  }, [actionData, form, setIsOpen]);

  useEffect(() => {
    if (isOpen) {
      form.reset();
      setFileUrls([{ name: "", url: "" }]);
      fetcher.data = undefined;
    }
  }, [isOpen]);

  const onFormSubmit = (data: SubmitSchemaType) => {
    if (!task) return;
    const cleanUrls = fileUrls.filter((f) => f.name.trim() && f.url.trim());
    fetcher.submit(
      { ...data, fileUrls: cleanUrls, taskId: task._id, intent: "submit-task" },
      { method: "post", action: "/tasks", encType: "application/json" },
    );
  };

  const addUrl = () => setFileUrls([...fileUrls, { name: "", url: "" }]);
  const updateUrl = (i: number, field: "name" | "url", v: string) => {
    const updated = [...fileUrls];
    updated[i] = { ...updated[i], [field]: v };
    setFileUrls(updated);
  };
  const removeUrl = (i: number) => {
    setFileUrls(fileUrls.filter((_, idx) => idx !== i));
  };

  if (!task) return null;

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title={task.title}
      description="Submit your work for this task"
    >
      <div className="space-y-4 pt-2">
        {actionData !== undefined && actionData?.success === false && (
          <AlertBox
            title={"Error"}
            description={actionData.message || "Error submitting task"}
            variant={"error"}
            onClose={() => {
              fetcher.reset();
            }}
          />
        )}
        <div className="rounded-lg bg-card border px-4 py-3">
          <div className="flex items-center justify-between text-muted-foreground text-sm">
            <span>Max score</span>
            <span className="font-semibold text-foreground">
              {task.maxScore}pts
            </span>
          </div>
          {task.dueDate && (
            <div className="flex items-center justify-between text-muted-foreground text-sm mt-1.5">
              <span>Due date</span>
              <span className="font-semibold text-foreground">
                {new Date(task.dueDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
        <fetcher.Form
          id="submit-task-form"
          onSubmit={form.handleSubmit(onFormSubmit)}
        >
          <FormBox
            label="Your submission"
            type="textarea"
            placeholder="Describe your work, any additonal information the reviewer should know…"
            id="content"
            register={form.register}
            errors={form.formState.errors}
            control={form.control}
            name="content"
            classname="w-full"
          />

          {/* File URLs */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Link URLs</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addUrl}
                className="text-mainBlue dark:text-mainGold"
              >
                <RiAddLine className="mr-1" size={14} />
                Add Link
              </Button>
            </div>
            {fileUrls.map((file, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <input
                  value={file.name}
                  onChange={(e) => updateUrl(i, "name", e.target.value)}
                  placeholder="e.g. Design File"
                  aria-label="Link name"
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:border-mainBlue dark:focus:border-darkBlue"
                />
                <input
                  value={file.url}
                  onChange={(e) => updateUrl(i, "url", e.target.value)}
                  placeholder="https://example.com/file"
                  aria-label="Link URL"
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:border-mainBlue dark:focus:border-darkBlue"
                />
                <button
                  type="button"
                  onClick={() => removeUrl(i)}
                  aria-label="Remove URL"
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <RiCloseLine size={18} />
                </button>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground">
              Add links to your work (Google Docs, GitHub repos, Figma files,
              etc.)
            </p>
          </div>

          {/* GitHub Repo URL */}
          <div className="mt-4 space-y-2">
            <FormBox
              label="GitHub Repository (optional)"
              type="url"
              placeholder="https://github.com/username/repo"
              id="repoUrl"
              register={form.register}
              errors={form.formState.errors}
              control={form.control}
              name="repoUrl"
            />
            <p className="text-[11px] text-muted-foreground">
              Link your GitHub repo so a commit status is set when your work is
              graded.
            </p>
          </div>

          <ActionButton
            text="Submit Task"
            type="submit"
            loading={fetcher.state !== "idle"}
            classname="mt-4 w-full rounded-sm bg-mainBlue dark:bg-darkBlue/40 text-white"
          />
        </fetcher.Form>
      </div>
    </Modal>
  );
}
