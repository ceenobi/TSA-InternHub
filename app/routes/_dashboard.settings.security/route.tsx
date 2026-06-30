import {
  RiAlertFill,
  RiInformationFill,
  RiMacbookLine,
  RiMapPinLine,
  RiSmartphoneLine,
  RiTimeLine,
} from "@remixicon/react";
import { useEffect, useState } from "react";
import { useFetcher, useOutletContext } from "react-router";
import {
  listUserSessions,
  requestDeleteAccount,
  revokeUserSession,
} from "~/.server/action/auth";
import { auth } from "~/.server/services/better-auth";
import AlertBox from "~/components/provider/alert-box";
import { PageSection } from "~/components/provider/page-wrapper";
import ActionButton from "~/components/ui/action-button";
import { Alert, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { UserData } from "~/types";
import type { Route } from "../_dashboard.settings.security/+types/route";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Security Settings | TSA InternHub" },
    {
      name: "description",
      content: "Manage your security settings and session management.",
    },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  if (payload.intent === "revoke-session") {
    return await revokeUserSession(request, { token: payload.token });
  }
  if (payload.intent === "delete-account") {
    return await requestDeleteAccount(request);
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const [sessionsResponse, currentSessionResponse] = await Promise.all([
    listUserSessions(request),
    auth.api.getSession({ headers: request.headers, asResponse: true }),
  ]);

  const sessionsData = await sessionsResponse.json();
  const currentSession = await currentSessionResponse.json();

  return {
    sessions: sessionsData.success ? sessionsData.body : [],
    currentSessionId: currentSession?.session?.id,
  };
}

export default function Security({ loaderData }: Route.ComponentProps) {
  const { sessions, currentSessionId } = loaderData;
  const { user } = useOutletContext() as { user: UserData };
  return (
    <PageSection index={0} className="space-y-8">
      <Alert className="max-w-full rounded-sm border-amber-200 bg-amber-50 text-amber-900 dark:border-blue-900 dark:bg-blue-900/40 dark:text-blue-50">
        <RiInformationFill />
        <AlertTitle>
          Your security settings, manage sessions and revoke access.
        </AlertTitle>
      </Alert>
      <Card className="rounded-sm border-border/80 bg-gray-50/30 dark:bg-muted/30">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <RiSmartphoneLine size={18} />
            <CardTitle>Active Sessions</CardTitle>
          </div>
          <CardDescription>
            View and manage the devices currently logged into your account.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          {sessions.map((session: any) => (
            <SessionRow
              key={session.id}
              session={session}
              currentSessionId={currentSessionId}
            />
          ))}
        </div>
      </Card>
      <DeleteAccount user={user} />
    </PageSection>
  );
}

function SessionRow({
  session,
  currentSessionId,
}: {
  session: any;
  currentSessionId: string;
}) {
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const fetcher = useFetcher();
  const isRevoking = fetcher.state !== "idle";

  const actionData = fetcher.data as
    | { success?: boolean; message?: string; body?: any }
    | undefined;

  useEffect(() => {
    if (actionData?.success) {
      setShowAlert(true);
    }
  }, [actionData]);

  return (
    <>
      {actionData !== undefined && showAlert && (
        <AlertBox
          title={actionData.success ? "Success" : "Error"}
          description={actionData.message || ""}
          variant={actionData?.success ? "success" : "error"}
          onClose={() => setShowAlert(false)}
        />
      )}
      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50 group hover:border-mainBlue/30 hover:dark:border-mainGold/30 transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-background dark:bg-mainGold/20 rounded-lg border border-border/50 text-muted-foreground dark:text-white group-hover:text-mainBlue group-hover:dark:text-mainGold transition-colors">
            {session.userAgent?.toLowerCase().includes("mac") ||
            session.userAgent?.toLowerCase().includes("windows") ? (
              <RiMacbookLine size={20} />
            ) : (
              <RiSmartphoneLine size={20} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                {session.userAgent || "Unknown Device"}
              </span>
              {session.id === currentSessionId && (
                <span className="bg-mainPurple/10 text-mainPurple text-[10px] font-bold px-2 py-0.5 rounded-full border border-mainPurple/20 uppercase tracking-tighter">
                  Current
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <RiMapPinLine size={10} /> {session.ipAddress || "Unknown IP"}
              </span>
              <span className="flex items-center gap-1">
                <RiTimeLine size={10} /> Last active:{" "}
                {new Date(session.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        {session.id !== currentSessionId && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-bold text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/40 hover:text-destructive"
            onClick={() => {
              fetcher.submit(
                {
                  intent: "revoke-session",
                  token: session.token,
                },
                { method: "post", encType: "application/json" },
              );
            }}
          >
            {isRevoking ? "Revoking..." : "Revoke"}
          </Button>
        )}
      </div>
    </>
  );
}

function DeleteAccount({ user }: { user: UserData }) {
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

  return (
    <Card className="rounded-sm border-border/80 bg-gray-50/30 dark:bg-muted/30">
      <CardHeader>
        <div className="flex items-center gap-2 mb-1 text-mainPurple">
          <RiAlertFill size={18} className="text-red-500" />
          <CardTitle>Danger Zone</CardTitle>
        </div>
        <span className="text-sm">Irreversible and destructive actions.</span>
        <CardDescription className="mt-4">
          {actionData !== undefined && showAlert && (
            <AlertBox
              title={actionData?.success ? "Success" : "Error"}
              description={actionData?.message || ""}
              variant={actionData?.success ? "success" : "error"}
              onClose={() => setShowAlert(false)}
              className="mb-4"
            />
          )}
          <div className="flex flex-col gap-4 md:flex-row justify-between items-center">
            <div>
              <h1 className="text-mainDark font-medium dark:text-white">
                Delete your account
              </h1>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all of its data. This action
                cannot be undone.
              </p>
            </div>
            <ActionButton
              text="Delete Account"
              type="submit"
              loading={fetcher.state !== "idle"}
              onClick={() => {
                fetcher.submit(
                  { id: user._id, intent: "delete-account" },
                  {
                    method: "post",
                    action: "/settings/security",
                    encType: "application/json",
                  },
                );
              }}
              classname="w-full sm:w-auto border border-red-500 bg-destructive dark:bg-red-500/20 hover:bg-red-500/90 hover:dark:bg-red-500/30 text-white"
            />
          </div>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
