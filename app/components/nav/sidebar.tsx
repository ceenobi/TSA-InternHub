import { RiToggleFill, RiToggleLine } from "@remixicon/react";
import { NavLink } from "react-router";
import { sidebarLinks } from "~/lib/constants";
import { hasPermission } from "~/lib/rbac";
import { cn } from "~/lib/utils";
import type { UserData } from "~/types";
import Logo from "../ui/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface SidebarProps {
  isOpenSidebar: boolean;
  setIsOpenSidebar: (value: boolean) => void;
  user: UserData;
}

export default function Sidebar({
  isOpenSidebar,
  setIsOpenSidebar,
  user,
}: SidebarProps) {
  const toggleSidebar = () => setIsOpenSidebar(!isOpenSidebar);

  return (
    <aside
      className={cn(
        `hidden lg:flex flex-col bg-darkWhite dark:bg-mainDark top-0 fixed z-50 transition-all duration-300 ease-in-out min-h-svh`,
        isOpenSidebar ? "lg:w-58" : "lg:w-12",
        "dark:bg-linear-to-r/decreasing from-mainBlue/30 to-mainDark",
      )}
    >
      <div
        className={cn(
          "flex items-center z-10 w-full",
          isOpenSidebar ? "px-4 py-3.75" : "justify-center py-4",
        )}
      >
        <Logo
          size={24}
          classname="text-sm dark:text-white"
          showLogoText={isOpenSidebar}
        />
      </div>
      <div className="flex-1 overflow-y-auto pt-1">
        {sidebarLinks
          .filter((s) => {
            if (["/admin-tasks"].includes(s.href as string)) {
              return hasPermission(user.role, "MANAGE_TASKS");
            }
            if (["/tasks"].includes(s.href as string)) {
              return hasPermission(user.role, "MANAGE_TASK");
            }
            return true;
          })
          .map((item) => (
            <div key={item.name || item.title} className="flex flex-col px-1">
              {item.title && isOpenSidebar && (
                <p className="font-medium dark:text-gray-400 px-3 py-2 text-xs uppercase tracking-wider">
                  {item.title}
                </p>
              )}
              {item.children ? (
                item.children.map((child) => (
                  <SidebarLink
                    key={child.name}
                    item={child}
                    isOpenSidebar={isOpenSidebar}
                  />
                ))
              ) : (
                <SidebarLink
                  key={item.name}
                  item={item}
                  isOpenSidebar={isOpenSidebar}
                />
              )}
            </div>
          ))}
      </div>
      <div className="hidden lg:flex items-center justify-start w-full">
        <button
          onClick={toggleSidebar}
          className={cn(
            " hover:dark:text-darkBlue hover:text-darkBlue text-mainBlue dark:text-darkBlue px-2 my-2",
          )}
        >
          {isOpenSidebar ? (
            <RiToggleLine size={24} />
          ) : (
            <RiToggleFill size={24} />
          )}
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({
  item,
  isOpenSidebar,
}: {
  item: any;
  isOpenSidebar: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger className="w-full">
        <NavLink
          to={item.href}
          className={({ isActive }) =>
            cn(
              "transition-all duration-300 ease-in-out w-full p-1.25 flex items-center text-sm capitalize",
              isActive
                ? "bg-mainBlue dark:bg-darkBlue/10 text-white dark:border-l-2 border-darkBlue dark:text-darkBlue"
                : "hover:bg-accentBlack/10 dark:hover:bg-mainBlack hover:dark:bg-darkBlue/5 text-muted-foreground",
              !isOpenSidebar && "justify-center",
            )
          }
          viewTransition
          end={item.href === "/"}
          prefetch="intent"
        >
          <span className="flex items-center gap-2 px-2">
            {item.icon && <item.icon size={18} />}
            <span
              className={cn(
                isOpenSidebar ? "md:block" : "hidden",
                "dark:text-white",
              )}
            >
              {item.name}
            </span>
          </span>
        </NavLink>
      </TooltipTrigger>
      {!isOpenSidebar && (
        <TooltipContent side="right">
          <p className="text-xs">{item.name}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
}
