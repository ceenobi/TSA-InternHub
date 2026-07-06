// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("~/.server/config/email", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("~/.server/utils/email-templates", () => ({
  verifyAccountTemplate: vi.fn(() => "<html>verify</html>"),
  forgotPasswordTemplate: vi.fn(() => "<html>forgot</html>"),
  passwordResetSuccessTemplate: vi.fn(() => "<html>reset-success</html>"),
  InvitationCodeTemplate: vi.fn(() => "<html>invite-code</html>"),
  deleteAccountRequestTemplate: vi.fn(() => "<html>delete-account</html>"),
  adminInviteTemplate: vi.fn(() => "<html>admin-invite</html>"),
  projectStartedTemplate: vi.fn(() => "<html>project-started</html>"),
  projectCompletedTemplate: vi.fn(() => "<html>project-completed</html>"),
  stageFailedTemplate: vi.fn(() => "<html>stage-failed</html>"),
  taskOverdueTemplate: vi.fn(() => "<html>task-overdue</html>"),
  submissionGradedTemplate: vi.fn(() => "<html>submission-graded</html>"),
  ticketConfirmationTemplate: vi.fn(() => "<html>ticket-confirmation</html>"),
  ticketAssignedTemplate: vi.fn(() => "<html>ticket-assigned</html>"),
  ticketResolvedTemplate: vi.fn(() => "<html>ticket-resolved</html>"),
}));

import emailService from "../email.service";
import { sendEmail } from "~/.server/config/email";

const mockUser = {
  id: "user-1",
  name: "John Doe",
  email: "john@example.com",
  role: "user" as const,
  emailVerified: true,
  isOnboarded: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("emailService", () => {
  describe("sendVerificationEmail", () => {
    it("sends verification email with correct subject", async () => {
      await emailService.sendVerificationEmail({ user: mockUser, link: "http://example.com/verify" });

      expect(sendEmail).toHaveBeenCalledWith({
        email: "john@example.com",
        subject: "Verify your account",
        message: "<html>verify</html>",
      });
    });
  });

  describe("sendForgotPasswordEmail", () => {
    it("sends forgot password email", async () => {
      await emailService.sendForgotPasswordEmail({ user: mockUser, link: "http://example.com/reset" });

      expect(sendEmail).toHaveBeenCalledWith({
        email: "john@example.com",
        subject: "Forgot your password",
        message: "<html>forgot</html>",
      });
    });
  });

  describe("sendPasswordResetSuccessEmail", () => {
    it("sends password reset success email", async () => {
      await emailService.sendPasswordResetSuccessEmail({ user: mockUser });

      expect(sendEmail).toHaveBeenCalledWith({
        email: "john@example.com",
        subject: "Password reset successful",
        message: "<html>reset-success</html>",
      });
    });
  });

  describe("sendInviteCodeEmail", () => {
    it("sends invite code email", async () => {
      await emailService.sendInviteCodeEmail({
        user: mockUser,
        inviteCode: "INV-123",
        cohort: "June-2025",
        link: "http://example.com/register",
      });

      expect(sendEmail).toHaveBeenCalledWith({
        email: "john@example.com",
        subject: "Invitation Code",
        message: "<html>invite-code</html>",
      });
    });
  });

  describe("sendDeleteAccountRequestEmail", () => {
    it("sends delete account request email", async () => {
      await emailService.sendDeleteAccountRequestEmail({ user: mockUser, link: "http://example.com/delete" });

      expect(sendEmail).toHaveBeenCalledWith({
        email: "john@example.com",
        subject: "Delete Account Request",
        message: "<html>delete-account</html>",
      });
    });
  });

  describe("sendAdminInviteEmail", () => {
    it("sends admin invite email", async () => {
      await emailService.sendAdminInviteEmail({ user: mockUser, link: "http://example.com/admin", password: "Pass123!" });

      expect(sendEmail).toHaveBeenCalledWith({
        email: "john@example.com",
        subject: "Admin Invite",
        message: "<html>admin-invite</html>",
      });
    });
  });

  describe("sendProjectStartedEmail", () => {
    it("sends project started email", async () => {
      await emailService.sendProjectStartedEmail({ user: mockUser, projectTitle: "My Project", link: "http://example.com/project" });

      expect(sendEmail).toHaveBeenCalledWith({
        email: "john@example.com",
        subject: "Project Started: My Project",
        message: "<html>project-started</html>",
      });
    });
  });

  describe("sendProjectCompletedEmail", () => {
    it("sends project completed email", async () => {
      await emailService.sendProjectCompletedEmail({ user: mockUser, projectTitle: "My Project", link: "http://example.com/project" });

      expect(sendEmail).toHaveBeenCalledWith({
        email: "john@example.com",
        subject: "Project Completed: My Project",
        message: "<html>project-completed</html>",
      });
    });
  });

  describe("sendStageFailedEmail", () => {
    it("sends stage failed email", async () => {
      await emailService.sendStageFailedEmail({ user: mockUser, stageTitle: "Stage 1", projectTitle: "My Project" });

      expect(sendEmail).toHaveBeenCalledWith({
        email: "john@example.com",
        subject: "Stage Deadline Passed: Stage 1",
        message: "<html>stage-failed</html>",
      });
    });
  });

  describe("sendTaskOverdueEmail", () => {
    it("sends task overdue email", async () => {
      await emailService.sendTaskOverdueEmail({ user: mockUser, taskTitle: "Task 1", stageTitle: "Stage 1" });

      expect(sendEmail).toHaveBeenCalledWith({
        email: "john@example.com",
        subject: "Task Overdue: Task 1",
        message: "<html>task-overdue</html>",
      });
    });
  });

  describe("sendSubmissionGradedEmail", () => {
    it("sends submission graded email", async () => {
      await emailService.sendSubmissionGradedEmail({ user: mockUser, taskTitle: "Task 1", score: 85, maxScore: 100, link: "http://example.com/task" });

      expect(sendEmail).toHaveBeenCalledWith({
        email: "john@example.com",
        subject: "Submission Graded: Task 1",
        message: "<html>submission-graded</html>",
      });
    });
  });

  describe("sendTicketConfirmationEmail", () => {
    it("sends ticket confirmation email", async () => {
      await emailService.sendTicketConfirmationEmail({
        user: mockUser,
        ticketId: "TK-1234",
        title: "Cannot log in",
        description: "Help",
        priority: "high",
      });

      expect(sendEmail).toHaveBeenCalledWith({
        email: "john@example.com",
        subject: "Ticket Confirmation - TK-1234",
        message: "<html>ticket-confirmation</html>",
      });
    });
  });

  describe("sendTicketAssignedEmail", () => {
    it("sends ticket assigned email", async () => {
      await emailService.sendTicketAssignedEmail({ user: mockUser, ticketId: "TK-1234", title: "Cannot log in" });

      expect(sendEmail).toHaveBeenCalledWith({
        email: "john@example.com",
        subject: "Ticket Assigned - TK-1234",
        message: "<html>ticket-assigned</html>",
      });
    });
  });

  describe("sendTicketResolvedEmail", () => {
    it("sends ticket resolved email", async () => {
      await emailService.sendTicketResolvedEmail({ user: mockUser, ticketId: "TK-1234", title: "Cannot log in" });

      expect(sendEmail).toHaveBeenCalledWith({
        email: "john@example.com",
        subject: "Ticket Resolved - TK-1234",
        message: "<html>ticket-resolved</html>",
      });
    });
  });
});
