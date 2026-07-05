import { getIntegrations } from "~/.server/action/integration";
import type { IntegrationData } from "~/types";

type IntegrationsResponse = {
  success: boolean;
  message?: string;
  body?: IntegrationData[];
};

export const getIntegrationsQuery = (request: Request) => {
  return {
    queryKey: ["integrations"],
    queryFn: async (): Promise<{ integrations: IntegrationData[] }> => {
      const response = await getIntegrations(request);
      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(
          errorData.message || "Failed to fetch app integrations",
        );
      }
      const data = (await response.json()) as IntegrationsResponse;
      return { integrations: data.body || [] };
    },
  };
};
