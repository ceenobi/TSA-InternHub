import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Outlet,
  useFetcher,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router";
import {
  updatePasswordRequest,
  updateProfileRequest,
} from "~/.server/action/auth";
import AlertBox from "~/components/provider/alert-box";
import { PageSection, PageWrapper } from "~/components/provider/page-wrapper";
import ActionButton from "~/components/ui/action-button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { FormBox } from "~/components/ui/formbox";
import { formFields } from "~/lib/constants";
import { hasPermission } from "~/lib/rbac";
import {
  changePasswordSchema,
  updateProfileSchema,
} from "~/lib/schemaValidation";
import { cn } from "~/lib/utils";
import type {
  ChangePasswordSchemaType,
  UpdateProfileSchemaType,
  UserData,
} from "~/types";
import type { Route } from "../_dashboard.settings/+types/route";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Profile Settings | TSA InternHub" },
    {
      name: "description",
      content: "Manage your profile settings and session management.",
    },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  if (payload.intent === "update-profile") {
    return await updateProfileRequest(request, payload);
  }
  if (payload.intent === "update-password") {
    return await updatePasswordRequest(request, payload);
  }
}

export default function Settings() {
  const [step, setStep] = useState<number>(1);
  const [activeForm, setActiveForm] = useState<
    "profile-form" | "password-form"
  >("profile-form");
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const { user } = useOutletContext() as { user: UserData };
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const location = useLocation();

  const profileForm = useForm<UpdateProfileSchemaType>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name,
      phone: user?.phone,
      gender: (user?.gender as "male" | "female" | "other") || "",
    },
    mode: "onChange",
  });

  const passwordForm = useForm<ChangePasswordSchemaType>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });
  const currentPath = location.pathname === "/settings";
  const actionData = fetcher.data as
    | { success?: boolean; message?: string; body?: any }
    | undefined;

  const isProfileDirty =
    Object.keys(profileForm.formState.dirtyFields).length > 0;
  const isPasswordDirty =
    Object.keys(passwordForm.formState.dirtyFields).length > 0;
  const isDirty =
    activeForm === "profile-form" ? isProfileDirty : isPasswordDirty;

  const filterProfileFields = formFields.filter((field) =>
    ["name", "phone", "gender"].includes(field.name),
  );
  const filterPasswordFields = formFields.filter((field) =>
    ["currentPassword", "newPassword", "confirmPassword"].includes(field.name),
  );

  useEffect(() => {
    if (actionData?.success) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setShowAlert(true);
      if (activeForm === "password-form") {
        passwordForm.reset();
      }
    }
  }, [actionData]);

  const onFormSubmit = (
    data: UpdateProfileSchemaType | ChangePasswordSchemaType,
  ) => {
    const formData =
      activeForm === "profile-form"
        ? { ...data, intent: "update-profile" }
        : { ...data, intent: "update-password" };
    fetcher.submit(formData, {
      method: "post",
      action: "/settings",
      encType: "application/json",
    });
  };

  return (
    <PageWrapper>
      <PageSection index={0} className="space-y-8 xl:px-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
              Settings
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage your account settings, cohorts, staff and preferences.
            </p>
          </div>
          {step === 1 && currentPath && (
            <ActionButton
              text="Save changes"
              type="submit"
              form={activeForm}
              disabled={!isDirty || fetcher.state !== "idle"}
              loading={fetcher.state !== "idle"}
              classname="hidden md:flex rounded-sm border dark:border-darkBlue bg-mainBlue hover:bg-mainBlue/90 dark:bg-darkBlue/20 text-white min-w-37.5"
            />
          )}
        </div>
        {actionData !== undefined && showAlert && (
          <AlertBox
            title={actionData.success ? "Success" : "Error"}
            description={actionData.message || ""}
            variant={actionData?.success ? "success" : "error"}
            onClose={() => setShowAlert(false)}
          />
        )}
        <div className="flex gap-4 md:gap-8 mb-8 border-b w-full">
          {["Profile", "Security", "Cohorts", "Staff"]
            .filter((s) => {
              if (["Cohorts", "Staff"].includes(s)) {
                return hasPermission(user.role, "MANAGE_COHORTS");
              }
              return true;
            })
            .map((s, i) => (
              <button
                key={s}
                onClick={
                  ["Security", "Cohorts", "Staff"].includes(s)
                    ? () => {
                        navigate(`/settings/${s.toLowerCase()}`);
                        setStep(i + 1);
                      }
                    : () => {
                        navigate(`/settings`);
                        setStep(i + 1);
                      }
                }
                className={cn(
                  "py-2 font-bold text-sm border-b-2 transition-colors duration-300 ease-in-out truncate",
                  location.pathname === `/settings/${s.toLowerCase()}` ||
                    (location.pathname === "/settings" &&
                      ((s === "Profile" && step === 1) ||
                        (s === "Security" && step === 2)))
                    ? "border-mainBlue dark:border-darkBlue text-mainBlue dark:text-darkBlue"
                    : "border-transparent text-muted-foreground hover:border-mainBlue/40 dark:hover:border-darkBlue/40",
                )}
              >
                {s}
              </button>
            ))}
        </div>
        {currentPath ? (
          <>
            {step === 1 && (
              <>
                <PageSection index={1} className="space-y-6">
                  <Card
                    onClick={() => setActiveForm("profile-form")}
                    className="border rounded-sm dark:bg-muted/30"
                  >
                    <CardHeader>
                      <CardTitle>Profile Details</CardTitle>
                      <CardDescription>
                        <fetcher.Form
                          id="profile-form"
                          onSubmit={profileForm.handleSubmit(onFormSubmit)}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            {filterProfileFields.map((field) => (
                              <FormBox
                                key={field.name}
                                label={field.label}
                                type={field.type}
                                placeholder={field.placeholder}
                                id={field.name}
                                register={profileForm.register}
                                control={profileForm.control}
                                errors={profileForm.formState.errors}
                                name={
                                  field.name as keyof UpdateProfileSchemaType
                                }
                                classname={cn(
                                  field.type === "checkbox" && "mt-8",
                                )}
                                options={field.options}
                              />
                            ))}
                            <div>
                              <h1 className="text-xs font-medium dark:text-white/80">
                                Email
                              </h1>
                              <p>{user.email}</p>
                            </div>
                            <div>
                              <h1 className="text-xs font-medium dark:text-white/80">
                                Role
                              </h1>
                              <p>{user.role}</p>
                            </div>
                            <div>
                              <h1 className="text-xs font-medium dark:text-white/80">
                                Cohort
                              </h1>
                              <p>{user.cohort || "N/A"}</p>
                            </div>
                          </div>
                        </fetcher.Form>
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card
                    className="border rounded-sm dark:bg-muted/30"
                    onClick={() => setActiveForm("password-form")}
                  >
                    <CardHeader>
                      <CardTitle>Update Password</CardTitle>
                      <CardDescription>
                        <fetcher.Form
                          id="password-form"
                          onSubmit={passwordForm.handleSubmit(onFormSubmit)}
                        >
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            {filterPasswordFields.map((field) => (
                              <FormBox
                                key={field.name}
                                label={field.label}
                                type={field.type}
                                placeholder={field.placeholder}
                                id={field.name}
                                register={passwordForm.register}
                                control={passwordForm.control}
                                errors={passwordForm.formState.errors}
                                name={
                                  field.name as keyof ChangePasswordSchemaType
                                }
                                isVisible={isVisible}
                                setIsVisible={setIsVisible}
                                showLabel={false}
                              />
                            ))}
                          </div>
                        </fetcher.Form>
                        <p className="text-[11px] font-medium text-muted-foreground">
                          Updating your password will log you out of all your
                          sessions.
                        </p>
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </PageSection>
              </>
            )}
          </>
        ) : (
          <Outlet context={{ user }} />
        )}
        {step === 1 && currentPath && (
          <div className="flex justify-end">
            <ActionButton
              text="Save changes"
              type="submit"
              form={activeForm}
              disabled={!isDirty || fetcher.state !== "idle"}
              loading={fetcher.state !== "idle"}
              classname="md:hidden rounded-sm border dark:border-darkBlue bg-mainBlue dark:bg-darkBlue/20 text-white min-w-37.5"
            />
          </div>
        )}
      </PageSection>
    </PageWrapper>
  );
}
