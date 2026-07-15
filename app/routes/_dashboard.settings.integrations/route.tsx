import {
  RiCalendar2Fill,
  RiCheckLine,
  RiCloseCircleLine,
  RiExternalLinkLine,
  RiFileTextFill,
  RiGithubFill,
  RiLoader2Line,
  RiNotionFill,
  RiSlackFill,
  RiVideoOnFill,
} from "@remixicon/react";
import { dehydrate } from "@tanstack/react-query";
import { Suspense, useEffect, useRef, useState } from "react";
import { Await, useFetcher } from "react-router";
import { toast } from "sonner";
import {
  deleteIntegration,
  saveIntegration,
} from "~/.server/action/integration";
import type { IntegrationEvent } from "~/.server/model/integration";
import { PageSection } from "~/components/provider/page-wrapper";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import DataError from "~/components/ui/data-error";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { IntegrationSkeleton } from "~/components/ui/skeleton-ui";
import { Switch } from "~/components/ui/switch";
import { getQueryClientRsc } from "~/lib/getQueryClient";
import { requirePermission } from "~/middleware/auth.middleware";
import { getIntegrationsQuery } from "~/queries/integrations.server";
import type { IntegrationData } from "~/types";
import type { Route } from "./+types/route";

export const middleware = [requirePermission("MANAGE_INTEGRATIONS")];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Integrations - Settings | TSA InternHub" },
    {
      name: "description",
      content:
        "Integrations allow you to connect your TSA InternHub account with external tools and services.",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const queryClient = getQueryClientRsc();
  const data = queryClient.ensureQueryData(getIntegrationsQuery(request));
  return {
    dehydratedState: dehydrate(queryClient),
    data,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const payload = await request.json();
  if (payload.intent === "save-integration") {
    return await saveIntegration(request, payload);
  }
  if (payload.intent === "delete-integration") {
    return await deleteIntegration(request, payload);
  }
  return Response.json(
    { success: false, message: "Unknown intent" },
    { status: 400 },
  );
}

const INTEGRATION_DEFS = [
  {
    id: "slack",
    name: "Slack",
    description:
      "Post notifications to a Slack channel when tasks are graded, stages complete, or projects update.",
    icon: RiSlackFill,
    color: "text-[#4A154B]",
    bgColor: "bg-[#4A154B]/10",
    docsUrl:
      "https://slack.com/help/articles/115005265063-Incoming-webhooks-for-Slack",
    fields: [
      {
        key: "webhookUrl",
        label: "Webhook URL",
        placeholder: "https://hooks.slack.com/services/…",
        type: "url",
      },
      {
        key: "channel",
        label: "Channel Name",
        placeholder: "#cohort-announcements",
        type: "text",
      },
    ],
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    description:
      "Auto-create calendar events for project start/end dates so students see deadlines in their own calendar.",
    icon: RiCalendar2Fill,
    color: "text-[#4285F4]",
    bgColor: "bg-[#4285F4]/10",
    docsUrl:
      "https://developers.google.com/calendar/api/guides/overview",
    fields: [
      {
        key: "serviceAccountKey",
        label: "Service Account Key (JSON)",
        placeholder: "Paste your Google service account key…",
        type: "textarea",
      },
      {
        key: "calendarId",
        label: "Calendar ID",
        placeholder: "your-calendar@group.calendar.google.com",
        type: "email",
      },
    ],
  },
  {
    id: "github",
    name: "GitHub",
    description:
      "Link student repositories to tasks. Update commit statuses when submissions are graded.",
    icon: RiGithubFill,
    color: "text-[#24292F]",
    bgColor: "bg-[#24292F]/10",
    docsUrl:
      "https://docs.github.com/en/rest/commits/statuses",
    fields: [
      {
        key: "accessToken",
        label: "Access Token",
        placeholder: "ghp_…",
        type: "password",
      },
      {
        key: "orgName",
        label: "Organization (optional)",
        placeholder: "your-org",
        type: "text",
      },
    ],
  },
  {
    id: "google_docs",
    name: "Google Docs",
    description:
      "Enable inline commenting on submitted documents for richer feedback on written tasks.",
    icon: RiFileTextFill,
    color: "text-[#4285F4]",
    bgColor: "bg-[#4285F4]/10",
    docsUrl:
      "https://developers.google.com/docs/api",
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        placeholder: "AIza…",
        type: "password",
      },
    ],
  },
  {
    id: "notion",
    name: "Notion",
    description:
      "Push stage instructions, resources, and project documentation to a shared Notion workspace.",
    icon: RiNotionFill,
    color: "text-[#000000]",
    bgColor: "bg-black/10 dark:bg-white/10",
    docsUrl:
      "https://developers.notion.com/docs",
    fields: [
      {
        key: "integrationToken",
        label: "Integration Token",
        placeholder: "ntn_…",
        type: "password",
      },
      {
        key: "databaseId",
        label: "Database ID",
        placeholder: "Your Notion database ID",
        type: "text",
      },
    ],
  },
  {
    id: "zoom",
    name: "Zoom / Google Meet",
    description:
      "Auto-generate meeting links for group tasks or stage kickoff sessions. Uses your preferred provider to create video meetings.",
    icon: RiVideoOnFill,
    color: "text-[#2D8CFF]",
    bgColor: "bg-[#2D8CFF]/10",
    docsUrl:
      "https://developers.zoom.us/docs",
    fields: [
      {
        key: "preferredProvider",
        label: "Preferred Provider",
        placeholder: "zoom or google-meet",
        type: "text",
      },
      {
        key: "zoomAccountId",
        label: "Zoom Account ID",
        placeholder: "Your Zoom Server-to-Server OAuth Account ID",
        type: "password",
      },
      {
        key: "zoomClientId",
        label: "Zoom Client ID",
        placeholder: "Your Zoom Server-to-Server OAuth Client ID",
        type: "password",
      },
      {
        key: "zoomClientSecret",
        label: "Zoom Client Secret",
        placeholder: "Your Zoom Server-to-Server OAuth Client Secret",
        type: "password",
      },
    ],
  },
];

