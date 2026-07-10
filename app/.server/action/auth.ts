import z from "zod";
import {
  adminInviteSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sendInviteCodeSchema,
  signInSchema,
  signUpSchema,
  onboardingSchema,
  updateProfileSchema,
  updateUserAvatarSchema,
} from "~/lib/schemaValidation";
import { tryCatchWrapper } from "~/lib/tryCatchWrapper";
import { generateInviteCode } from "~/lib/utils";
import type {
  AdminInviteSchemaType,
  ChangePasswordSchemaType,
  ForgotPasswordSchemaType,
  OnboardingSchemaType,
  ResetPasswordSchemaType,
  SendInviteCodeSchemaType,
  SignInSchemaType,
  SignUpSchemaType,
  UpdateProfileSchemaType,
  UpdateUserAvatarSchemaType,
} from "~/types";
import { env } from "../config/keys";
import logger from "../config/logger";
import Cohort from "../model/cohort";
import InviteCode from "../model/inviteCode";
import User from "../model/user";
import { AuditLogService } from "../services/auditlog.service";
import { auth } from "../services/better-auth";
import { NotificationService } from "../services/notification.service";
import { fetchWithCache, invalidateCache } from "../utils/cache";
import { checkRateLimit } from "../utils/rate-limit";
import { workflowClient } from "../workflows/client";

export async function sendInviteCode(
  request: Request,
  payload: SendInviteCodeSchemaType,
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session) {
      logger.error("Unauthorized");
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const { program: userProgram } = session.user;
    const result = sendInviteCodeSchema.safeParse(payload);
    if (!result.success) {
      logger.error({ result }, "Invalid form data");
      return Response.json(
        {
          success: false,
          message: "Invalid form data",
          errors: z.treeifyError(result.error),
        },
        { status: 400 },
      );
    }
    const { name, email, cohortName, program } = result.data;
    if (program !== userProgram) {
      logger.error("Unauthorized");
      return Response.json(
        {
          success: false,
          message: "You can only manage cohorts for your program",
        },
        { status: 400 },
      );
    }
    const inviteCode = generateInviteCode();
    const inviteCodeExpires = new Date();
    inviteCodeExpires.setHours(inviteCodeExpires.getHours() + 24);

    const cohort = await Cohort.findOne({
      cohort: cohortName,
      program: userProgram,
    }).lean();
    if (!cohort) {
      return Response.json(
        { success: false, message: "Cohort not found, try creating one first" },
        { status: 400 },
      );
    }
    await InviteCode.findOneAndUpdate(
      { email },
      {
        inviteCode,
        expiresAt: inviteCodeExpires,
        cohort: cohort._id,
      },
      { upsert: true, returnDocument: "after" },
    );

    const user = { name, email };
    await workflowClient.trigger({
      url: `${env.clientUrl}/api/v1/workflow/invitation-code`,
      body: {
        user,
        inviteCode,
        cohort: cohortName + " " + program.toUpperCase(),
        link: `${env.clientUrl}/auth/register?inviteCode=${inviteCode}`,
      },
    });

    await AuditLogService.record(request, {
      action: "SEND_INVITE_CODE",
      category: "auth",
      description: `Sent invite code to ${email} for ${cohortName}`,
      details: { email, name, cohort: cohortName, program },
    });

    return Response.json(
      {
        success: true,
        message: "Invite code sent to the email address",
      },
      { status: 200 },
    );
  });
}

