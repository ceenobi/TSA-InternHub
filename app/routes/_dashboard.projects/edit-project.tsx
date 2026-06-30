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
import { formFields } from "~/lib/constants";
import { projectSchema } from "~/lib/schemaValidation";
import type { ProjectData, ProjectSchemaType } from "~/types";

export default function EditProject({
  project,
  isOpen,
  onClose,
}: {
  project: ProjectData;
  isOpen: boolean;
  onClose: () => void;
}) {
  const form = useForm<ProjectSchemaType>({
    resolver: zodResolver(projectSchema),
    mode: "onChange",
    defaultValues: {
      title: project.title,
      description: project.description,
      startDate: project.startDate
        ? new Date(project.startDate).toISOString().split("T")[0]
        : "",
      endDate: project.endDate
        ? new Date(project.endDate).toISOString().split("T")[0]
        : "",
      cohortId: project.cohort._id,
      status: project.status || undefined,
    },
  });
  const fetcher = useFetcher();
  const filterFields = formFields.filter((field) =>
    ["title", "description", "status", "startDate", "endDate"].includes(
      field.name,
    ),
  );

  const actionData = fetcher.data as
    | { success?: boolean; message?: string; body?: any }
    | undefined;

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Project updated successfully");
      form.reset();
      onClose();
    }
  }, [actionData, form]);

  const onFormSubmit = (data: ProjectSchemaType) => {
    fetcher.submit(
      { ...data, intent: "update-project" },
      {
        method: "post",
        action: `/projects?id=${project._id}`,
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
      title={`Edit ${project.title}`}
      description="Update the project details."
    >
      <Separator />
      <div className="px-2 max-h-[60vh] overflow-y-auto">
        <div className="mb-4 space-y-4">
          {actionData !== undefined && actionData.success === false && (
            <AlertBox
              title={"Error"}
              description={actionData.message || "Error sending invite code"}
              variant={"error"}
              onClose={handleClose}
            />
          )}
          <fetcher.Form
            id="new-project-form"
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
                name={field.name as keyof ProjectSchemaType}
                options={field.options}
                classname="w-full"
                disabled={field.disabled}
              />
            ))}
            <ActionButton
              text="Update Project"
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
