import {
  RiCloseCircleLine,
  RiLogoutBoxRFill,
  RiMenuFill,
  RiUserCommunityFill,
} from "@remixicon/react";
import { useState } from "react";
import { Form, NavLink } from "react-router";
import { sidebarLinks } from "~/lib/constants";
import { hasPermission } from "~/lib/rbac";
import type { UserData } from "~/types";
import { Separator } from "../ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

export default function Drawer({ user }: { user: UserData }) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            className="lg:hidden relative w-10 h-10 cursor-pointer flex items-center justify-center"
          >
            <RiMenuFill size={28} />
          </button>
        }
      />
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-white dark:bg-white/2 border border-white/10 dark:backdrop-blur-3xl border-l-0 p-0"
        showCloseButton={false}
        aria-describedby="drawer"
      >
        <div className="relative flex flex-col h-full px-4 py-2">
          <div className="flex justify-between items-center h-12">
            <NavLink to="/" className="flex gap-1 items-center">
              <RiUserCommunityFill className="text-mainPurple" size={28} />
              <span className={`font-semibold text-xl`}> TSA Intern Hub</span>
            </NavLink>
            <SheetClose
              render={
                <button type="button" className="w-10 h-10 cursor-pointer">
                  <RiCloseCircleLine size={30} />
                </button>
              }
            />
          </div>
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

          <div className="flex-1 flex flex-col justify-center">
            <div className="flex flex-col gap-3 uppercase items-center w-full">
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
                  <div
                    key={item.name || item.title}
                    className="flex flex-col w-full items-center"
                  >
                    {item.title && (
                      <p className="font-semibold dark:text-gray-400 py-2 text-xs uppercase tracking-wider">
                        {item.title}
                      </p>
                    )}
                    {item.children ? (
                      item.children.map((child) => (
                        <DrawerLink
                          key={child.name}
                          item={child}
                          setIsOpen={setIsOpen}
                        />
                      ))
                    ) : (
                      <DrawerLink
                        key={item.name}
                        item={item}
                        setIsOpen={setIsOpen}
                      />
                    )}
                  </div>
                ))}
              <Separator />
              <Form
                action="/logout"
                method="post"
                className="flex gap-2 items-center cursor-pointer text-red-500 "
                onClick={(e) => {
                  e.currentTarget.requestSubmit();
                }}
              >
                <RiLogoutBoxRFill className="w-6 h-6" />
                <span className="cursor-pointer w-auto text-lg">Logout</span>
              </Form>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DrawerLink({
  item,
  setIsOpen,
}: {
  item: any;
  setIsOpen: (isOpen: boolean) => void;
}) {
  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        `tracking-widest transition-all duration-300 ease-in-out w-full p-2 flex items-center justify-center gap-2 text-sm font-medium ${
          isActive
            ? "font-bold border-l-4 border-mainBlue dark:border-darkBlue text-mainBlue dark:text-darkBlue"
            : "hover:bg-mainDark/30 text-muted-foreground hover:text-muted-foreground"
        }`
      }
      viewTransition
      end={item.href === "/"}
      prefetch="intent"
      onClick={() => setIsOpen(false)}
    >
      <span className={`flex items-center gap-2 cursor-pointer px-2`}>
        {item.icon && <item.icon size={20} />}
        <span
          className={`text-sm cursor-pointer transition ease-in-out duration-300`}
        >
          {item.name}
        </span>
      </span>
    </NavLink>
  );
}
