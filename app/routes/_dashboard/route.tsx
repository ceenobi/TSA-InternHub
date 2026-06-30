import { Outlet } from "react-router";
import Header from "~/components/nav/header";
import Sidebar from "~/components/nav/sidebar";
import useSidebar from "~/hooks/useSidebar";
import {
  authenticatedMiddleware,
  type RouterContext,
} from "~/middleware/auth.middleware";
import type { Route } from "./+types/route";

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
      <div className={`relative min-h-dvh ${isOpenSidebar ? "lg:ml-62.5" : "lg:ml-12"}`}>
        <Header isOpenSidebar={isOpenSidebar} user={user} />
        <main className="bg-mainWhite dark:bg-mainDark shadow m-1 dark:m-0 py-20 px-4 h-dvh xl:h-[99dvh] overflow-y-auto">
          <Outlet context={{ user }} />
        </main>
        {/*<Footer />*/}
      </div>
    </>
  );
}
