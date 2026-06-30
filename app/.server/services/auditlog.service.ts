import { env } from "../config/keys";
import logger from "../config/logger";
import AuditLog from "../model/auditLog";
import { workflowClient } from "../workflows/client";
import { auth } from "./better-auth";

interface RecordOptions {
  action: string;
  category: "auth" | "tasks" | "settings" | "security" | "support";
  description?: string;
  details?: Record<string, any>;
  status?: "success" | "failure";
}

export class AuditLogService {
  /**
   * Records an audit log entry.
   * Extracts user, vendor, and security metadata from the request automatically.
   */
  static async record(request: Request, options: RecordOptions) {
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session || !session.user) {
        return;
      }

      const { user } = session;
      const ipAddress =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const userAgent = request.headers.get("user-agent") || "unknown";

      await AuditLog.create({
        userId: user.id,
        userName: user.name,
        action: options.action,
        category: options.category,
        description: options.description,
        details: options.details || {},
        status: options.status || "success",
        ipAddress,
        userAgent,
      });

      // Trigger security notification for high-risk actions
      const highRiskActions = [
        "PASSWORD_CHANGE",
        "ENABLE_TWO_FACTOR",
        "DISABLE_TWO_FACTOR",
        "ACCOUNT_LOCKED",
        "DELETE_ACCOUNT_REQUEST",
        "SUPPORT_TICKET",
      ];

      if (highRiskActions.includes(options.action)) {
        await workflowClient.trigger({
          url: `${env.clientUrl}/api/v1/workflow/security-notification`,
          body: {
            user,
            action: options.action,
            description:
              options.description || `Security event: ${options.action}`,
            ipAddress,
            userAgent,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      logger.error(error, "Audit logging failed");
    }
  }
}
