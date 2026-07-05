import {
  RiLoaderLine,
  RiMailLine,
  RiMoreLine,
  RiPhoneLine,
  RiShieldUserLine,
  RiUserLine,
  RiVerifiedBadgeFill,
} from "@remixicon/react";
import { useEffect, useState } from "react";
import { getOptimizedImageUrl } from "~/lib/cloudinary";
import { useFetcher } from "react-router";
import AlertBox from "~/components/provider/alert-box";
import { CanPermit } from "~/components/provider/rbac-permit";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { canModifyRole } from "~/lib/constants";
import { cn, getInitials } from "~/lib/utils";
import type { UserData } from "~/types";

const roleMeta: Record<string, { label: string; className: string }> = {
  super_admin: {
    label: "Super Admin",
    className:
      "border-violet-500/30 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  },
  admin: {
    label: "Admin",
    className:
      "border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  },
  user: {
    label: "User",
    className:
      "border-gray-400/30 bg-gray-50 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400",
  },
};

const programLabel: Record<string, string> = {
  "full-stack": "Full Stack",
  "product-design": "Product Design",
  "data-analysis": "Data Analysis",
  "cyber-security": "Cyber Security",
};

export default function StaffCard({
  coordinators,
  user,
  index,
}: {
  coordinators: UserData;
  user: UserData;
  index: number;
}) {
  const role = roleMeta[coordinators.role] ?? roleMeta.user;
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const fetcher = useFetcher();
  const actionData = fetcher.data as
    | { success?: boolean; message?: string; body?: any }
    | undefined;

  useEffect(() => {
    if (actionData?.success) {
      setShowAlert(true);
    }
  }, [actionData]);

  const isLoading = fetcher.state === "submitting";

  const handleRoleChange = (role: string, id: string) => {
    fetcher.submit(
      {
        role,
        id,
        intent: "update-role",
      },
      {
        method: "post",
        action: "/settings/staff",
        encType: "application/json",
      },
    );
  };

  return (
    <>
      {actionData !== undefined && showAlert && (
        <AlertBox
          title={actionData.success ? "Success" : "Error"}
          description={actionData.message || ""}
          variant={actionData?.success ? "success" : "error"}
          onClose={() => setShowAlert(false)}
          className="my-4"
        />
      )}
      <div
        className="group relative flex flex-col gap-4 p-5 rounded-md border border-border/60 bg-background hover:border-mainBlue/30 dark:hover:border-darkBlue/40 hover:shadow-sm dark:bg-muted/20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-start gap-4">
            <Avatar
              size="lg"
              className="size-12 ring-2 ring-border group-hover:ring-mainBlue/30 dark:group-hover:ring-darkBlue/40 transition-all"
            >
              <AvatarImage src={getOptimizedImageUrl(coordinators.image, 48)} alt={coordinators.name} />
              <AvatarFallback className="bg-mainBlue/10 dark:bg-darkBlue/20 text-mainBlue dark:text-darkBlue font-semibold text-sm">
                {getInitials(coordinators.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-semibold text-sm text-foreground truncate">
                  {coordinators.name}
                </h2>
                {coordinators.emailVerified && (
                  <RiVerifiedBadgeFill
                    size={14}
                    className="text-mainBlue dark:text-darkBlue shrink-0"
                  />
                )}
              </div>

              <Badge
                className={cn(
                  "mt-1 text-[10px] font-semibold px-2 py-0.5 h-auto rounded-full border",
                  role.className,
                )}
              >
                <RiShieldUserLine size={10} className="mr-1" />
                {role.label}
              </Badge>
            </div>
          </div>
          <CanPermit user={user} permission="MANAGE_ROLES">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" title="Manage Role">
                    <RiMoreLine size={20} />
                  </Button>
                }
              />
              <DropdownMenuContent className="rounded-sm">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Manage Role</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={coordinators.role === "admin"}
                    onClick={() => handleRoleChange("admin", coordinators._id)}
                    disabled={!canModifyRole(user, "admin", coordinators)}
                    className="cursor-pointer"
                  >
                    {isLoading && coordinators.role === "admin" && (
                      <RiLoaderLine className="animate-spin" />
                    )}{" "}
                    Admin
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={coordinators.role === "super_admin"}
                    onClick={() =>
                      handleRoleChange("super_admin", coordinators._id)
                    }
                    disabled={!canModifyRole(user, "super_admin", coordinators)}
                    className="cursor-pointer"
                  >
                    {isLoading && coordinators.role === "super_admin" && (
                      <RiLoaderLine className="animate-spin" />
                    )}{" "}
                    Super Admin
                  </DropdownMenuCheckboxItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </CanPermit>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50" />

        {/* Details */}
        <div className="flex flex-col gap-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md bg-muted/60 border border-border/50">
              <RiMailLine size={12} />
            </div>
            <a href={`mailto:${coordinators.email}`} className="truncate">
              {coordinators.email}
            </a>
          </div>

          {coordinators.phone && (
            <div className="flex items-center gap-2">
              <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md bg-muted/60 border border-border/50">
                <RiPhoneLine size={12} />
              </div>
              <a href={`tel:${coordinators.phone}`}>{coordinators.phone}</a>
            </div>
          )}

          {coordinators.cohort && (
            <div className="flex items-center gap-2">
              <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md bg-muted/60 border border-border/50">
                <RiUserLine size={12} />
              </div>
              <span className="truncate">
                {programLabel[coordinators.cohort] ?? coordinators.cohort}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
