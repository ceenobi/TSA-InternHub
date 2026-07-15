import { lazy, Suspense } from "react";
import { Outlet } from "react-router";
import Header from "~/components/nav/header";
import Sidebar from "~/components/nav/sidebar";
import { OnboardingTour } from "~/components/provider/onboarding-tour";
import useSidebar from "~/hooks/useSidebar";
import {
  authenticatedMiddleware,
  type RouterContext,
} from "~/middleware/auth.middleware";
import type { Route } from "./+types/route";

const Chatbot = lazy(() => import("~/components/chatbot"));

export const middleware = [authenticatedMiddleware];

export async function loader({ context }: Route.LoaderArgs) {
  const { user } = context as unknown as Required<Pick<RouterContext, "user">>;
  return { user };
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  const { isOpenSidebar, setIsOpenSidebar } = useSidebar();
  const { user } = loaderData;
  return (
    <>
      <Sidebar
        isOpenSidebar={isOpenSidebar}
        setIsOpenSidebar={setIsOpenSidebar}
        user={user}
      />
      <div
        className={`relative min-h-dvh border dark:border-darkBlue/20 shadow ${isOpenSidebar ? "lg:ml-58" : "lg:ml-12"}`}
      >
        <Header isOpenSidebar={isOpenSidebar} user={user} />
        <main className="relative rounded-none bg-mainWhite dark:bg-accentBlack shadow m-1 xl:mr-2 py-20 px-4 h-dvh xl:h-[99dvh] overflow-y-scroll">
          <Outlet context={{ user }} />
        </main>
      </div>
      <Suspense fallback={null}>
        <Chatbot />
      </Suspense>
      {user.isOnboarded && <OnboardingTour />}
    </>
  );
}
