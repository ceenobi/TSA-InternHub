import { google } from "googleapis";
import logger from "~/.server/config/logger";
import type { IntegrationEvent } from "~/.server/model/integration";
import Integration from "~/.server/model/integration";
import Project from "~/.server/model/project";
import { fetchWithCache } from "~/.server/utils/cache";

async function getZoomAccessToken(config: {
  accountId: string;
  clientId: string;
  clientSecret: string;
}): Promise<string | null> {
  try {
    const res = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${config.accountId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    if (!res.ok) {
      logger.error(
        { status: res.status },
        "Zoom: failed to get access token",
      );
      return null;
    }
    const data = await res.json();
    return data.access_token as string;
  } catch (error) {
    logger.error(error, "Zoom: OAuth token error");
    return null;
  }
}

async function createZoomMeeting(
  accessToken: string,
  topic: string,
  startTime: string,
  durationMinutes: number,
): Promise<string | null> {
  try {
    const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic,
        type: 2,
        start_time: startTime,
        duration: durationMinutes,
        timezone: "UTC",
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          waitting_room: false,
        },
      }),
    });
    if (!res.ok) {
      logger.error(
        { status: res.status },
        "Zoom: failed to create meeting",
      );
      return null;
    }
    const data = await res.json();
    return (data.join_url as string) || null;
  } catch (error) {
    logger.error(error, "Zoom: create meeting error");
    return null;
  }
}

async function createGoogleMeetLink(
  serviceAccountKey: string,
  topic: string,
  startTime: string,
  endTime: string,
  description?: string,
): Promise<string | null> {
  try {
    const credentials = JSON.parse(serviceAccountKey);
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/drive",
      ],
    });

    const calendar = google.calendar({ version: "v3", auth });
    const event = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      requestBody: {
        summary: topic,
        description: description || topic,
        start: { dateTime: startTime, timeZone: "UTC" },
        end: { dateTime: endTime, timeZone: "UTC" },
        conferenceData: {
          createRequest: {
            requestId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    return event.data?.hangoutLink || null;
  } catch (error) {
    logger.error(error, "Google Meet: failed to create meeting link");
    return null;
  }
}

async function getIntegration(cohortId: string) {
  const cacheKey = `integration:zoom:${cohortId}`;
  return await fetchWithCache(cacheKey, 600, async () => {
    return await Integration.findOne({
      cohortId,
      provider: "zoom",
      enabled: true,
    })
      .select("config enabledEvents")
      .lean();
  });
}

async function getCalendarIntegration(cohortId: string) {
  const cacheKey = `integration:google_calendar:${cohortId}`;
  return await fetchWithCache(cacheKey, 600, async () => {
    return await Integration.findOne({
      cohortId,
      provider: "google_calendar",
    })
      .select("config")
      .lean();
  });
}

function isEventAllowed(
  integration: any,
  event: IntegrationEvent,
): boolean {
  if (!integration?.config?.preferredProvider) return false;
  if (
    integration.enabledEvents?.length > 0 &&
    !integration.enabledEvents.includes(event)
  ) {
    return false;
  }
  return true;
}

export const zoomClient = {
  async createProjectMeeting(payload: {
    cohortId: string;
    projectTitle: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    projectId?: string;
  }) {
    const integration = await getIntegration(payload.cohortId);
    if (!isEventAllowed(integration, "project_started")) return;

    const provider = integration.config.preferredProvider as string;
    if (provider !== "zoom" && provider !== "google-meet") {
      logger.warn(
        { provider },
        "Zoom/Meet: unknown preferred provider, skipping",
      );
      return;
    }

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

    if (!startDate) {
      logger.warn(
        { projectTitle: payload.projectTitle },
        "Zoom/Meet: no start date, skipping meeting creation",
      );
      return;
    }

    const startMs = new Date(startDate).getTime();
    const endMs = endDate ? new Date(endDate).getTime() : startMs + 3600000;
    const durationMinutes = Math.max(
      15,
      Math.ceil((endMs - startMs) / 60000),
    );
    const projectId = payload.projectId;

    let meetingUrl: string | null = null;

    if (provider === "zoom") {
      const {
        zoomAccountId,
        zoomClientId,
        zoomClientSecret,
      } = integration.config;

      if (!zoomAccountId || !zoomClientId || !zoomClientSecret) {
        logger.warn(
          { projectTitle: payload.projectTitle },
          "Zoom: missing credentials, skipping",
        );
        return;
      }

      const token = await getZoomAccessToken({
        accountId: zoomAccountId,
        clientId: zoomClientId,
        clientSecret: zoomClientSecret,
      });
      if (!token) return;

      meetingUrl = await createZoomMeeting(
        token,
        `Kickoff: ${payload.projectTitle}`,
        startDate,
        durationMinutes,
      );
    } else {
      const calendarIntegration = await getCalendarIntegration(
        payload.cohortId,
      );
      if (!calendarIntegration?.config?.serviceAccountKey) {
        logger.warn(
          { projectTitle: payload.projectTitle },
          "Google Meet: no Google Calendar service account configured, skipping",
        );
        return;
      }

      meetingUrl = await createGoogleMeetLink(
        calendarIntegration.config.serviceAccountKey,
        `Kickoff: ${payload.projectTitle}`,
        startDate,
        endDate || new Date(startMs + 3600000).toISOString(),
        description,
      );
    }

    if (meetingUrl && projectId) {
      try {
        await Project.findByIdAndUpdate(projectId, {
          $set: { meetingUrl },
        });
        logger.info(
          { projectTitle: payload.projectTitle, meetingUrl },
          "Zoom/Meet: meeting link saved to project",
        );
      } catch (error) {
        logger.error(error, "Zoom/Meet: failed to save meeting link");
      }
    }
  },
};
