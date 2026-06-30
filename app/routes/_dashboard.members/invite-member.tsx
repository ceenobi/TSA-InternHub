import { zodResolver } from "@hookform/resolvers/zod";
import { RiSendPlaneFill, RiUserAddLine } from "@remixicon/react";
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
import { sendInviteCodeSchema } from "~/lib/schemaValidation";
import type { CohortDataType, SendInviteCodeSchemaType } from "~/types";

export default function InviteMember({ cohort }: { cohort: CohortDataType }) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const inviteForm = useForm<SendInviteCodeSchemaType>({
    resolver: zodResolver(sendInviteCodeSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      cohortName: cohort?.cohort ?? "",
      program: cohort?.program ?? undefined,
    },
  });
  const fetcher = useFetcher();
  // const cohortList = useMemo(() => {
  //   if (!Array.isArray(cohort)) return [];
  //   return cohort.map((member: any) => ({
  //     name: member?.cohort,
  //     id: member?.cohort?.toString(),
  //   }));
  // }, [cohort]);

  const filterFields = formFields.filter((field) =>
    ["name", "email", "cohortName", "program"].includes(field.name),
  );

  const actionData = fetcher.data as
    | { success?: boolean; message?: string; body?: any }
    | undefined;

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Invite code sent successfully");
      inviteForm.reset();
      setIsOpen(false);
    }
  }, [actionData, inviteForm]);

  useEffect(() => {
    if (isOpen) {
      fetcher.data = undefined;
    }
  }, [isOpen]);

  const onFormSubmit = (data: SendInviteCodeSchemaType) => {
    fetcher.submit(
      { ...data, intent: "invite-member" },
      {
        method: "post",
        action: "/members",
        encType: "application/json",
      },
    );
  };

  const handleClose = () => {
    fetcher.reset()
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="px-4 h-10 rounded-sm border dark:border-darkBlue bg-mainBlue dark:bg-darkBlue/20 hover:bg-mainBlue/90 hover:dark:bg-darkBlue/30 text-white"
      >
        Invite Member <RiUserAddLine className="ml-1" />
      </Button>
      <Modal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title="Invite Member"
        description="Send an invitation to your cohort."
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
              id="invite-form"
              onSubmit={inviteForm.handleSubmit(onFormSubmit)}
            >
              {filterFields.map((field) => (
                <FormBox
                  key={field.name}
                  label={field.label}
                  type={field.type}
                  placeholder={field.placeholder}
                  id={field.name}
                  register={inviteForm.register}
                  errors={inviteForm.formState.errors}
                  control={inviteForm.control}
                  name={field.name as keyof SendInviteCodeSchemaType}
                  options={field.options}
                  showLabel={false}
                  classname="w-full"
                />
              ))}
              <ActionButton
                text={
                  <>
                    Send Invite
                    <RiSendPlaneFill />
                  </>
                }
                type="submit"
                loading={fetcher.state !== "idle"}
                classname="mt-4 w-full rounded-sm bg-mainBlue dark:bg-darkBlue text-white"
              />
            </fetcher.Form>
          </div>
        </div>
      </Modal>
    </>
  );
}
