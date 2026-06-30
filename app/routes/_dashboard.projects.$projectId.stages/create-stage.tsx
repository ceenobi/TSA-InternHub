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
import { stageFields } from "~/lib/constants";
import { stageSchema } from "~/lib/schemaValidation";

export default function CreateStage({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const form = useForm({
    resolver: zodResolver(stageSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      passPercentage: 70,
      startDate: "",
      endDate: "",
      lateGraceHours: 24,
      latePenaltyPerDay: 20,
    },
  });
  const fetcher = useFetcher();

  const actionData = fetcher.data as
    | { success?: boolean; message?: string; body?: any }
    | undefined;

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Stage created successfully");
      form.reset();
      setIsOpen(false);
    }
  }, [actionData, form]);

  const onFormSubmit = (data: Record<string, unknown>) => {
    fetcher.submit(
      { ...data, projectId, intent: "create-stage" },
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
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="link"
        className="rounded-sm h-10 text-mainBlue dark:text-mainGold hover:text-mainBlue/90 hover:dark:text-mainGold/90 underline"
      >
        New Stage
      </Button>
      <Modal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title="New Stage"
        description="Create a new stage for this project."
      >
        <Separator />
        <div className="px-2 max-h-[60vh] overflow-y-auto">
          <div className="mb-4 space-y-4">
            {actionData !== undefined && actionData.success === false && (
              <AlertBox
                title={"Error"}
                description={actionData.message || "Error creating stage"}
                variant={"error"}
                onClose={handleClose}
              />
            )}
            <fetcher.Form
              id="new-stage-form"
              onSubmit={form.handleSubmit(onFormSubmit)}
            >
              {stageFields.map((field) => (
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
                text={
                  <>
                    Create Stage
                    <RiAddLine />
                  </>
                }
                type="submit"
                loading={fetcher.state !== "idle"}
                classname="mt-4 w-full rounded-sm  bg-mainBlue dark:bg-darkBlue hover:bg-mainBlue/90 hover:dark:bg-darkBlue/90 text-white"
              />
            </fetcher.Form>
          </div>
        </div>
      </Modal>
    </>
  );
}
