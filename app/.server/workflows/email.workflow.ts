import { WorkflowContext } from "@upstash/workflow";
import logger from "../config/logger.js";
import type { User } from "../services/better-auth";
import emailService from "../services/email.service";

interface EmailPayload {
  user: User;
  link: string;
}

export const sendVerifyAccountWorkflow = async (
  context: WorkflowContext<EmailPayload>,
) => {
  const payload = context.requestPayload;
  if (!payload) {
    logger.error("No requestPayload received in sendVerifyAccountWorkflow");
    return;
  }
  const { user, link } = payload;

  await context.run("send-email", async () => {
    try {
      await emailService.sendVerificationEmail({ user, link });
    } catch (error: any) {
      logger.error(
        `Workflow failed to send email for user ${user.email}:`,
        error,
      );
      throw error;
    }
  });
};

export const sendPasswordResetWorkflow = async (
  context: WorkflowContext<EmailPayload>,
) => {
  const payload = context.requestPayload;
  if (!payload) {
    logger.error("No requestPayload received in sendPasswordResetWorkflow");
    return;
  }
  const { user, link } = payload;

  await context.run("send-password-reset-email", async () => {
    try {
      await emailService.sendForgotPasswordEmail({
        user,
        link,
      });
    } catch (error: any) {
      logger.error(
        `Workflow failed to send password reset email for user ${user.email}:`,
        error,
      );
      throw error;
    }
  });
};

export const sendPasswordResetSuccessWorkflow = async (
  context: WorkflowContext<{ user: User }>,
) => {
  const payload = context.requestPayload;
  if (!payload) {
    logger.error(
      "No requestPayload received in sendPasswordResetSuccessWorkflow",
    );
    return;
  }
  const { user } = payload;

  await context.run("send-password-reset-success-email", async () => {
    try {
      await emailService.sendPasswordResetSuccessEmail({ user });
    } catch (error: any) {
      logger.error(
        `Workflow failed to send password reset success email for user ${user.email}:`,
        error,
      );
      throw error;
    }
  });
};

export const sendInvitationCodeWorkflow = async (
  context: WorkflowContext<{
    user: User;
    inviteCode: string;
    cohort: string;
    link: string;
  }>,
) => {
  const payload = context.requestPayload;
  if (!payload) {
    logger.error("No requestPayload received in sendStaffInvitationWorkflow");
    return;
  }
  const { user, inviteCode, cohort, link } = payload;

  await context.run("send-invitation-email", async () => {
    try {
      await emailService.sendInviteCodeEmail({
        user,
        inviteCode,
        cohort,
        link,
      });
    } catch (error: any) {
      logger.error(
        `Workflow failed to send invitation email for user ${user.email}:`,
        error,
      );
      throw error;
    }
  });
};

export const sendDeleteAccountRequestWorkflow = async (
  context: WorkflowContext<{
    user: User;
    link: string;
  }>,
) => {
  const payload = context.requestPayload;
  if (!payload) {
    logger.error(
      "No requestPayload received in sendDeleteAccountRequestWorkflow",
    );
    return;
  }
  const { user, link } = payload;

  await context.run("send-delete-account-request-email", async () => {
    try {
      await emailService.sendDeleteAccountRequestEmail({ user, link });
    } catch (error: any) {
      logger.error(
        `Workflow failed to send delete account request email for user ${user.email}:`,
        error,
      );
      throw error;
    }
  });
};

export const sendAdminInviteWorkflow = async (
  context: WorkflowContext<{
    user: User;
    link: string;
    password: string;
  }>,
) => {
  const payload = context.requestPayload;
  if (!payload) {
    logger.error("No requestPayload received in sendAdminInviteWorkflow");
    return;
  }
  const { user, link, password } = payload;

  await context.run("send-admin-invite-email", async () => {
    try {
      await emailService.sendAdminInviteEmail({ user, link, password });
    } catch (error: any) {
      logger.error(
        `Workflow failed to send admin invite email for user ${user.email}:`,
        error,
      );
      throw error;
    }
  });
};
