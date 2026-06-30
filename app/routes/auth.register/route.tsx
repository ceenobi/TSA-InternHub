import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Link, useFetcher, useNavigate } from "react-router";
import { toast } from "sonner";
import { signUpWithEmail } from "~/.server/action/auth";
import AlertBox from "~/components/provider/alert-box";
import { PageSection } from "~/components/provider/page-wrapper";
import ActionButton from "~/components/ui/action-button";
import { FormBox } from "~/components/ui/formbox";
import { formFields } from "~/lib/constants";
import { signUpSchema } from "~/lib/schemaValidation";
import type { SignUpSchemaType } from "~/types";
import type { Route } from "../auth.register/+types/route";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TSA InternHub - Account Registration" },
    { name: "description", content: `TSA InternHub - Account Registration` },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  return await signUpWithEmail(request, payload as SignUpSchemaType);
}

export default function Register() {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const filterFields = formFields.filter((field) =>
    ["name", "email", "password", "inviteCode"].includes(field.name),
  );
  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
  } = useForm<SignUpSchemaType>({
    resolver: zodResolver(signUpSchema),
    mode: "all",
  });
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const isSubmitting = fetcher.state === "submitting";
  const actionData = fetcher.data as
    | { success?: boolean; message?: string; email?: string }
    | undefined;

  useEffect(() => {
    if (actionData?.success === true) {
      toast.success(actionData.message);
      navigate("/account/verify-email", {
        replace: true,
        state: {
          email: actionData.email,
        },
      });
    }
  }, [actionData]);

  const onFormSubmit: SubmitHandler<SignUpSchemaType> = async (data) => {
    fetcher.submit(data, {
      method: "post",
      action: "/auth/register",
      encType: "application/json",
    });
  };

  return (
    <PageSection index={0} className="px-8">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">
          Join the <br />
          TSA Intern Hub
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          You have been invited to participate in the exclusive internship
          program. Secure your spot in the next cohort of industry leaders.
        </p>
      </div>
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
      <fetcher.Form
        action="/auth/register"
        onSubmit={handleSubmit(onFormSubmit)}
        className="mt-6"
      >
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
            name={field.name as keyof SignUpSchemaType}
            isVisible={isVisible}
            setIsVisible={setIsVisible}
            showLabel={false}
          />
        ))}
        <ActionButton
          text="Register"
          type="submit"
          loading={isSubmitting}
          classname="mt-1 rounded-sm w-full border dark:border-darkBlue bg-mainBlue dark:bg-darkBlue/20 text-white hover:bg-mainBlue/90 hover:dark:bg-darkBlue/30"
        />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          InviteCode is unique and valid for a single registration session only.
        </p>
      </fetcher.Form>
      <div className="flex items-center justify-center gap-2 mt-4 dark:border-gray-900">
        <p className="text-[13px] text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-normal hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </PageSection>
  );
}
