import { serveMany } from "@upstash/workflow/react-router";

export const action = async (args: any) => {
  const { createWorkflow } = await import("@upstash/workflow/react-router");
  const { workflowClient } = await import("~/.server/workflows/client");
  const {
    sendAdminInviteWorkflow,
    sendDeleteAccountRequestWorkflow,
    sendInvitationCodeWorkflow,
    sendPasswordResetSuccessWorkflow,
    sendPasswordResetWorkflow,
    sendVerifyAccountWorkflow,
  } = await import("~/.server/workflows/email.workflow");
  const {
    sendProjectCompletedWorkflow,
    sendProjectStartedWorkflow,
    sendSecurityNotificationWorkflow,
    sendStageAutoFailedWorkflow,
    sendSubmissionGradedWorkflow,
    sendTaskOverdueWorkflow,
    sendTicketAssignedWorkflow,
    sendTicketConfirmationWorkflow,
    sendTicketResolvedWorkflow,
  } = await import("~/.server/workflows/notification.workflow");
  const { runDashboardRefreshWorkflow } = await import("~/.server/workflows/dashboard.workflow");
  const { runStatusUpdatesWorkflow } = await import("~/.server/workflows/status.workflow");

  const handler = serveMany(
    {
      "verify-account": createWorkflow(sendVerifyAccountWorkflow),
      "password-reset": createWorkflow(sendPasswordResetWorkflow),
      "password-reset-success": createWorkflow(sendPasswordResetSuccessWorkflow),
      "invitation-code": createWorkflow(sendInvitationCodeWorkflow),
      "delete-account-request": createWorkflow(sendDeleteAccountRequestWorkflow),
      "admin-invite": createWorkflow(sendAdminInviteWorkflow),
      "project-started": createWorkflow(sendProjectStartedWorkflow),
      "project-completed": createWorkflow(sendProjectCompletedWorkflow),
      "stage-auto-failed": createWorkflow(sendStageAutoFailedWorkflow),
      "task-overdue": createWorkflow(sendTaskOverdueWorkflow),
      "submission-graded": createWorkflow(sendSubmissionGradedWorkflow),
      "ticket-confirmation": createWorkflow(sendTicketConfirmationWorkflow),
      "ticket-assigned": createWorkflow(sendTicketAssignedWorkflow),
      "ticket-resolved": createWorkflow(sendTicketResolvedWorkflow),
      "security-notification": createWorkflow(sendSecurityNotificationWorkflow),
      "run-status-updates": createWorkflow(runStatusUpdatesWorkflow),
      "run-dashboard-refresh": createWorkflow(runDashboardRefreshWorkflow),
    },
    { qstashClient: workflowClient as any },
  );

  return handler(args);
};

export const loader = action;
