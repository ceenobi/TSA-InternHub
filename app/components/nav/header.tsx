import { cn, getTimeOfDay } from "~/lib/utils";
import type { UserData } from "~/types";
import Logo from "../ui/logo";
import Drawer from "./drawer";
import Notification from "./notification";
import Profile from "./profile";

interface headerProps {
  isOpenSidebar: boolean;
  user: UserData;
}

export default function Header({ isOpenSidebar, user }: headerProps) {
  return (
    <header
      suppressHydrationWarning
      className={cn("w-full sticky top-0 z-50 bg-darkWhite dark:bg-accent/5")}
    >
      <div
        className={cn(
          "container mx-auto flex justify-between items-center",
          isOpenSidebar ? "py-[11.1px] px-4 xl:px-12" : "py-3 px-4 xl:px-8",
        )}
      >
        <div className="lg:hidden">
          <Logo classname="text-2xl" />
        </div>
        <h1 className="hidden lg:block truncate text-sm sm:text-base text-mainBlack dark:text-white font-medium tracking-light">
          {getTimeOfDay(user?.name.split(" ")[0])}
        </h1>
        <div className="flex gap-3 lg:gap-2 items-center">
          <Notification />
          <Profile user={user} />
          <Drawer user={user} />
        </div>
      </div>
    </header>
  );
}
