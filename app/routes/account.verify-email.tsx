import {
  RiCheckboxCircleFill,
  RiMailSendFill,
  RiSpam2Fill,
} from "@remixicon/react";
import { useEffect, useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import { resendVerifyEmail } from "~/.server/action/auth";
import { ThemeToggle } from "~/components/nav/theme-toggle";
import AlertBox from "~/components/provider/alert-box";
import { PageSection, PageWrapper } from "~/components/provider/page-wrapper";
import ActionButton from "~/components/ui/action-button";
import {
  sessionMiddleware,
  type RouterContext,
} from "~/middleware/auth.middleware";
import type { Route } from "./+types/route";

export const middleware = [sessionMiddleware];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Verify Your Email | InternHub" },
    {
      name: "description",
      content: "Complete your registration by verifying your email address.",
    },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  return await resendVerifyEmail(request, payload as { email: string });
}

export async function loader({ context }: Route.LoaderArgs) {
  const { user } = context as unknown as Required<Pick<RouterContext, "user">>;
  return { user };
}

export default function VerifyEmail({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";
  const actionData = fetcher.data as
    | { success?: boolean; message?: string; email?: string }
    | undefined;

  useEffect(() => {
    if (actionData) setShowAlert(true);
  }, [actionData]);

  const onSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const data = { email: user.email };
    fetcher.submit(data, {
      method: "post",
      action: "/account/verify-email",
      encType: "application/json",
    });
  };

  return (
    <PageWrapper className="min-h-dvh flex flex-col justify-center items-center">
      <div className="fixed z-50 top-6 right-6">
        <ThemeToggle />
      </div>

      <PageSection index={0} className="w-full max-w-lg px-6 relative z-10">
        <div className="overflow-hidden transition-all duration-500">
          {user?.emailVerified ? (
            <div className="p-8 sm:p-12 text-center space-y-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full animate-pulse" />
                <div className="relative w-24 h-24 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-100 dark:border-green-500/20">
                  <RiCheckboxCircleFill className="text-green-500 w-12 h-12" />
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Verification Successful!
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400">
                  Welcome aboard{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-200">
                    {user?.name}
                  </span>
                  . Your account is now fully active.
                </p>
              </div>

              <div className="pt-4">
                <ActionButton
                  text="Go to Dashboard"
                  type="button"
                  classname="w-full sm:w-auto px-10 rounded-md font-medium dark:border dark:border-darkBlue bg-mainBlue dark:bg-darkBlue/20 text-white hover:bg-mainBlue/90 transition-all duration-300"
                  onClick={() => navigate("/")}
                />
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Status Banner */}
              <div className="px-6 py-3 flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Action Required
                </span>
              </div>

              <div className="p-8 sm:px-12 space-y-8">
                {/* Alert Handling */}
                <div className="min-h-10">
                  {actionData !== undefined && showAlert && (
                    <div className="transform transition-all duration-300 animate-in fade-in slide-in-from-top-4">
                      <AlertBox
                        title={
                          actionData.success
                            ? "Verification Sent"
                            : "Request Failed"
                        }
                        description={actionData.message || ""}
                        variant={actionData?.success ? "success" : "error"}
                        onClose={() => setShowAlert(false)}
                      />
                    </div>
                  )}
                </div>

                <div className="text-center space-y-6">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-accentBlack/10 blur-xl rounded-full" />
                    <div className="relative w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl rotate-12 flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-500/20">
                      <RiMailSendFill className="text-indigo-600 dark:text-indigo-400 w-10 h-10 -rotate-12" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Verify your email
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                      We've sent a verification link to <br />
                      <span className="font-medium text-slate-900 dark:text-slate-200">
                        {user?.email}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border dark:border-mainGold dark:bg-mainGold/20 rounded-md p-6 space-y-4">
                  <div className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-md bg-white dark:bg-transparent border border-slate-200 dark:border-mainGold flex items-center justify-center">
                      <RiSpam2Fill size={20} className="dark:text-white" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                        Can't find the email?
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Check your spam folder or try resending the link below.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <ActionButton
                    text={
                      isSubmitting
                        ? "Sending Link..."
                        : "Resend Verification Email"
                    }
                    type="submit"
                    onClick={onSubmit}
                    loading={isSubmitting}
                    classname="w-full py-5 rounded-md font-bold border border-mainBlue bg-mainBlue dark:bg-darkBlue/40 text-white hover:bg-mainBlue/90 transition-all duration-300"
                  />
                  <button
                    onClick={() => navigate("/auth/login")}
                    className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:underline transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Support footer */}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Need help?{" "}
          <a
            href="mailto:support@internhub.com"
            className="font-medium text-mainBlue dark:text-white hover:underline"
          >
            Contact Support
          </a>
        </p>
      </PageSection>
    </PageWrapper>
  );
}
