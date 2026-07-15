import { PageSection } from "~/components/provider/page-wrapper";
import type { Route } from "./+types/route";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { getAMemberQuery } from "~/queries/cohorts.server";
import { dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";
import { Await } from "react-router";
import DataError from "~/components/ui/data-error";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  RiCalendarLine,
  RiCheckLine,
  RiCloseLine,
  RiMailLine,
  RiPhoneLine,
  RiUserLine,
  RiVerifiedBadgeLine,
} from "@remixicon/react";
import { getOptimizedImageUrl } from "~/lib/cloudinary";
import { cn } from "~/lib/utils";
import { programLabel } from "~/lib/constants";

export function meta() {
  return [
    { title: "Member Profile | TSA InternHub" },
    {
      name: "description",
      content: "View your member profile.",
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const queryClient = getQueryClientRsc();
  const member = queryClient.ensureQueryData(
    getAMemberQuery(request, params.memberId),
  );
  return {
    dehydratedState: dehydrate(queryClient),
    member,
  };
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

export default function MemberProfile({ loaderData }: Route.ComponentProps) {
  const { member } = loaderData;

  return (
    <PageSection index={1} className="space-y-6">
      <Suspense
        fallback={
          <div className="space-y-6 animate-pulse">
            <div className="h-48 rounded-xl bg-muted" />
            <div className="h-40 rounded-xl bg-muted" />
            <div className="h-40 rounded-xl bg-muted" />
          </div>
        }
      >
        <Await resolve={member} errorElement={<DataError />}>
          {(m) => {
            const initials = m.name?.charAt(0)?.toUpperCase() || "?";
            return (
              <div className="space-y-6">
                {/* Profile Header */}
                <Card className="border rounded-sm dark:bg-muted/30 overflow-hidden">
                  <div className="h-32 bg-linear-to-r from-blue-500/10 via-blue-400/5 to-transparent" />
                  <CardHeader className="relative -mt-12 flex-row items-end gap-4 border-0 pb-0">
                    <Avatar
                      size="lg"
                      className={cn(
                        "size-24 ring-4 ring-background",
                      )}
                    >
                      <AvatarImage src={getOptimizedImageUrl(m.image, 96) || undefined} alt={m.name} />
                      <AvatarFallback className="text-2xl">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="pb-1">
                      <h1 className="text-xl font-bold">{m.name}</h1>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm text-muted-foreground capitalize">
                          {m.role === "user" ? "Member" : m.role}
                        </span>
                        <span className="text-muted-foreground/40">|</span>
                        <span className="text-sm text-muted-foreground">
                          {m.program ? (programLabel[m.program] || m.program) : "N/A"}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <InfoRow
                        icon={<RiMailLine size={16} />}
                        label="Email"
                        value={m.email}
                      />
                      <InfoRow
                        icon={<RiPhoneLine size={16} />}
                        label="Phone"
                        value={m.phone || "Not provided"}
                      />
                      <InfoRow
                        icon={<RiUserLine size={16} />}
                        label="Gender"
                        value={
                          m.gender
                            ? m.gender.charAt(0).toUpperCase() +
                              m.gender.slice(1)
                            : "Not provided"
                        }
                      />
                      <InfoRow
                        icon={<RiCalendarLine size={16} />}
                        label="Cohort"
                        value={m.cohort || "N/A"}
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
                            m.emailVerified
                              ? "text-green-600"
                              : "text-muted-foreground",
                          )}
                        />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Email Verified
                          </p>
                          <p className="text-sm font-medium">
                            {m.emailVerified ? "Yes" : "No"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {m.isSuspended ? (
                          <RiCloseLine size={20} className="text-red-500" />
                        ) : (
                          <RiCheckLine size={20} className="text-green-600" />
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Account Status
                          </p>
                          <p className="text-sm font-medium">
                            {m.isSuspended ? "Suspended" : "Active"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <RiCalendarLine
                          size={20}
                          className="text-muted-foreground"
                        />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Member Since
                          </p>
                          <p className="text-sm font-medium">
                            {m.createdAt
                              ? new Date(m.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )
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
                        variant={m.isOnboarded ? "default" : "secondary"}
                        className={cn(
                          "rounded-sm",
                          m.isOnboarded &&
                            "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
                        )}
                      >
                        {m.isOnboarded ? "Completed" : "Pending"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {m.isOnboarded
                          ? "This member has completed the onboarding process."
                          : "This member has not yet completed onboarding."}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          }}
        </Await>
      </Suspense>
    </PageSection>
  );
}