export async function signUpWithEmailAdmin(
  request: Request,
  payload: AdminInviteSchemaType,
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session) {
      logger.error("Unauthorized");
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    // const { role } = session.user;
    // if (!hasPermission(role, "MANAGE_ROLES")) {
    //   logger.error("Unauthorized");
    //   return Response.json(
    //     { success: false, message: "Unauthorized, insufficient permissions" },
    //     { status: 401 },
    //   );
    // }
    const result = adminInviteSchema.safeParse(payload);
    if (!result.success) {
      logger.error({ result }, "Invalid form data");
      return Response.json(
        {
          success: false,
          message: "Invalid form data",
          errors: z.treeifyError(result.error),
        },
        { status: 400 },
      );
    }
    const response = await auth.api.signUpEmail({
      body: {
        name: result.data.name,
        email: result.data.email,
        password: "Techstudio!!1",
        program: result.data.program,
        role: "admin",
        callbackURL: `${env.clientUrl}/auth/login`,
        isOnboarded: true,
      },
      asResponse: true,
    });

    if (!response.ok) {
      logger.error({ status: response.status }, "Failed to sign up");
      return response;
    }
    const authData = await response.clone().json();
    await workflowClient.trigger({
      url: `${env.clientUrl}/api/v1/workflow/admin-invite`,
      body: {
        user: authData?.user,
        link: `${env.clientUrl}/auth/login`,
        password: "Techstudio!!1",
      },
    });
    await invalidateCache("coordinators");

    await AuditLogService.record(request, {
      action: "ADMIN_SIGNUP",
      category: "auth",
      description: `Created admin account for ${payload.name} (${payload.email})`,
      details: {
        name: payload.name,
        email: payload.email,
        program: payload.program,
      },
    });

    return Response.json({
      success: true,
      message: "Account for " + payload.name + " has been created.",
      email: payload.email,
    });
  });
}

export async function signUpWithEmail(
  request: Request,
  payload: SignUpSchemaType,
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const result = signUpSchema.safeParse(payload);
    if (!result.success) {
      logger.error({ result }, "Invalid form data");
      return Response.json(
        {
          success: false,
          message: "Invalid form data",
          errors: z.treeifyError(result.error),
        },
        { status: 400 },
      );
    }

    const verifyInviteCode = await InviteCode.findOne({
      inviteCode: result.data.inviteCode,
      email: result.data.email,
    })
      .populate("cohort", "program cohort")
      .lean();
    if (!verifyInviteCode) {
      return Response.json(
        {
          success: false,
          message: "Invalid invite code",
        },
        { status: 400 },
      );
    }
    if (verifyInviteCode.inviteCode !== payload.inviteCode) {
      return Response.json(
        {
          success: false,
          message: "Invite code does not match",
        },
        { status: 400 },
      );
    }

    //check expires at
    if (verifyInviteCode.expiresAt && verifyInviteCode.expiresAt < new Date()) {
      return Response.json(
        {
          success: false,
          message: "Invite code has expired",
        },
        { status: 400 },
      );
    }

    const response = await auth.api.signUpEmail({
      body: {
        name: result.data.name,
        email: result.data.email,
        password: result.data.password,
        cohort: verifyInviteCode.cohort?.cohort,
        program: verifyInviteCode.cohort?.program,
        callbackURL: `${env.clientUrl}/account/verify-email`,
      },
      headers: request.headers,
      asResponse: true,
    });

    if (!response.ok) {
      logger.error({ status: response.status }, "Failed to sign up");
      return response;
    }

    // Extract user data and add to cohort
    const authData = await response.clone().json();
    const userId = authData?.user?.id;

    if (userId && verifyInviteCode.cohort) {
      await Cohort.findOneAndUpdate(
        { cohort: verifyInviteCode.cohort.cohort },
        {
          $addToSet: { members: userId },
        },
      );
    }

    //reset invite code
    await InviteCode.findOneAndDelete({ inviteCode: payload.inviteCode });

    await AuditLogService.record(request, {
      action: "USER_SIGNUP",
      category: "auth",
      description: `User ${result.data.name} registered with ${result.data.email}`,
      details: {
        name: result.data.name,
        email: result.data.email,
        program: verifyInviteCode.cohort?.program,
      },
    });

    const newHeaders = new Headers(response.headers);
    return Response.json(
      {
        success: true,
        message:
          "Account created successfully. Please check your email to verify your account.",
        email: payload.email,
      },
      {
        headers: newHeaders,
      },
    );
  });
}

