import { WorkflowContext } from "@upstash/workflow";
import logger from "../config/logger.js";
import UserModel from "../model/user";
import emailService from "../services/email.service";

async function getUserPayload(userId: string) {
  const user = await UserModel.findById(userId).select("name email").lean();
  if (!user) return null;
  return { id: userId, name: user.name, email: user.email } as any;
}

export const sendProjectStartedWorkflow = async (
  context: WorkflowContext<{
    userId: string;
    projectTitle: string;
    link: string;
  }>,
) => {
  const payload = context.requestPayload;
  if (!payload) return;
  const user = await getUserPayload(payload.userId);
  if (!user) return;

  await context.run("send-project-started-email", async () => {
    try {
      await emailService.sendProjectStartedEmail({
        user,
        projectTitle: payload.projectTitle,
        link: payload.link,
      });
    } catch (error: any) {
      logger.error(
        `Failed to send project started email for user ${user.email}:`,
        error,
      );
      throw error;
    }
  });
};

export const sendProjectCompletedWorkflow = async (
  context: WorkflowContext<{
    userId: string;
    projectTitle: string;
    link: string;
  }>,
) => {
  const payload = context.requestPayload;
  if (!payload) return;
  const user = await getUserPayload(payload.userId);
  if (!user) return;

  await context.run("send-project-completed-email", async () => {
    try {
      await emailService.sendProjectCompletedEmail({
        user,
        projectTitle: payload.projectTitle,
        link: payload.link,
      });
    } catch (error: any) {
      logger.error(
        `Failed to send project completed email for user ${user.email}:`,
        error,
      );
      throw error;
    }
  });
};

export const sendStageAutoFailedWorkflow = async (
  context: WorkflowContext<{
    userId: string;
    stageTitle: string;
    projectTitle: string;
  }>,
) => {
  const payload = context.requestPayload;
  if (!payload) return;
  const user = await getUserPayload(payload.userId);
  if (!user) return;

  await context.run("send-stage-failed-email", async () => {
    try {
      await emailService.sendStageFailedEmail({
        user,
        stageTitle: payload.stageTitle,
        projectTitle: payload.projectTitle,
      });
    } catch (error: any) {
      logger.error(
        `Failed to send stage failed email for user ${user.email}:`,
        error,
      );
      throw error;
    }
  });
};

export const sendTaskOverdueWorkflow = async (
  context: WorkflowContext<{
    userId: string;
    taskTitle: string;
    stageTitle: string;
  }>,
) => {
  const payload = context.requestPayload;
  if (!payload) return;
  const user = await getUserPayload(payload.userId);
  if (!user) return;

  await context.run("send-task-overdue-email", async () => {
    try {
      await emailService.sendTaskOverdueEmail({
        user,
        taskTitle: payload.taskTitle,
        stageTitle: payload.stageTitle,
      });
    } catch (error: any) {
      logger.error(
        `Failed to send task overdue email for user ${user.email}:`,
        error,
      );
      throw error;
    }
  });
};

export const sendTicketConfirmationWorkflow = async (
  context: WorkflowContext<{
    userId: string;
    ticketId: string;
    title: string;
    description: string;
    priority: string;
  }>,
) => {
  const payload = context.requestPayload;
  if (!payload) return;
  const user = await getUserPayload(payload.userId);
  if (!user) return;

  await context.run("send-ticket-confirmation-email", async () => {
    try {
      await emailService.sendTicketConfirmationEmail({
        user,
        ticketId: payload.ticketId,
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
      });
    } catch (error: any) {
      logger.error(
        `Failed to send ticket confirmation email for user ${user.email}:`,
        error,
      );
      throw error;
    }
  });
};

export const sendSubmissionGradedWorkflow = async (
  context: WorkflowContext<{
    userId: string;
    taskTitle: string;
    score: number;
    maxScore: number;
    link: string;
  }>,
) => {
  const payload = context.requestPayload;
  if (!payload) return;
  const user = await getUserPayload(payload.userId);
  if (!user) return;

  await context.run("send-submission-graded-email", async () => {
    try {
      await emailService.sendSubmissionGradedEmail({
        user,
        taskTitle: payload.taskTitle,
        score: payload.score,
        maxScore: payload.maxScore,
        link: payload.link,
      });
    } catch (error: any) {
      logger.error(
        `Failed to send submission graded email for user ${user.email}:`,
        error,
      );
      throw error;
    }
  });
};

export const sendSecurityNotificationWorkflow = async (
  context: WorkflowContext<{
    user: { id: string; name: string; email: string };
    action: string;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp?: string;
  }>,
) => {
  const payload = context.requestPayload;
  if (!payload) return;

  await context.run("log-security-event", async () => {
    logger.warn(
      {
        user: payload.user.email,
        action: payload.action,
        ip: payload.ipAddress,
        userAgent: payload.userAgent,
        timestamp: payload.timestamp,
      },
      `Security event: ${payload.description || payload.action}`,
    );
  });
};

export const sendTicketAssignedWorkflow = async (
  context: WorkflowContext<{
    userId: string;
    ticketId: string;
    title: string;
  }>,
) => {
  const payload = context.requestPayload;
  if (!payload) return;
  const user = await getUserPayload(payload.userId);
  if (!user) return;

  await context.run("send-ticket-assigned-email", async () => {
    try {
      await emailService.sendTicketAssignedEmail({
        user,
        ticketId: payload.ticketId,
        title: payload.title,
      });
    } catch (error: any) {
      logger.error(
        `Failed to send ticket assigned email for user ${user.email}:`,
        error,
      );
      throw error;
    }
  });
};

export const sendTicketResolvedWorkflow = async (
  context: WorkflowContext<{
    userId: string;
    ticketId: string;
    title: string;
  }>,
) => {
  const payload = context.requestPayload;
  if (!payload) return;
  const user = await getUserPayload(payload.userId);
  if (!user) return;

  await context.run("send-ticket-resolved-email", async () => {
    try {
      await emailService.sendTicketResolvedEmail({
        user,
        ticketId: payload.ticketId,
        title: payload.title,
      });
    } catch (error: any) {
      logger.error(
        `Failed to send ticket resolved email for user ${user.email}:`,
        error,
      );
      throw error;
    }
  });
};
