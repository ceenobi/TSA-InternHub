import {
  RiContrast2Line,
  RiLogoutBoxRLine,
  RiSunLine,
  RiTv2Line,
  RiUserLine,
} from "@remixicon/react";
import { Form, Link } from "react-router";
import { useIsMobile } from "~/hooks/useMobile";
import { getOptimizedImageUrl } from "~/lib/cloudinary";
import type { UserData } from "~/types";
import { useTheme } from "../provider/theme";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export default function Profile({ user }: { user: UserData }) {
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile({ MOBILE_BREAKPOINT: 1024 });
  const themeIcons = [
    {
      value: "light",
      icon: <RiSunLine />,
    },
    {
      value: "dark",
      icon: <RiContrast2Line />,
    },
    {
      value: "system",
      icon: <RiTv2Line />,
    },
  ] as const;
  const handleThemeToggle = (value: "light" | "dark" | "system") => {
    setTheme(value);
  };

  return (
    <>
      {isMobile ? (
        <Link to="/profile">
          <Button
            variant="ghost"
            className="relative h-8 w-8 p-0 hover:bg-accent rounded-full"
            aria-label="Profile menu"
          >
            {user?.image ? (
              <img
                className="h-8 w-8 object-cover border-2 border-mainBlue transition-colors rounded-full"
                src={getOptimizedImageUrl(user?.image, 40)}
                alt={`${user?.name}'s avatar`}
                rel="noopener noreferrer"
                loading="lazy"
              />
            ) : (
              <span className="w-8 h-8 border-2 border-mainBlue transition-colors flex items-center justify-center rounded-full">
                {user?.name
                  ?.split(" ")
                  .map((name) => name[0])
                  .join("")
                  .toUpperCase()}
              </span>
            )}
          </Button>
        </Link>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="cursor-pointer relative h-8 w-8 p-0 rounded-full border"
                aria-label="Profile menu"
              >
                {user?.image ? (
                  <img
                    className="h-8 w-8 object-cover transition-colors rounded-full"
                    src={getOptimizedImageUrl(user?.image, 40)}
                    alt={`${user?.name}'s avatar`}
                    loading="lazy"
                  />
                ) : (
                  <span className="w-8 h-8 transition-colors border border-mainBlue dark:border-darkBlue flex items-center justify-center rounded-full bg-white dark:bg-black">
                    {user?.name
                      ?.split(" ")
                      .map((name) => name[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                )}
              </Button>
            }
          />
          <DropdownMenuContent className="w-56 rounded-sm" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <h1 className="truncate text-sm font-medium leading-none text-mainBlue dark:text-darkBlue">
                    {user?.name}
                  </h1>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {user?.role}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="rounded-sm flex justify-between items-center py-0">
                <p className="text-sm">Theme</p>
                <div className="flex gap-2">
                  {themeIcons.map((themeIcon) => (
                    <Button
                      key={themeIcon.value}
                      variant={theme === themeIcon.value ? "outline" : "ghost"}
                      size="icon-sm"
                      onClick={() => handleThemeToggle(themeIcon.value)}
                      className="cursor-pointer rounded-sm"
                      aria-label={themeIcon.value}
                    >
                      {themeIcon.icon}
                    </Button>
                  ))}
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuGroup>
              <DropdownMenuItem className="rounded-sm">
                <Link to="/profile" className="flex gap-2 items-center">
                  <RiUserLine className="w-4 h-4" />
                  <span className="text-smcursor-pointer w-auto font-semibold">
                    Profile
                  </span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="rounded-sm">
                <Form
                  action="/logout"
                  method="post"
                  className="flex gap-2 items-center cursor-pointer text-red-500"
                  onClick={(e) => {
                    e.currentTarget.requestSubmit();
                  }}
                >
                  <RiLogoutBoxRLine className="w-4 h-4" />
                  <span className="text-sm cursor-pointer w-auto font-semibold">
                    Logout
                  </span>
                </Form>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}