export async function resendVerifyEmail(
  request: Request,
  payload: { email: string },
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    if (!payload.email) {
      return Response.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 },
      );
    }

    const response = await auth.api.sendVerificationEmail({
      body: {
        email: payload.email,
        callbackURL: `${env.clientUrl}/account/verify-email`,
      },
      headers: request.headers,
      asResponse: true,
    });

    if (!response.ok) {
      logger.error(
        { status: response.status },
        "Failed to resend verify email",
      );
      return response;
    }

    return Response.json(
      {
        success: true,
        message: "Verify email link has been resent",
      },
      { status: 200 },
    );
  });
}

export async function signInWithEmail(
  request: Request,
  payload: SignInSchemaType,
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const result = signInSchema.safeParse(payload);
    if (!result.success) {
      logger.error({ result }, "Invalid form data");
      return Response.json(
        {
          success: false,
          message: "Invalid form data",
          errors: z.treeifyError(result.error),
        },
        { status: 400 },
      );
    }

    const response = await auth.api.signInEmail({
      body: {
        email: result.data.email,
        password: result.data.password,
        callbackURL: `${env.clientUrl}`,
      },
      headers: request.headers,
      asResponse: true,
    });

    if (!response.ok) {
      if (response.status === 403) {
        const errorData = await response.json();
        logger.debug({ errorData }, "Better Auth 403 error data");
      }

      // 1. Check for account suspension / failed attempts
      if (response.status === 401) {
        const user = await User.findOneAndUpdate(
          { email: result.data.email },
          { $inc: { failedLoginAttempts: 1 } },
          { returnDocument: "after" },
        );

        if (user) {
          if (user.isSuspended) {
            return Response.json(
              {
                success: false,
                message:
                  "This account has been locked due to too many failed attempts. Please reset your password to unlock it.",
              },
              { status: 403 },
            );
          }

          if (user.failedLoginAttempts >= 5) {
            await User.updateOne(
              { _id: user._id },
              { $set: { isSuspended: true } },
            );

            // Record high-risk audit log
            await AuditLogService.record(request, {
              action: "ACCOUNT_LOCKED",
              category: "security",
              description: "Account locked after 5 failed login attempts",
              details: { email: result.data.email },
            });

            NotificationService.send({
              userId: user._id.toString(),
              type: "account_locked",
              title: "Account Locked",
              message:
                "Your account has been locked due to too many failed login attempts.",
            });

            return Response.json(
              {
                success: false,
                message:
                  "Account locked due to too many failed attempts. A notification has been sent to your email.",
              },
              { status: 403 },
            );
          }
        }
      }

      logger.error({ status: response.status }, "Failed to sign in");
      return response;
    }

    // 3. Reset failed attempts on success
    await User.updateOne(
      { email: result.data.email },
      { failedLoginAttempts: 0 },
    );

    await AuditLogService.record(request, {
      action: "USER_LOGIN",
      category: "auth",
      description: `User ${result.data.email} logged in`,
      details: { email: result.data.email },
    });

    const loggedInUser = await User.findOne({ email: result.data.email })
      .select("_id")
      .lean();
    if (loggedInUser) {
      NotificationService.send({
        userId: loggedInUser._id.toString(),
        type: "account_login",
        title: "New Login",
        message: "A new login was detected on your account.",
      });
    }

    const newHeaders = new Headers(response.headers);
    return Response.json(
      {
        success: true,
        message: "Login successful",
      },
      {
        headers: newHeaders,
      },
    );
  });
}

export async function getSession(request: Request) {
  const url = new URL(request.url);
  const cookie = request.headers.get("Cookie");
  if (!cookie) {
    logger.warn({ url: url.pathname }, "No Cookie header found in request");
  }
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData) {
      logger.info(
        {
          url: url.pathname,
          headers: Object.fromEntries(request.headers.entries()),
        },
        "No session found for request",
      );
      return null;
    }

    return sessionData;
  } catch (error) {
    logger.error(error, "Error in getSession");
    return null;
  }
}

