import { RiUserSharedLine } from "@remixicon/react";
import { useNavigate } from "react-router";
import { ThemeToggle } from "~/components/nav/theme-toggle";
import { PageSection, PageWrapper } from "~/components/provider/page-wrapper";
import ActionButton from "~/components/ui/action-button";
import type { Route } from "./+types/delete-account-confirmation";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Account Deleted | TSA InternHub" },
    {
      name: "description",
      content: "Your account has been successfully deleted.",
    },
  ];
}

export default function DeleteAccountConfirmation() {
  const navigate = useNavigate();

  return (
    <PageWrapper className="min-h-dvh flex flex-col justify-center items-center">
      <div className="fixed z-50 top-6 right-6">
        <ThemeToggle />
      </div>

      <PageSection index={0} className="w-full max-w-lg px-6 relative z-10">
        <div className="overflow-hidden bg-muted/30 transition-all duration-500">
          <div className="p-8 sm:p-12 text-center space-y-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-100 dark:border-red-500/20">
                <RiUserSharedLine className="text-red-500 w-12 h-12" />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Account Deleted
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                We're sorry to see you go. Your account and all associated
                personal data have been permanently deleted from our system.
              </p>
            </div>

            <div className="pt-4">
              <ActionButton
                text="Return to Login"
                type="button"
                classname="w-full sm:w-auto px-10 rounded-md font-medium dark:border dark:border-darkBlue bg-mainBlue dark:bg-darkBlue/20 text-white hover:bg-mainBlue/90 transition-all duration-300"
                onClick={() => navigate("/auth/login")}
              />
            </div>
          </div>
        </div>

        {/* Support footer */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          If you have any questions or feedback, please reach out to{" "}
          <a
            href="mailto:support@internhub.com"
            className="font-medium text-mainBlue dark:text-white hover:underline"
          >
            Support
          </a>
          .
        </p>
      </PageSection>
    </PageWrapper>
  );
}
