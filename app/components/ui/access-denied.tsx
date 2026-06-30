import { RiLockFill } from "@remixicon/react";
import { Card, CardContent } from "~/components/ui/card";

export default function AccessDenied() {
  return (
    <Card className="rounded-sm dark:bg-muted/30">
      <CardContent className="flex flex-col items-center gap-2">
        <RiLockFill className="h-8 w-8 dark:text-yellow-500" />
        <p className="text-sm text-muted-foreground text-center">
          You do not have permission to view this tab
        </p>
      </CardContent>
    </Card>
  );
}
