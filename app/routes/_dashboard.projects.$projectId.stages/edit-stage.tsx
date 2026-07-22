import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import AlertBox from "~/components/provider/alert-box";
import ActionButton from "~/components/ui/action-button";
import { FormBox } from "~/components/ui/formbox";
import Modal from "~/components/ui/modal";
import { Separator } from "~/components/ui/separator";
import { stageFields } from "~/lib/constants";
import { stageSchema } from "~/lib/schemaValidation";
import type { StageData } from "~/types";

export default function EditStage({
  stage,
  projectId,
  isOpen,
  onClose,
}: {
  stage: StageData;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(stageSchema),
    mode: "onChange",
    defaultValues: {
      title: stage.title,
      description: stage.description || "",
      passPercentage: stage.passPercentage,
      startDate: stage.startDate
        ? new Date(stage.startDate).toISOString().split("T")[0]
        : "",
      endDate: stage.endDate
        ? new Date(stage.endDate).toISOString().split("T")[0]
        : "",
      lateGraceHours: stage.lateGraceHours ?? 24,
      latePenaltyPerDay: stage.latePenaltyPerDay ?? 0.5,
    },
  });
  const fetcher = useFetcher();
  const filterFields = stageFields.filter((field) =>
    [
      "title",
      "description",
      "passPercentage",
      "startDate",
      "endDate",
      "lateGraceHours",
      "latePenaltyPerDay",
    ].includes(field.name),
  );

  const actionData = fetcher.data as
    | { success?: boolean; message?: string; body?: any }
    | undefined;

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Stage updated successfully");
      form.reset();
      onClose();
    }
  }, [actionData, form]);

  const onFormSubmit = (data: Record<string, unknown>) => {
    fetcher.submit(
      { ...data, stageId: stage._id, projectId, intent: "update-stage" },
      {
        method: "post",
        action: `/projects/${projectId}/stages`,
        encType: "application/json",
      },
    );
  };

  const handleClose = () => {
    form.reset();
    fetcher.data = undefined;
  };

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={onClose}
      title={`Edit ${stage.title}`}
      description="Update the stage details."
    >
      <Separator />
      <div className="px-2 max-h-[60vh] overflow-y-auto">
        <div className="mb-4 space-y-4">
          {actionData !== undefined && actionData.success === false && (
            <AlertBox
              title={"Error"}
              description={actionData.message || "Error updating stage"}
              variant={"error"}
              onClose={handleClose}
            />
          )}
          <fetcher.Form
            id="edit-stage-form"
            onSubmit={form.handleSubmit(onFormSubmit)}
          >
            {filterFields.map((field) => (
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
                options={field.options}
                classname="w-full"
              />
            ))}
            <ActionButton
              text="Update Stage"
              type="submit"
              loading={fetcher.state !== "idle"}
              classname="mt-4 w-full rounded-sm border dark:border-darkBlue bg-mainBlue dark:bg-darkBlue/20 text-white"
            />
          </fetcher.Form>
        </div>
      </div>
    </Modal>
  );
}
