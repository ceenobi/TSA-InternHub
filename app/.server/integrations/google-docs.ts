import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import logger from "~/.server/config/logger";
import type { IntegrationEvent } from "~/.server/model/integration";
import Integration from "~/.server/model/integration";
import { fetchWithCache } from "~/.server/utils/cache";

function parseGoogleDocId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("docs.google.com")) return null;
    const match = u.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

async function getIntegration(cohortId: string) {
  const cacheKey = `integration:google_docs:${cohortId}`;
  return await fetchWithCache(cacheKey, 600, async () => {
    return await Integration.findOne({
      cohortId,
      provider: "google_docs",
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
  if (!integration?.config?.apiKey) return false;
  if (
    integration.enabledEvents?.length > 0 &&
    !integration.enabledEvents.includes(event)
  ) {
    return false;
  }
  return true;
}

export const googleDocsClient = {
  async addCommentToDoc(payload: {
    cohortId: string;
    userName?: string;
    taskTitle?: string;
    score?: number;
    maxScore?: number;
    feedback?: string;
    fileUrls?: { name: string; url: string }[];
  }) {
    const integration = await getIntegration(payload.cohortId);
    if (!isEventAllowed(integration, "submission_graded")) return;

    const googleDocUrls = (payload.fileUrls || []).filter(
      (f) => parseGoogleDocId(f.url),
    );
    if (googleDocUrls.length === 0) return;

    try {
      const auth = new GoogleAuth({
        apiKey: integration.config.apiKey,
      });
      const drive = google.drive({ version: "v3", auth: auth as any });

      const percentage = payload.maxScore
        ? Math.round(((payload.score || 0) / payload.maxScore) * 100)
        : 0;

      const commentText = [
        `Grade: ${payload.score}/${payload.maxScore} (${percentage}%)`,
        payload.feedback ? `\n\nFeedback: ${payload.feedback}` : "",
        `\n— ${payload.userName || "Grader"}`,
      ].join("");

      for (const doc of googleDocUrls) {
        const docId = parseGoogleDocId(doc.url);
        if (!docId) continue;

        try {
          await drive.comments.create({
            fileId: docId,
            requestBody: { content: commentText },
            fields: "id",
          });
          logger.info(
            { docId, taskTitle: payload.taskTitle },
            "Google Docs: comment added to document",
          );
        } catch (innerError) {
          logger.error(
            { docId, error: innerError },
            "Google Docs: failed to add comment (document may not allow API access)",
          );
        }
      }
    } catch (error) {
      logger.error(error, "Google Docs: integration error");
    }
  },
};
