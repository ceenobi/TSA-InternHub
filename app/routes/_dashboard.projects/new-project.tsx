import { zodResolver } from "@hookform/resolvers/zod";
import { RiAddLine } from "@remixicon/react";
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
import { formFields } from "~/lib/constants";
import { projectSchema } from "~/lib/schemaValidation";
import type { CohortDataType, ProjectSchemaType } from "~/types";

export default function NewProject({ cohorts }: { cohorts: CohortDataType }) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const form = useForm<ProjectSchemaType>({
    resolver: zodResolver(projectSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      cohortId: cohorts?._id ?? "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    },
  });
  const fetcher = useFetcher();
  const filterFields = formFields.filter((field) =>
    ["title", "description", "startDate", "endDate"].includes(field.name),
  );

  const actionData = fetcher.data as
    { success?: boolean; message?: string; body?: any } | undefined;

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Project created successfully");
      form.reset();
      setIsOpen(false);
    }
  }, [actionData, form]);

  useEffect(() => {
    if (isOpen) {
      fetcher.data = undefined;
    }
  }, [isOpen]);

  const onFormSubmit = (data: ProjectSchemaType) => {
    fetcher.submit(
      { ...data, intent: "create-project" },
      {
        method: "post",
        action: "/projects",
        encType: "application/json",
      },
    );
  };

  const handleClose = () => {
    fetcher.reset();
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="px-4 h-10 rounded-sm border dark:border-darkBlue bg-mainBlue dark:bg-darkBlue/20 hover:bg-mainBlue/90 hover:dark:bg-darkBlue/30 text-white"
      >
        New Project <RiAddLine className="ml-1" />
      </Button>
      <Modal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title="New Project"
        description="Create a new project. You must have an active cohort created."
      >
        <Separator />
        <div className="px-2">
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
              <input
                type="hidden"
                value={cohorts?._id}
                disabled
                {...form.register("cohortId")}
              />
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
                text={
                  <>
                    Create Project
                    <RiAddLine />
                  </>
                }
                type="submit"
                loading={fetcher.state !== "idle"}
                classname="mt-2 w-full rounded-sm  bg-mainBlue dark:bg-darkBlue/40 hover:bg-mainBlue/90 hover:dark:bg-darkBlue/30 text-white"
              />
            </fetcher.Form>
          </div>
        </div>
      </Modal>
    </>
  );
}
