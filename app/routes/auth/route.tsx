import { Outlet } from "react-router";
import { ThemeToggle } from "~/components/nav/theme-toggle";
import { PageWrapper } from "~/components/provider/page-wrapper";
import Logo from "~/components/ui/logo";
import { guestOnlyMiddleware } from "~/middleware/auth.middleware";

export const middleware = [guestOnlyMiddleware];

export default function AuthLayout() {
  return (
    <>
      <div className="fixed z-30 top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 z-0 opacity-30 h-full w-full bg-white dark:bg-accentBlack/5 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff14_1px,transparent_1px),linear-gradient(to_bottom,#ffffff14_1px,transparent_1px)] bg-size-[6rem_4rem]" />
      <div className="min-h-dvh">
        <PageWrapper className="py-20 px-4 space-y-8 flex flex-col justify-center items-center">
          <Logo classname="relative z-20" />
          <section className="relative z-20 shadow bg-white dark:bg-muted w-full sm:max-w-sm mx-auto rounded-md border py-8">
            <Outlet />
          </section>
        </PageWrapper>
      </div>
    </>
  );
}
