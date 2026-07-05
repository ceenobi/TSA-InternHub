import logger from "~/.server/config/logger";
import type { IntegrationEvent } from "~/.server/model/integration";
import Integration from "~/.server/model/integration";
import { fetchWithCache } from "~/.server/utils/cache";

async function sendWebhook(webhookUrl: string, text: string, channel?: string) {
  try {
    const body: Record<string, string> = { text };
    if (channel) body.channel = channel;

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      logger.error({ status: res.status }, "Slack webhook failed");
    }
  } catch (error) {
    logger.error(error, "Slack webhook error");
  }
}

export const slackClient = {
  async sendMessage(cohortId: string, event: IntegrationEvent, text: string) {
    const cacheKey = `integration:slack:${cohortId}`;
    const integration = await fetchWithCache(cacheKey, 600, async () => {
      return await Integration.findOne({
        cohortId,
        provider: "slack",
        enabled: true,
      })
        .select("config enabledEvents")
        .lean();
    });

    if (!integration?.config?.webhookUrl) return;

    // If specific events are enabled, only send for allowed events
    if (
      integration.enabledEvents &&
      integration.enabledEvents.length > 0 &&
      !integration.enabledEvents.includes(event)
    ) {
      return;
    }

    await sendWebhook(
      integration.config.webhookUrl,
      text,
      integration.config.channel,
    );
  },
};
