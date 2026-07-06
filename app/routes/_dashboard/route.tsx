import { Outlet } from "react-router";
import Header from "~/components/nav/header";
import Sidebar from "~/components/nav/sidebar";
import Chatbot from "~/components/chatbot";
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
      <div
        className={`relative min-h-dvh ${isOpenSidebar ? "lg:ml-58" : "lg:ml-12"}`}
      >
        <Header isOpenSidebar={isOpenSidebar} user={user} />
         <div className="absolute inset-0 z-0 opacity-20 h-full w-full bg-white dark:bg-accentBlack/5 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff14_1px,transparent_1px),linear-gradient(to_bottom,#ffffff14_1px,transparent_1px)] bg-size-[6rem_4rem]" />
        <main className="relative bg-mainWhite dark:bg-mainDark shadow m-1 dark:m-0 py-20 px-4 h-dvh xl:h-[99dvh] overflow-y-scroll">
          <Outlet context={{ user }} />
        </main>
        {/*<Footer />*/}
      </div>
      <Chatbot />
    </>
  );
}
