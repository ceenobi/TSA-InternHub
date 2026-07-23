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

export const middleware = [authenticatedMiddleware];

const SIDEBAR_COOKIE = "sbarTsaInterHub";

export async function loader({ context, request }: Route.LoaderArgs) {
  const { user } = context as unknown as Required<Pick<RouterContext, "user">>;
  const sidebarCookie = request.headers
    .get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith(`${SIDEBAR_COOKIE}=`));
  const sidebarOpen = sidebarCookie
    ? decodeURIComponent(sidebarCookie.split("=")[1]) === "true"
    : false;
  return { user, sidebarOpen };
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  const { user, sidebarOpen } = loaderData;
  const { isOpenSidebar, setIsOpenSidebar } = useSidebar(sidebarOpen);
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
        <main className="relative bg-mainWhite dark:bg-accentBlack shadow py-20 px-4 md:px-4 lg:px-4 min-h-dvh">
          <Outlet context={{ user }} />
        </main>
      </div>
      {user.isOnboarded && <OnboardingTour />}
    </>
  );
}
