import { sendEmail } from "../config/email";
import type { User } from "../services/better-auth";
import {
  adminInviteTemplate,
  deleteAccountRequestTemplate,
  forgotPasswordTemplate,
  InvitationCodeTemplate,
  passwordResetSuccessTemplate,
  projectCompletedTemplate,
  projectStartedTemplate,
  stageFailedTemplate,
  submissionGradedTemplate,
  taskOverdueTemplate,
  ticketAssignedTemplate,
  ticketConfirmationTemplate,
  ticketResolvedTemplate,
  verifyAccountTemplate,
} from "../utils/email-templates";

const emailService = {
  sendVerificationEmail: async ({
    user,
    link,
  }: {
    user: User;
    link: string;
  }) => {
    const htmlBody = verifyAccountTemplate(user.name, link);
    await sendEmail({
      email: user.email,
      subject: "Verify your account",
      message: htmlBody,
    });
  },
  sendForgotPasswordEmail: async ({
    user,
    link,
  }: {
    user: User;
    link: string;
  }) => {
    const htmlBody = forgotPasswordTemplate(user.name, link);
    await sendEmail({
      email: user.email,
      subject: "Forgot your password",
      message: htmlBody,
    });
  },
  sendPasswordResetSuccessEmail: async ({ user }: { user: User }) => {
    const htmlBody = passwordResetSuccessTemplate(user.name);
    await sendEmail({
      email: user.email,
      subject: "Password reset successful",
      message: htmlBody,
    });
  },
  sendInviteCodeEmail: async ({
    user,
    inviteCode,
    cohort,
    link,
  }: {
    user: User;
    inviteCode: string;
    cohort: string;
    link: string;
  }) => {
    const htmlBody = InvitationCodeTemplate(
      user.name,
      inviteCode,
      cohort,
      link,
    );
    await sendEmail({
      email: user.email,
      subject: "Invitation Code",
      message: htmlBody,
    });
  },
  sendDeleteAccountRequestEmail: async ({
    user,
    link,
  }: {
    user: User;
    link: string;
  }) => {
    const htmlBody = deleteAccountRequestTemplate(user.name, link);
    await sendEmail({
      email: user.email,
      subject: "Delete Account Request",
      message: htmlBody,
    });
  },
  sendAdminInviteEmail: async ({
    user,
    link,
    password,
  }: {
    user: User;
    link: string;
    password: string;
  }) => {
    const htmlBody = adminInviteTemplate(user.name, link, password);
    await sendEmail({
      email: user.email,
      subject: "Admin Invite",
      message: htmlBody,
    });
  },
  sendProjectStartedEmail: async ({
    user,
    projectTitle,
    link,
  }: {
    user: User;
    projectTitle: string;
    link: string;
  }) => {
    const htmlBody = projectStartedTemplate(user.name, projectTitle, link);
    await sendEmail({
      email: user.email,
      subject: `Project Started: ${projectTitle}`,
      message: htmlBody,
    });
  },
  sendProjectCompletedEmail: async ({
    user,
    projectTitle,
    link,
  }: {
    user: User;
    projectTitle: string;
    link: string;
  }) => {
    const htmlBody = projectCompletedTemplate(user.name, projectTitle, link);
    await sendEmail({
      email: user.email,
      subject: `Project Completed: ${projectTitle}`,
      message: htmlBody,
    });
  },
  sendStageFailedEmail: async ({
    user,
    stageTitle,
    projectTitle,
  }: {
    user: User;
    stageTitle: string;
    projectTitle: string;
  }) => {
    const htmlBody = stageFailedTemplate(user.name, stageTitle, projectTitle);
    await sendEmail({
      email: user.email,
      subject: `Stage Deadline Passed: ${stageTitle}`,
      message: htmlBody,
    });
  },
  sendTaskOverdueEmail: async ({
    user,
    taskTitle,
    stageTitle,
  }: {
    user: User;
    taskTitle: string;
    stageTitle: string;
  }) => {
    const htmlBody = taskOverdueTemplate(user.name, taskTitle, stageTitle);
    await sendEmail({
      email: user.email,
      subject: `Task Overdue: ${taskTitle}`,
      message: htmlBody,
    });
  },
  sendSubmissionGradedEmail: async ({
    user,
    taskTitle,
    score,
    maxScore,
    link,
  }: {
    user: User;
    taskTitle: string;
    score: number;
    maxScore: number;
    link: string;
  }) => {
    const htmlBody = submissionGradedTemplate(
      user.name,
      taskTitle,
      score,
      maxScore,
      link,
    );
    await sendEmail({
      email: user.email,
      subject: `Submission Graded: ${taskTitle}`,
      message: htmlBody,
    });
  },
  sendTicketConfirmationEmail: async ({
    user,
    ticketId,
    title,
    description,
    priority,
  }: {
    user: User;
    ticketId: string;
    title: string;
    description: string;
    priority: string;
  }) => {
    const htmlBody = ticketConfirmationTemplate(
      user.name,
      ticketId,
      title,
      description,
      priority,
    );
    await sendEmail({
      email: user.email,
      subject: `Ticket Confirmation - ${ticketId}`,
      message: htmlBody,
    });
  },
  sendTicketAssignedEmail: async ({
    user,
    ticketId,
    title,
  }: {
    user: User;
    ticketId: string;
    title: string;
  }) => {
    const htmlBody = ticketAssignedTemplate(user.name, ticketId, title);
    await sendEmail({
      email: user.email,
      subject: `Ticket Assigned - ${ticketId}`,
      message: htmlBody,
    });
  },
  sendTicketResolvedEmail: async ({
    user,
    ticketId,
    title,
  }: {
    user: User;
    ticketId: string;
    title: string;
  }) => {
    const htmlBody = ticketResolvedTemplate(user.name, ticketId, title);
    await sendEmail({
      email: user.email,
      subject: `Ticket Resolved - ${ticketId}`,
      message: htmlBody,
    });
  },
};

export default emailService;
