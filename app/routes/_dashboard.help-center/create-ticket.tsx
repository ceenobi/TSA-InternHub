import { zodResolver } from "@hookform/resolvers/zod";
import { RiAddFill, RiAddLine } from "@remixicon/react";
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
import { ticketFields } from "~/lib/constants";
import { createTicketSchema } from "~/lib/schemaValidation";
import type { CreateTicketSchemaType } from "~/types";

export default function CreateTicket() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const form = useForm({
    resolver: zodResolver(createTicketSchema),
    mode: "onChange",
    defaultValues: {
      priority: "low",
    },
  });
  const fetcher = useFetcher();
  const filterFields = ticketFields.filter((field) =>
    ["title", "description", "category", "priority"].includes(field.name),
  );

  const actionData = fetcher.data as
    | { success?: boolean; message?: string }
    | undefined;

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Ticket created successfully");
      form.reset();
      setIsOpen(false);
    }
  }, [actionData, form]);

  useEffect(() => {
    if (isOpen) {
      fetcher.data = undefined;
    }
  }, [isOpen]);

  const onFormSubmit = (data: CreateTicketSchemaType) => {
    fetcher.submit(
      { ...data, intent: "create-ticket" },
      {
        method: "post",
        action: "/help-center",
        encType: "application/json",
      },
    );
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="px-4 h-10 rounded-sm border dark:border-darkBlue bg-mainBlue dark:bg-darkBlue/20 hover:bg-mainBlue/90 hover:dark:bg-darkBlue/30 text-white"
      >
        Create Ticket <RiAddFill className="ml-1" />
      </Button>
      <Modal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title="Create Ticket"
        description="Have an issue? create a support ticket"
      >
        <Separator />
        <div className="px-2 max-h-[60vh] overflow-y-auto">
          <div className="mb-4 space-y-4">
            {actionData !== undefined && actionData.success === false && (
              <AlertBox
                title="Error"
                description={actionData.message || "Error creating ticket"}
                variant="error"
                onClose={() => fetcher.reset()}
              />
            )}
            <fetcher.Form
              id="new-ticket-form"
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
                  options={(field as any).options}
                  classname="w-full"
                />
              ))}
              <ActionButton
                text={
                  <>
                    Create
                    <RiAddLine />
                  </>
                }
                type="submit"
                loading={fetcher.state !== "idle"}
                classname="mt-2 w-full rounded-sm bg-mainBlue dark:bg-darkBlue/40 hover:bg-mainBlue/90 hover:dark:bg-darkBlue/30 text-white"
              />
            </fetcher.Form>
          </div>
        </div>
      </Modal>
    </>
  );
}
