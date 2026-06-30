import { zodResolver } from "@hookform/resolvers/zod";
import { RiUserAddLine } from "@remixicon/react";
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
import { adminInviteSchema } from "~/lib/schemaValidation";
import type { AdminInviteSchemaType } from "~/types";

export default function InviteStaff() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const inviteForm = useForm<AdminInviteSchemaType>({
    resolver: zodResolver(adminInviteSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      program: undefined,
    },
  });
  const fetcher = useFetcher();
  const filterFields = formFields.filter((field) =>
    ["name", "email", "program"].includes(field.name),
  );

  const actionData = fetcher.data as
    | { success?: boolean; message?: string; body?: any }
    | undefined;

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Admin added successfully");
      setIsOpen(false);
    }
  }, [actionData]);

  const onFormSubmit = (data: AdminInviteSchemaType) => {
    fetcher.submit(
      { ...data, intent: "admin-invite" },
      {
        method: "post",
        action: "/settings/staff",
        encType: "application/json",
      },
    );
  };

  const handleClose = () => {
    inviteForm.reset();
    fetcher.data = undefined;
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="px-4 h-10 rounded-sm border dark:border-darkBlue bg-mainBlue dark:bg-darkBlue/20 hover:bg-mainBlue/90 hover:dark:bg-darkBlue/30 text-white"
      >
        Add Staff <RiUserAddLine className="ml-1" />
      </Button>
      <Modal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title="Register Staff"
        description="Add a new staff member to the portal."
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
                  name={field.name as keyof AdminInviteSchemaType}
                  options={field.options}
                  showLabel={false}
                  classname="w-full"
                />
              ))}
              <ActionButton
                text={
                  <>
                    Add Staff
                    <RiUserAddLine className="ml-1" />
                  </>
                }
                type="submit"
                loading={fetcher.state !== "idle"}
                classname="mt-4 w-full rounded-sm border dark:border-darkBlue bg-mainBlue dark:bg-darkBlue/20 text-white"
              />
            </fetcher.Form>
          </div>
        </div>
      </Modal>
    </>
  );
}
