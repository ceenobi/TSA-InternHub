import { RiAlertLine } from "@remixicon/react";
import { useEffect } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import AlertBox from "~/components/provider/alert-box";
import ActionButton from "~/components/ui/action-button";
import { Button } from "~/components/ui/button";
import Modal from "~/components/ui/modal";
import { Separator } from "~/components/ui/separator";
import type { ProjectData } from "~/types";

export default function DeleteProject({
  project,
  isOpen,
  onClose,
}: {
  project: ProjectData;
  isOpen: boolean;
  onClose: () => void;
}) {
  const fetcher = useFetcher();
  const actionData = fetcher.data as
    | { success?: boolean; message?: string; body?: any }
    | undefined;

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Project deleted successfully");
      onClose();
    }
  }, [actionData]);

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={onClose}
      title={`Delete ${project.title}`}
      description="Are you sure you want to delete this project? This action cannot be undone."
    >
      <Separator />
      {actionData !== undefined && actionData.success === false && (
        <AlertBox
          title={"Error"}
          description={actionData.message || "Error deleting project"}
          variant={"error"}
          onClose={onClose}
        />
      )}
      <div className="flex items-start gap-4">
        <button className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 transition-colors">
          <RiAlertLine className="w-6 h-6" />
        </button>
        <p className="text-sm text-muted-foreground">
          You will lose all information about the project including the stages,
          tasks, submissions and any other data relevant to the project.
        </p>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <Button variant="outline" className="rounded-sm" onClick={onClose}>
          Cancel
        </Button>
        <ActionButton
          text="Delete"
          type="submit"
          variant="destructive"
          loading={fetcher.state !== "idle"}
          classname="rounded-sm h-auto"
          onClick={() =>
            fetcher.submit(
              { id: project._id, intent: "delete-project" },
              { method: "delete" },
            )
          }
        />
      </div>
    </Modal>
  );
}
