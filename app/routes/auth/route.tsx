import { Outlet } from "react-router";
import { ThemeToggle } from "~/components/nav/theme-toggle";
import { PageWrapper } from "~/components/provider/page-wrapper";
import Logo from "~/components/ui/logo";
import { guestOnlyMiddleware } from "~/middleware/auth.middleware";

export const middleware = [guestOnlyMiddleware];

export default function AuthLayout() {
  return (
    <div className="relative">
      <div className="fixed w-full z-30 top-0 py-2 px-4 flex justify-between bg-mainWhite dark:bg-background">
        <Logo classname="relative z-20" size={30} />
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 min-h-auto w-full bg-mainWhite dark:bg-background bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff14_1px,transparent_1px),linear-gradient(to_bottom,#ffffff14_1px,transparent_1px)] bg-size-[6rem_4rem]" />
      <div className="min-h-dvh flex flex-col items-center justify-center">
        <PageWrapper className="py-20 px-4 space-y-6 flex flex-col justify-center items-center">
          <section className="relative z-20 shadow bg-white dark:bg-accentBlack/90 w-full sm:max-w-sm mx-auto rounded-md border py-8">
            <Outlet />
          </section>
          <div className="absolute bottom-4 flex justify-center items-center">
            <p className="text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} TSA LABS. All rights reserved.
            </p>
          </div>
        </PageWrapper>
      </div>
    </div>
  );
}
