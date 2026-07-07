import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Link, useFetcher, useNavigate } from "react-router";
import { toast } from "sonner";
import { signInWithEmail } from "~/.server/action/auth";
import AlertBox from "~/components/provider/alert-box";
import { PageSection } from "~/components/provider/page-wrapper";
import ActionButton from "~/components/ui/action-button";
import { FormBox } from "~/components/ui/formbox";
import { formFields } from "~/lib/constants";
import { signInSchema } from "~/lib/schemaValidation";
import type { SignInSchemaType } from "~/types";
import type { Route } from "./+types/route";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TSA Intern Hub - Account Login" },
    { name: "description", content: `TSA Intern Hub - Account Login` },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  return await signInWithEmail(request, payload as SignInSchemaType);
}

export default function Login() {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const filterFields = formFields.filter((field) =>
    ["email", "password"].includes(field.name),
  );
  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
  } = useForm<SignInSchemaType>({
    resolver: zodResolver(signInSchema),
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
      navigate("/", {
        replace: true,
      });
    }
  }, [actionData]);

  const onFormSubmit: SubmitHandler<SignInSchemaType> = (data) => {
    fetcher.submit(data, {
      method: "post",
      action: "/auth/login",
      encType: "application/json",
    });
  };

  return (
    <PageSection index={0} className="w-full space-y-4 px-8">
      <h1 className="text-[26px] font-medium dark:text-white">
        Welcome <br /> Login to TSA Intern Hub
      </h1>
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
              name={field.name as keyof SignInSchemaType}
              isVisible={isVisible}
              setIsVisible={setIsVisible}
              showLabel={false}
              classname="w-full"
            />
          ))}
          <ActionButton
            text="Continue to Dashboard"
            type="submit"
            loading={isSubmitting}
            classname="rounded-sm w-full border dark:border-darkBlue bg-mainBlue dark:bg-darkBlue/20 text-white hover:bg-mainBlue/90 hover:dark:bg-darkBlue/30"
          />
        </div>
      </fetcher.Form>
      <div className="flex flex-col items-center justify-center gap-2 dark:border-gray-900">
        <p className="text-[13px] text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/auth/register" className="font-normal hover:underline">
            Create an account
          </Link>
        </p>
        <p className="text-[13px] text-muted-foreground">
          <Link
            to="/auth/account-recovery"
            className="font-normal hover:underline"
          >
            Recover account
          </Link>
        </p>
      </div>
    </PageSection>
  );
}