const INTEGRATION_EVENTS: { value: IntegrationEvent; label: string }[] = [
  { value: "submission_graded", label: "Submission Graded" },
  { value: "stage_completed", label: "Stage Completed" },
  { value: "stage_failed", label: "Stage Failed" },
  { value: "project_started", label: "Project Started" },
  { value: "project_completed", label: "Project Completed" },
  { value: "task_overdue", label: "Task Overdue" },
  { value: "ticket_assigned", label: "Ticket Assigned" },
  { value: "ticket_resolved", label: "Ticket Resolved" },
  { value: "ticket_created", label: "Ticket Created" },
];

export default function IntegrationsRoute({
  loaderData,
}: Route.ComponentProps) {
  const { data } = loaderData;

  return (
    <PageSection index={2} className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Integrations
        </h2>
        <p className="text-sm text-muted-foreground">
          Connect external services to extend the platform. Configured
          integrations will automatically trigger on relevant events.
        </p>
      </div>
      <Suspense fallback={<IntegrationSkeleton />}>
        <Await resolve={data} errorElement={<DataError />}>
          {(resolved) => <IntegrationList data={resolved} />}
        </Await>
      </Suspense>
    </PageSection>
  );
}

function IntegrationList({
  data,
}: {
  data: { integrations: IntegrationData[] };
}) {
  const fetcher = useFetcher();
  const formRefs = useRef<Record<string, Record<string, string>>>({});
  const [configured, setConfigured] = useState<Record<string, boolean>>({});
  const [enabledEvents, setEnabledEvents] = useState<Record<string, string[]>>(
    {},
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load integration configs from server
  useEffect(() => {
    if (data?.integrations) {
      const configMap: Record<string, boolean> = {};
      const eventsMap: Record<string, string[]> = {};
      for (const def of INTEGRATION_DEFS) {
        const integration = data.integrations.find(
          (i) => i.provider === def.id,
        );
        configMap[def.id] = !!integration;
        eventsMap[def.id] = integration?.enabledEvents || [];
      }
      setConfigured(configMap);
      setEnabledEvents(eventsMap);
    }
  }, [data]);

  useEffect(() => {
    if (fetcher.data?.success) {
      toast.success(fetcher.data.message || "Saved");
    } else if (fetcher.data?.success === false) {
      toast.error(fetcher.data.message || "Failed");
    }
  }, [fetcher.data]);

  const handleFieldChange = (
    integrationId: string,
    key: string,
    value: string,
  ) => {
    if (!formRefs.current[integrationId]) {
      formRefs.current[integrationId] = {};
    }
    formRefs.current[integrationId][key] = value;
  };

  const handleEventToggle = (integrationId: string, event: string) => {
    setEnabledEvents((prev) => {
      const current = prev[integrationId] || [];
      const next = current.includes(event)
        ? current.filter((e) => e !== event)
        : [...current, event];
      return { ...prev, [integrationId]: next };
    });
  };

  const handleSave = (integrationId: string) => {
    const config = formRefs.current[integrationId] || {};
    const events = enabledEvents[integrationId] || [];
    fetcher.submit(
      {
        intent: "save-integration",
        provider: integrationId,
        config,
        enabledEvents: events,
      },
      { method: "post", encType: "application/json" },
    );
    setConfigured((prev) => ({ ...prev, [integrationId]: true }));
    setExpandedId(null);
  };

  const handleDisconnect = (integrationId: string) => {
    fetcher.submit(
      {
        intent: "delete-integration",
        provider: integrationId,
      },
      { method: "post", encType: "application/json" },
    );
    setConfigured((prev) => ({ ...prev, [integrationId]: false }));
    setExpandedId(null);
  };

  const isSaving = fetcher.state === "submitting";
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {INTEGRATION_DEFS.map((integration) => {
        const Icon = integration.icon;
        const isConfigured = configured[integration.id] || false;
        const isExpanded = expandedId === integration.id;

        return (
          <Card
            key={integration.id}
            className={`rounded-sm dark:bg-muted/30 transition-[border-color,box-shadow] ${
              isExpanded ? "ring-1 ring-mainBlue/30 dark:ring-darkBlue/30" : ""
            }`}
          >
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`size-10 rounded-full flex items-center justify-center shrink-0 ${integration.bgColor} ${integration.color}`}
                >
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    {integration.name}
                    {isConfigured ? (
                      <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-sm font-medium">
                        Connected
                      </Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-sm font-medium">
                        Not configured
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {integration.description}
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={isConfigured}
                onCheckedChange={() => {
                  if (isConfigured) {
                    handleDisconnect(integration.id);
                  } else {
                    setExpandedId(integration.id);
                  }
                }}
                className="shrink-0"
              />
            </CardHeader>

            {isExpanded && (
              <CardContent className="border-t border-border/50 pt-4 space-y-4">
                {integration.fields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label
                      htmlFor={`${integration.id}-${field.key}`}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      {field.label}
                    </Label>
                    {field.type === "textarea" ? (
                      <textarea
                        id={`${integration.id}-${field.key}`}
                        placeholder={field.placeholder}
                        rows={3}
                        onChange={(e) =>
                          handleFieldChange(
                            integration.id,
                            field.key,
                            e.target.value,
                          )
                        }
                        className="w-full rounded-sm border border-border bg-card text-sm p-2 outline-none focus:border-mainBlue/50 dark:focus:border-darkBlue/50 transition-colors resize-none"
                      />
                    ) : (
                      <Input
                        id={`${integration.id}-${field.key}`}
                        type={field.type}
                        placeholder={field.placeholder}
                        onChange={(e) =>
                          handleFieldChange(
                            integration.id,
                            field.key,
                            e.target.value,
                          )
                        }
                        className="rounded-sm h-9 text-sm"
                      />
                    )}
                  </div>
                ))}

                {/* Event toggles */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Notify on these events
                  </Label>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {INTEGRATION_EVENTS.map((ev) => {
                      const isSelected = (
                        enabledEvents[integration.id] || []
                      ).includes(ev.value);
                      return (
                        <label
                          key={ev.value}
                          className="flex items-center gap-2 cursor-pointer py-0.5"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              handleEventToggle(integration.id, ev.value)
                            }
                            className="size-3.5 rounded-sm border-border accent-mainBlue dark:accent-darkBlue"
                          />
                          <span className="text-xs text-foreground/80">
                            {ev.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-sm text-xs"
                    disabled={isSaving}
                    onClick={() => handleSave(integration.id)}
                  >
                    {isSaving ? (
                      <RiLoader2Line size={14} className="animate-spin" />
                    ) : (
                      <RiCheckLine size={14} />
                    )}
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-sm text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDisconnect(integration.id)}
                  >
                    <RiCloseCircleLine size={14} />
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            )}

            {!isExpanded && !isConfigured && (
              <CardContent className="pt-0">
                <a
                  href={integration.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-mainBlue dark:text-darkBlue hover:underline flex items-center gap-1"
                >
                  Learn more
                  <RiExternalLinkLine size={12} />
                </a>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