export async function logoutUser(request: Request) {
  return tryCatchWrapper(async () => {
    const response = await auth.api.signOut({
      headers: request.headers,
      asResponse: true,
    });
    if (!response.ok) {
      logger.error({ status: response.status }, "Failed to logout");
      return response;
    }
    const newHeaders = new Headers(response.headers);

    await AuditLogService.record(request, {
      action: "USER_LOGOUT",
      category: "auth",
      description: "User logged out",
    });

    return Response.json(
      {
        success: true,
        message: "Logged out successfully.",
      },
      {
        headers: newHeaders,
      },
    );
  });
}

export async function updateProfileRequest(
  request: Request,
  payload: UpdateProfileSchemaType,
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session) {
      logger.error("Unauthorized");
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const result = updateProfileSchema.safeParse(payload);
    if (!result.success) {
      logger.error("Invalid profile data format");
      return Response.json(
        {
          success: false,
          message: "Invalid dataschema",
          errors: z.treeifyError(result.error),
        },
        { status: 400 },
      );
    }
    const response = await auth.api.updateUser({
      body: {
        name: result.data.name,
        phone: result.data.phone,
        gender: result.data.gender,
      },
      headers: request.headers,
      asResponse: true,
    });
    if (!response.ok) {
      logger.error({ status: response.status }, "Failed to update profile");
      return response;
    }
    // Record audit log
    await AuditLogService.record(request, {
      action: "PROFILE_UPDATE",
      category: "security",
      description: "Updated profile information",
      details: {
        name: result.data.name,
        phone: result.data.phone,
        gender: result.data.gender,
      },
    });

    NotificationService.send({
      userId: session.user.id,
      type: "profile_updated",
      title: "Profile Updated",
      message: "Your profile information has been updated.",
    });

    return Response.json(
      { success: true, message: "Profile updated successfully" },
      { status: 200 },
    );
  });
}

export async function onboardUser(request: Request, payload: OnboardingSchemaType & { image?: string; imagePublicId?: string }) {
  return tryCatchWrapper(async () => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const result = onboardingSchema.safeParse(payload);
    if (!result.success) {
      return Response.json(
        {
          success: false,
          message: "Invalid form data",
          errors: z.treeifyError(result.error),
        },
        { status: 400 },
      );
    }

    await auth.api.updateUser({
      body: {
        name: result.data.name,
        phone: result.data.phone || "",
        gender: result.data.gender || "",
        isOnboarded: true,
        ...(payload.image ? { image: payload.image } : {}),
        ...(payload.imagePublicId ? { imagePublicId: payload.imagePublicId } : {}),
      },
      headers: request.headers,
      asResponse: true,
    });

    await AuditLogService.record(request, {
      action: "ONBOARDING_COMPLETE",
      category: "auth",
      description: "User completed onboarding",
      details: { name: result.data.name },
    });

    return Response.json(
      { success: true, message: "Onboarding complete. Welcome!" },
      { status: 200 },
    );
  });
}

export async function updateAvatarRequest(
  request: Request,
  payload: UpdateUserAvatarSchemaType,
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session) {
      logger.error("Unauthorized");
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const result = updateUserAvatarSchema.safeParse(payload);
    if (!result.success) {
      logger.error("Invalid data format");
      return Response.json(
        {
          success: false,
          message: "Invalid dataschema",
          errors: z.treeifyError(result.error),
        },
        { status: 400 },
      );
    }
    const response = await auth.api.updateUser({
      body: {
        image: result.data.image,
        imagePublicId: result.data.imagePublicId,
      },
      headers: request.headers,
      asResponse: true,
    });
    if (!response.ok) {
      logger.error(
        { status: response.status },
        "Failed to update profile avatar",
      );
      return response;
    }
    // Record audit log
    await AuditLogService.record(request, {
      action: "PROFILE_UPDATE",
      category: "security",
      description: "Updated profile avatar",
      details: {
        image: result.data.image,
        imagePublicId: result.data.imagePublicId,
      },
    });

    NotificationService.send({
      userId: session.user.id,
      type: "profile_updated",
      title: "Profile Updated",
      message: "Your profile avatar has been updated.",
    });

    return Response.json(
      { success: true, message: "Avatar updated successfully" },
      { status: 200 },
    );
  });
}

