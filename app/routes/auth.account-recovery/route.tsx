import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useFetcher } from "react-router";
import { toast } from "sonner";
import { forgotPasswordRequest } from "~/.server/action/auth";
import AlertBox from "~/components/provider/alert-box";
import { PageSection } from "~/components/provider/page-wrapper";
import ActionButton from "~/components/ui/action-button";
import { FormBox } from "~/components/ui/formbox";
import { formFields } from "~/lib/constants";
import { forgotPasswordSchema } from "~/lib/schemaValidation";
import type { ForgotPasswordSchemaType } from "~/types";
import type { Route } from "./+types/route";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TSA Intern Hub - Recover account" },
    { name: "description", content: `TSA Intern Hub - Recover account` },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  return await forgotPasswordRequest(request, payload);
}

export default function ForgotPasswordRoute() {
  const filterFields = formFields.filter((field) =>
    ["email"].includes(field.name),
  );
  const {
    handleSubmit,
    register,
    control,
    reset,
    formState: { errors },
  } = useForm<ForgotPasswordSchemaType>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";

  const actionData = fetcher.data as
    | { success?: boolean; message?: string }
    | undefined;

  useEffect(() => {
    if (actionData?.success === true) {
      toast.success(actionData.message);
      reset({
        email: "",
      });
    }
  }, [actionData]);

  const onFormSubmit = (data: ForgotPasswordSchemaType) => {
    fetcher.submit(data, {
      method: "post",
      action: "/auth/account-recovery",
      encType: "application/json",
    });
  };
  
  return (
    <PageSection index={0} className="space-y-4 px-8">
      <h1 className="text-[26px] font-medium dark:text-white">
        Recover account <br /> Let's get you back in
      </h1>
      <fetcher.Form
        action="/auth/account-recovery"
        onSubmit={handleSubmit(onFormSubmit)}
        className="w-full"
      >
        <div className="max-w-md mx-auto py-2 w-full">
          {actionData && !actionData?.success && (
            <AlertBox
              title="Error"
              description={
                actionData?.message || "An error occurred. Please try again."
              }
              variant="error"
              className="my-3"
            />
          )}
          {filterFields.map((field) => (
            <FormBox
              key={field.name}
              label={field.label}
              type={field.type}
              placeholder={field.placeholder}
              id={field.name}
              register={register}
              control={control}
              errors={errors}
              name={field.name as keyof ForgotPasswordSchemaType}
              showLabel={false}
              classname="w-full"
            />
          ))}
          <ActionButton
            text="Get Reset Link"
            type="submit"
            loading={isSubmitting}
            classname="rounded-sm w-full border dark:border-darkBlue bg-mainBlue dark:bg-darkBlue/20 text-white hover:bg-mainBlue/90 hover:dark:bg-darkBlue/30"
          />
        </div>
      </fetcher.Form>
      <p className="text-[13px] text-center text-muted-foreground">
        Already have an account?{" "}
        <Link to="/auth/login" className="font-normal hover:underline">
          Sign In
        </Link>
      </p>
    </PageSection>
  );
}
