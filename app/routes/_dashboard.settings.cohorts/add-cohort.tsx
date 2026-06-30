import { zodResolver } from "@hookform/resolvers/zod";
import { RiTeamLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import Search from "~/components/nav/search";
import AlertBox from "~/components/provider/alert-box";
import ActionButton from "~/components/ui/action-button";
import { Button } from "~/components/ui/button";
import { FormBox } from "~/components/ui/formbox";
import Modal from "~/components/ui/modal";
import { Separator } from "~/components/ui/separator";
import { formFields } from "~/lib/constants";
import { cohortSchema } from "~/lib/schemaValidation";
import type { CohortSchemaType } from "~/types";

export default function AddCohort() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const cohortForm = useForm<CohortSchemaType>({
    resolver: zodResolver(cohortSchema),
    mode: "onChange",
  });
  const fetcher = useFetcher();
  const filterFields = formFields.filter((field) =>
    ["cohort", "program"].includes(field.name),
  );

  const actionData = fetcher.data as
    | { success?: boolean; message?: string; body?: any }
    | undefined;

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Cohort added successfully");
      setIsOpen(false);
    }
  }, [actionData]);

  const onFormSubmit = (data: CohortSchemaType) => {
    fetcher.submit(
      { ...data, intent: "add-cohort" },
      {
        method: "post",
        action: "/settings/cohorts",
        encType: "application/json",
      },
    );
  };

  const handleClose = () => {
    cohortForm.reset({
      cohort: "",
      program: undefined,
    });
    fetcher.data = undefined;
  };

  return (
    <>
      <div className="flex justify-between items-center gap-4">
        <Search id="cohort-search" placeholder="Search cohorts by name..." />
        <Button
          className="border dark:border-darkBlue bg-mainBlue hover:bg-mainBlue/90 dark:bg-darkBlue/20 text-white px-4 py-2 rounded-sm"
          onClick={() => setIsOpen(true)}
        >
          Add Cohort <RiTeamLine className="ml-1" />
        </Button>
      </div>

      <Modal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title="Create a Cohort"
        description="Add a new cohort to the database."
      >
        <Separator />
        <div className="px-2">
          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {actionData !== undefined && actionData.success === false && (
              <AlertBox
                title={"Error"}
                description={actionData.message || "Error sending invite code"}
                variant={"error"}
                onClose={handleClose}
              />
            )}
            <fetcher.Form
              id="cohort-form"
              onSubmit={cohortForm.handleSubmit(onFormSubmit)}
            >
              {filterFields.map((field) => (
                <FormBox
                  label={field.label}
                  type={field.type}
                  placeholder={field.placeholder}
                  id={field.name}
                  register={cohortForm.register}
                  control={cohortForm.control}
                  errors={cohortForm.formState.errors}
                  name={field.name as keyof CohortSchemaType}
                  options={field.options}
                  showLabel={false}
                />
              ))}
              <ActionButton
                text="Create Cohort"
                type="submit"
                loading={fetcher.state !== "idle"}
                classname="mt-2 w-full rounded-md border dark:border-darkBlue bg-mainBlue dark:bg-darkBlue/20 text-white font-semibold capitalize"
              />
            </fetcher.Form>
          </div>
        </div>
      </Modal>
    </>
  );
}
