import { createWorkflow, serveMany } from "@upstash/workflow/react-router";
import { workflowClient } from "~/.server/workflows/client";
import {
  sendAdminInviteWorkflow,
  sendDeleteAccountRequestWorkflow,
  sendInvitationCodeWorkflow,
  sendPasswordResetSuccessWorkflow,
  sendPasswordResetWorkflow,
  sendVerifyAccountWorkflow,
} from "~/.server/workflows/email.workflow";
import {
  sendProjectCompletedWorkflow,
  sendProjectStartedWorkflow,
  sendSecurityNotificationWorkflow,
  sendStageAutoFailedWorkflow,
  sendSubmissionGradedWorkflow,
  sendTaskOverdueWorkflow,
  sendTicketAssignedWorkflow,
  sendTicketConfirmationWorkflow,
  sendTicketResolvedWorkflow,
} from "~/.server/workflows/notification.workflow";
import { runDashboardRefreshWorkflow } from "~/.server/workflows/dashboard.workflow";
import { runStatusUpdatesWorkflow } from "~/.server/workflows/status.workflow";

const verifyAccount = createWorkflow(sendVerifyAccountWorkflow);
const passwordReset = createWorkflow(sendPasswordResetWorkflow);
const passwordResetSuccess = createWorkflow(sendPasswordResetSuccessWorkflow);
const userInvitation = createWorkflow(sendInvitationCodeWorkflow);
const deleteAccountRequest = createWorkflow(sendDeleteAccountRequestWorkflow);
const adminInvite = createWorkflow(sendAdminInviteWorkflow);
const projectStarted = createWorkflow(sendProjectStartedWorkflow);
const projectCompleted = createWorkflow(sendProjectCompletedWorkflow);
const stageAutoFailed = createWorkflow(sendStageAutoFailedWorkflow);
const taskOverdue = createWorkflow(sendTaskOverdueWorkflow);
const submissionGraded = createWorkflow(sendSubmissionGradedWorkflow);
const ticketConfirmation = createWorkflow(sendTicketConfirmationWorkflow);
const ticketAssigned = createWorkflow(sendTicketAssignedWorkflow);
const ticketResolved = createWorkflow(sendTicketResolvedWorkflow);
const securityNotification = createWorkflow(sendSecurityNotificationWorkflow);
const runStatusUpdates = createWorkflow(runStatusUpdatesWorkflow);
const runDashboardRefresh = createWorkflow(runDashboardRefreshWorkflow);

export const handler = serveMany(
  {
    "verify-account": verifyAccount,
    "password-reset": passwordReset,
    "password-reset-success": passwordResetSuccess,
    "invitation-code": userInvitation,
    "delete-account-request": deleteAccountRequest,
    "admin-invite": adminInvite,
    "project-started": projectStarted,
    "project-completed": projectCompleted,
    "stage-auto-failed": stageAutoFailed,
    "task-overdue": taskOverdue,
    "submission-graded": submissionGraded,
    "ticket-confirmation": ticketConfirmation,
    "ticket-assigned": ticketAssigned,
    "ticket-resolved": ticketResolved,
    "security-notification": securityNotification,
    "run-status-updates": runStatusUpdates,
    "run-dashboard-refresh": runDashboardRefresh,
  },
  {
    qstashClient: workflowClient as any,
  },
);

export const action = handler;
export const loader = handler;