export async function forgotPasswordRequest(
  request: Request,
  payload: ForgotPasswordSchemaType,
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const result = forgotPasswordSchema.safeParse(payload);
    if (!result.success) {
      logger.error({ result }, "Invalid data");
      return Response.json(
        {
          success: false,
          message: "Invalid form data",
          errors: z.treeifyError(result.error),
        },
        { status: 400 },
      );
    }
    const response = await auth.api.requestPasswordReset({
      body: {
        email: payload.email,
        redirectTo: `${env.clientUrl}/auth/password-reset`,
      },
      asResponse: true,
    });
    if (!response.ok) {
      logger.error(
        {
          status: response.status,
        },
        "Failed to request password reset email link",
      );
      return response;
    }

    await AuditLogService.record(request, {
      action: "FORGOT_PASSWORD",
      category: "auth",
      description: `Password reset requested for ${payload.email}`,
      details: { email: payload.email },
    });

    return Response.json({
      success: true,
      message:
        "If your email is registered, we'll send you a password reset link",
    });
  });
}

export async function resetPasswordRequest(
  request: Request,
  payload: ResetPasswordSchemaType,
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const url = new URL(request.url);
    const token = url.searchParams.get("token") || undefined;
    if (!token) {
      return Response.json(
        {
          success: false,
          message: "Token is required",
        },
        { status: 400 },
      );
    }
    const result = resetPasswordSchema.safeParse(payload);
    if (!result.success) {
      logger.error({ result }, "Invalid reset password data");
      return Response.json(
        {
          success: false,
          message: "Invalid form data",
          errors: z.treeifyError(result.error),
        },
        { status: 400 },
      );
    }
    const response = await auth.api.resetPassword({
      body: {
        newPassword: result.data.newPassword,
        token,
      },
      asResponse: true,
    });
    if (!response.ok) {
      logger.error({ status: response.status }, "Failed to reset password");
      return response;
    }

    await AuditLogService.record(request, {
      action: "RESET_PASSWORD",
      category: "auth",
      description: "Password reset completed",
    });

    return Response.json({
      success: true,
      message: "Password reset successful",
    });
  });
}

export async function updatePasswordRequest(
  request: Request,
  payload: ChangePasswordSchemaType,
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session) {
      logger.error("Unauthorized");
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const result = changePasswordSchema.safeParse(payload);
    if (!result.success) {
      logger.error("Invalid data format");
      return Response.json(
        {
          success: false,
          message: "Invalid dataschema",
          errors: z.treeifyError(result.error),
        },
        { status: 400 },
      );
    }
    const response = await auth.api.changePassword({
      body: {
        newPassword: result.data.newPassword,
        currentPassword: result.data.currentPassword,
        revokeOtherSessions: true,
      },
      headers: request.headers,
      asResponse: true,
    });
    if (!response.ok) {
      logger.error({ status: response.status }, "Failed to change password");
      return response;
    }
    const user = { name: session.user.name, email: session.user.email };
    await workflowClient.trigger({
      url: `${env.clientUrl}/api/v1/workflow/password-reset-success`,
      body: {
        user,
      },
    });
    // Record audit log
    await AuditLogService.record(request, {
      action: "PASSWORD_CHANGE",
      category: "security",
      description: "Changed password",
    });

    NotificationService.send({
      userId: session.user.id,
      type: "password_changed",
      title: "Password Changed",
      message: "Your password has been changed successfully.",
    });

    return Response.json(
      { success: true, message: "Password updated successfully" },
      { status: 200 },
    );
  });
}

export async function listUserSessions(request: Request) {
  return tryCatchWrapper(async () => {
    const response = await auth.api.listSessions({
      headers: request.headers,
      asResponse: true,
    });
    if (!response.ok) {
      logger.error({ status: response.status }, "Failed to list sessions");
      return Response.json(
        { success: false, body: [] },
        { status: response.status },
      );
    }
    const sessions = await response.json();
    return Response.json({
      success: true,
      body: sessions,
    });
  });
}

