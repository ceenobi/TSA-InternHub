import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useFetcher, useSearchParams, useNavigate } from "react-router";
import { toast } from "sonner";
import AlertBox from "~/components/provider/alert-box";
import { PageSection } from "~/components/provider/page-wrapper";
import ActionButton from "~/components/ui/action-button";
import { FormBox } from "~/components/ui/formbox";
import { formFields } from "~/lib/constants";
import { resetPasswordSchema } from "~/lib/schemaValidation";
import type { ResetPasswordSchemaType } from "~/types";
import type { Route } from "./+types/route";
import { resetPasswordRequest } from "~/.server/action/auth";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TSA Intern Hub - Reset password" },
    { name: "description", content: `TSA Intern Hub - Reset password` },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  return await resetPasswordRequest(request, payload);
}

export default function PasswordReset() {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const filterFields = formFields.filter((field) =>
    ["newPassword"].includes(field.name),
  );
  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
  } = useForm<ResetPasswordSchemaType>({
    resolver: zodResolver(resetPasswordSchema),
  });
  const fetcher = useFetcher();
  const navigate = useNavigate()
  const isSubmitting = fetcher.state === "submitting";

  const actionData = fetcher.data as
    | { success?: boolean; message?: string }
    | undefined;

  useEffect(() => {
    if (actionData?.success === true) {
      toast.success(actionData.message);
      navigate("/auth/login");
    }
  }, [actionData, navigate]);

  const onFormSubmit = (data: ResetPasswordSchemaType) => {
    if (!token) {
      toast.error("Token not provided", {
        id: "passwordReset",
      });
      return;
    }
    fetcher.submit(data, {
      method: "post",
      action: `/auth/password-reset?token=${token}`,
      encType: "application/json",
    });
  };

  return (
    <PageSection index={0} className="px-8 space-y-4">
      <div>
      <h1 className="text-[26px] font-medium dark:text-white">
        Reset Password
      </h1>
      <p className="text-sm text-muted-foreground leading-relaxed">Get started by entering your new password</p>
      </div>
      <fetcher.Form
        action="/auth/login"
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
              name={field.name as keyof ResetPasswordSchemaType}
              isVisible={isVisible}
              setIsVisible={setIsVisible}
              showLabel={false}
              classname="w-full"
            />
          ))}
          <ActionButton
            text="Reset"
            type="submit"
            loading={isSubmitting}
            classname="rounded-sm w-full border dark:border-darkBlue bg-mainBlue dark:bg-darkBlue/20 text-white hover:bg-mainBlue/90 hover:dark:bg-darkBlue/30"
          />
        </div>
      </fetcher.Form>
    </PageSection>
  );
}
