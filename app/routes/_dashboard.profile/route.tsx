import {
  RiCalendarLine,
  RiCheckLine,
  RiCloseLine,
  RiMailLine,
  RiPhoneLine,
  RiUserLine,
  RiVerifiedBadgeLine,
} from "@remixicon/react";
import { useOutletContext } from "react-router";
import { PageSection, PageWrapper } from "~/components/provider/page-wrapper";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getOptimizedImageUrl } from "~/lib/cloudinary";
import { programLabel } from "~/lib/constants";
import { cn } from "~/lib/utils";
import type { UserData } from "~/types";
import type { Route } from "./+types/route";

export function meta({ matches }: Route.MetaArgs) {
  const { user } = matches[1].loaderData as { user: UserData };
  return [
    { title: `${user.name} | TSA InternHub ` },
    {
      name: "description",
      content: "View your member profile.",
    },
  ];
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

export default function ProfileRoute() {
  const { user } = useOutletContext() as { user: UserData };
  const initials = user.name?.charAt(0)?.toUpperCase() || "?";
  return (
    <PageWrapper>
      <PageSection index={0} className="xl:px-8">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
            Profile
          </h1>
          <p className="text-muted-foreground text-sm">Your information</p>
        </div>
      </PageSection>
      <PageSection index={1} className="mt-8 space-y-8 xl:px-8">
        <div className="space-y-6">
          {/* Profile Header */}
          <Card className="border rounded-sm dark:bg-muted/30 overflow-hidden">
            <div className="h-32 bg-linear-to-r from-blue-500/10 via-blue-400/5 to-transparent" />
            <CardHeader className="relative -mt-12 flex-row items-end gap-4 border-0 pb-0">
              <Avatar
                size="lg"
                className={cn("size-24 ring-4 ring-background")}
              >
                <AvatarImage src={getOptimizedImageUrl(user.image, 96) || undefined} alt={user.name} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h1 className="text-xl font-bold">{user.name}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-muted-foreground capitalize">
                    {user.role === "user" ? "Member" : user.role}
                  </span>
                  <span className="text-muted-foreground/40">|</span>
                  <span className="text-sm text-muted-foreground">
                    {user.program
                      ? programLabel[user.program] || user.program
                      : "N/A"}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <InfoRow
                  icon={<RiMailLine size={16} />}
                  label="Email"
                  value={user.email}
                />
                <InfoRow
                  icon={<RiPhoneLine size={16} />}
                  label="Phone"
                  value={user.phone || "Not provided"}
                />
                <InfoRow
                  icon={<RiUserLine size={16} />}
                  label="Gender"
                  value={
                    user.gender
                      ? user.gender.charAt(0).toUpperCase() +
                        user.gender.slice(1)
                      : "Not provided"
                  }
                />
                <InfoRow
                  icon={<RiCalendarLine size={16} />}
                  label="Cohort"
                  value={user.cohort || "N/A"}
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card className="border rounded-sm dark:bg-muted/30">
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <RiVerifiedBadgeLine
                    size={20}
                    className={cn(
                      user.emailVerified
                        ? "text-green-600"
                        : "text-muted-foreground",
                    )}
                  />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Email Verified
                    </p>
                    <p className="text-sm font-medium">
                      {user.emailVerified ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {user.isSuspended ? (
                    <RiCloseLine size={20} className="text-red-500" />
                  ) : (
                    <RiCheckLine size={20} className="text-green-600" />
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Account Status
                    </p>
                    <p className="text-sm font-medium">
                      {user.isSuspended ? "Suspended" : "Active"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RiCalendarLine size={20} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Member Since
                    </p>
                    <p className="text-sm font-medium">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Onboarding Status */}
          <Card className="border rounded-sm dark:bg-muted/30">
            <CardHeader>
              <CardTitle>Onboarding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Badge
                  variant={user.isOnboarded ? "default" : "secondary"}
                  className={cn(
                    "rounded-sm",
                    user.isOnboarded &&
                      "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
                  )}
                >
                  {user.isOnboarded ? "Completed" : "Pending"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {user.isOnboarded
                    ? "This member has completed the onboarding process."
                    : "This member has not yet completed onboarding."}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageSection>
    </PageWrapper>
  );
}