export async function revokeUserSession(
  request: Request,
  payload: { token: string },
) {
  return tryCatchWrapper(async () => {
    const response = await auth.api.revokeSession({
      body: {
        token: payload.token,
      },
      headers: request.headers,
      asResponse: true,
    });
    if (!response.ok) {
      logger.error({ status: response.status }, "Failed to revoke session");
      return response;
    }

    // Record audit log
    await AuditLogService.record(request, {
      action: "SESSION_REVOKE",
      category: "security",
      description: "Revoked active session remotely",
      details: { sessionId: payload.token },
    });

    const currentSession = await auth.api.getSession({
      headers: request.headers,
    });
    if (currentSession?.user?.id) {
      NotificationService.send({
        userId: currentSession.user.id,
        type: "session_revoked",
        title: "Session Revoked",
        message: "A device session was revoked from your account.",
      });
    }

    return Response.json({
      success: true,
      message: "Session revoked successfully",
    });
  });
}

export async function requestDeleteAccount(request: Request) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session) {
      logger.error("Unauthorized");
      return Response.json(
        { success: false, message: "Unauthorized, please log in first" },
        { status: 401 },
      );
    }
    const response = await auth.api.deleteUser({
      body: {
        callbackURL: `${env.clientUrl}/delete-account-confirmation`,
      },
      headers: request.headers,
      asResponse: true,
    });
    if (!response.ok) {
      logger.error(
        { status: response.status },
        "Failed to request delete account",
      );
      return response;
    }
    // Record audit log
    await AuditLogService.record(request, {
      action: "DELETE_ACCOUNT_REQUEST",
      category: "security",
      description: "User requested account deletion",
      details: {
        name: session.user.name,
        email: session.user.email,
      },
    });
    return Response.json({
      success: true,
      message:
        "Account deletion request sent. Please check your email to confirm.",
    });
  });
}

export async function updateAdminRole(
  request: Request,
  payload: { role: "admin" | "super_admin"; id: string },
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "strict");
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session) {
      logger.error("Unauthorized");
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    // const { role } = session.user;
    // if (!hasPermission(role, "MANAGE_ROLES")) {
    //   logger.error("Unauthorized");
    //   return Response.json(
    //     { success: false, message: "Unauthorized, insufficient permissions" },
    //     { status: 401 },
    //   );
    // }
    if (!payload) {
      logger.error("Invalid payload, role and id are required");
      return Response.json(
        {
          success: false,
          message: "Invalid payload",
        },
        { status: 400 },
      );
    }
    //find user
    const findUser = await User.findById(payload.id).lean();
    if (!findUser) {
      logger.error("User not found");
      return Response.json(
        {
          success: false,
          message: "Cohort not found",
        },
        { status: 400 },
      );
    }
    //update cohort status
    const user = await User.findByIdAndUpdate(
      payload.id,
      { role: payload.role },
      { returnDocument: "after" },
    );
    await invalidateCache("coordinators");
    await AuditLogService.record(request, {
      action: "UPDATE_ROLE",
      category: "auth",
      description: `Role updated for ${findUser.name}`,
      details: {
        name: findUser.name,
        email: findUser.email,
        role: payload.role,
      },
    });

    NotificationService.send({
      userId: payload.id,
      type: "role_updated",
      title: "Role Updated",
      message: `Your role has been updated to ${payload.role}.`,
      metadata: { role: payload.role },
    });

    return Response.json(
      {
        success: true,
        message: `Role updated for ${findUser.name}`,
        user,
      },
      { status: 200 },
    );
  });
}

export async function getAMember(
  request: Request,
  memberId: string,
) {
  return tryCatchWrapper(async () => {
    await checkRateLimit(request, "general");
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session) {
      logger.error("Unauthorized, session not found");
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const cacheKey = `member-profile:${memberId}`;
    const member = await fetchWithCache(cacheKey, 3600, async () => {
      return await User.findById(memberId).lean();
    });
    if (!member) {
      logger.error("Member not found");
      return Response.json(
        { success: false, message: "Member not found" },
        { status: 404 },
      );
    }
    return Response.json(
      {
        success: true,
        message: "Member profile retrieved",
        body:member,
      },
      { status: 200 },
    );
  });
}
