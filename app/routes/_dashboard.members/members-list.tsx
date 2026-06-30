import { RiMailLine, RiPhoneLine, RiUserLine } from "@remixicon/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import NotFound from "~/components/ui/not-found";
import { useIsMobile } from "~/hooks/useMobile";
import { cohortStatusColor } from "~/lib/constants";
import type { UserData } from "~/types";
import RenderTable from "./render-table";

type MembersListProps = {
  cohort: {
    cohort: string;
    members: UserData[];
    status: "active" | "inactive";
    _id: string;
  };
  user: UserData;
};

export default function MembersList({ cohort }: MembersListProps) {
  const isMobile = useIsMobile({ MOBILE_BREAKPOINT: 567 });
  return (
    <>
      {!cohort ? (
        <NotFound
          title="No cohort found"
          message="Your cohort is currently empty. Come back later to see your cohort members."
        />
      ) : (
        <Card className="rounded-md dark:bg-muted/30">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{cohort?.cohort}</span>
              <Badge className={cohortStatusColor(cohort?.status)}>
                {cohort?.status}
              </Badge>
            </CardTitle>
            <CardContent className="mt-8 px-0">
              {cohort?.members.length === 0 ? (
                <NotFound
                  title="No cohort members found"
                  message="Your cohort catalog is currently empty. Come back later to see your cohort members."
                />
              ) : (
                <>
                  {isMobile ? (
                    <div className="grid grid-cols-1 gap-4">
                      {cohort.members.map((member) => (
                        <div
                          key={member._id}
                          className="group relative flex items-start gap-4 p-4 rounded-md border border-border/60 bg-background hover:border-mainBlue/30 dark:hover:border-darkBlue/40 hover:shadow-sm dark:bg-muted/20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
                        >
                          <Avatar
                            size="lg"
                            className="size-12 ring-2 ring-border group-hover:ring-mainBlue/30 dark:group-hover:ring-darkBlue/40 transition-all"
                          >
                            <AvatarImage src={member.image} />
                            <AvatarFallback className="bg-mainBlue/10 dark:bg-darkBlue/20 text-mainBlue dark:text-darkBlue font-semibold text-sm">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-sm font-semibold text-foreground">
                                  {member.name}
                                </h3>
                                <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                                  <RiUserLine size={12} />{" "}
                                  {member.gender || "N/A"}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <a
                                href={`mailto:${member.email}`}
                                className="truncate text-xs text-muted-foreground flex items-center gap-2 hover:text-primary transition-colors"
                              >
                                <RiMailLine size={14} />
                                {member.email}
                              </a>
                              {member.phone && (
                                <a
                                  href={`tel:${member.phone}`}
                                  className="text-xs text-muted-foreground flex items-center gap-2 hover:text-primary transition-colors"
                                >
                                  <RiPhoneLine size={14} />
                                  {member.phone}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <RenderTable data={cohort?.members} />
                  )}
                </>
              )}
            </CardContent>
          </CardHeader>
        </Card>
      )}
    </>
  );
}
