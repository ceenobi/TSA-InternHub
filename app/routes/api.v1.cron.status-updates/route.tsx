import { workflowClient } from "~/.server/workflows/client";
import { env } from "~/.server/config/keys";
import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    await workflowClient.trigger({
      url: `${env.clientUrl}/api/v1/workflow/run-status-updates`,
      body: {},
    });
    return Response.json({ success: true, message: "Status update workflow triggered" });
  } catch (err: any) {
    return Response.json(
      { success: false, message: err?.message ?? "Failed to trigger workflow" },
      { status: 500 },
    );
  }
}

export const action = loader;
