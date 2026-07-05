import { google } from "googleapis";
import logger from "~/.server/config/logger";
import type { IntegrationEvent } from "~/.server/model/integration";
import Integration from "~/.server/model/integration";
import Project from "~/.server/model/project";
import { fetchWithCache } from "~/.server/utils/cache";

async function getAuthClient(serviceAccountKey: string) {
  const credentials = JSON.parse(serviceAccountKey);
  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

async function getIntegration(cohortId: string) {
  const cacheKey = `integration:google_calendar:${cohortId}`;
  return await fetchWithCache(cacheKey, 600, async () => {
    return await Integration.findOne({
      cohortId,
      provider: "google_calendar",
      enabled: true,
    })
      .select("config enabledEvents")
      .lean();
  });
}

function isEventAllowed(
  integration: any,
  event: IntegrationEvent,
): boolean {
  if (!integration?.config?.serviceAccountKey) return false;
  if (
    integration.enabledEvents?.length > 0 &&
    !integration.enabledEvents.includes(event)
  ) {
    return false;
  }
  return true;
}

export const googleCalendarClient = {
  async createProjectEvent(payload: {
    cohortId: string;
    projectTitle: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }) {
    const integration = await getIntegration(payload.cohortId);
    if (!isEventAllowed(integration, "project_started")) return;

    try {
      const auth = await getAuthClient(integration.config.serviceAccountKey);
      const calendar = google.calendar({ version: "v3", auth });
      const calendarId = integration.config.calendarId || "primary";

      let { startDate, endDate, description } = payload;
      if (!startDate || !endDate) {
        const project = await Project.findOne({
          title: payload.projectTitle,
          cohort: payload.cohortId,
        })
          .select("startDate endDate description")
          .lean();
        if (project) {
          startDate = project.startDate?.toISOString();
          endDate = project.endDate?.toISOString();
          description = project.description;
        }
      }

      if (!startDate || !endDate) {
        logger.warn(
          { projectTitle: payload.projectTitle },
          "Google Calendar: could not determine project dates, skipping event creation",
        );
        return;
      }

      await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: payload.projectTitle,
          description: description || `Project: ${payload.projectTitle}`,
          start: { dateTime: startDate, timeZone: "UTC" },
          end: { dateTime: endDate, timeZone: "UTC" },
        },
      });

      logger.info(
        { projectTitle: payload.projectTitle },
        "Google Calendar: event created",
      );
    } catch (error) {
      logger.error(error, "Google Calendar: failed to create event");
    }
  },

  async updateProjectEvent(payload: {
    cohortId: string;
    projectTitle: string;
  }) {
    const integration = await getIntegration(payload.cohortId);
    if (!isEventAllowed(integration, "project_completed")) return;

    try {
      const auth = await getAuthClient(integration.config.serviceAccountKey);
      const calendar = google.calendar({ version: "v3", auth });
      const calendarId = integration.config.calendarId || "primary";

      const existing = await calendar.events.list({
        calendarId,
        q: payload.projectTitle,
        maxResults: 10,
      });

      const event = existing.data.items?.find(
        (e) => e.summary === payload.projectTitle,
      );
      if (!event?.id) {
        logger.warn(
          { projectTitle: payload.projectTitle },
          "Google Calendar: no existing event found to update",
        );
        return;
      }

      const project = await Project.findOne({
        title: payload.projectTitle,
        cohort: payload.cohortId,
      })
        .select("endDate")
        .lean();

      await calendar.events.patch({
        calendarId,
        eventId: event.id,
        requestBody: {
          ...(project?.endDate
            ? {
                end: {
                  dateTime: project.endDate.toISOString(),
                  timeZone: "UTC",
                },
              }
            : {}),
          description: `Project: ${payload.projectTitle} — Completed`,
        },
      });

      logger.info(
        { projectTitle: payload.projectTitle },
        "Google Calendar: event updated",
      );
    } catch (error) {
      logger.error(error, "Google Calendar: failed to update event");
    }
  },
};
