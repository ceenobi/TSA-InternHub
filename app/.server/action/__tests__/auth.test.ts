// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

type AnyObj = Record<string, any>;

function mockResponse(data: AnyObj, status = 200) {
  const headers = new Headers({ "set-cookie": "session=test; path=/" });
  return {
    ok: status >= 200 && status < 300,
    status,
    headers,
    json: vi.fn().mockResolvedValue(data),
    clone: vi.fn(function () {
      return mockResponse(data, status);
    }),
  };
}

function queryBuilder(result: AnyObj | AnyObj[] | null) {
  const q = vi.fn(() => q) as any;
  q.lean = vi.fn(() => q);
  q.select = vi.fn(() => q);
  q.populate = vi.fn(() => q);
  q.sort = vi.fn(() => q);
  q.skip = vi.fn(() => q);
  q.limit = vi.fn(() => q);
  q.then = (onfulfilled: any) => Promise.resolve(result).then(onfulfilled);
  q.exec = () => Promise.resolve(result);
  return q;
}

const { mockAuthApi, mockWorkflowTrigger, mockNotificationSend } = vi.hoisted(() => ({
  mockAuthApi: {
    getSession: vi.fn(),
    signUpEmail: vi.fn(),
    signInEmail: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
    revokeSession: vi.fn(),
    deleteUser: vi.fn(),
    sendVerificationEmail: vi.fn(),
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
    listSessions: vi.fn(),
  },
  mockWorkflowTrigger: vi.fn(),
  mockNotificationSend: vi.fn(),
}));

vi.mock("~/.server/services/better-auth", () => ({
  auth: { api: mockAuthApi },
}));

vi.mock("~/.server/config/logger", () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("~/.server/model/cohort", () => ({
  default: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock("~/.server/model/inviteCode", () => ({
  default: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
  },
}));

vi.mock("~/.server/model/user", () => ({
  default: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock("~/.server/services/auditlog.service", () => ({
  AuditLogService: { record: vi.fn() },
}));

vi.mock("~/.server/services/notification.service", () => ({
  NotificationService: { send: mockNotificationSend },
}));

vi.mock("~/.server/utils/cache", () => ({
  fetchWithCache: vi.fn(async (_key: string, _ttl: number, fn: () => any) => fn()),
  invalidateCache: vi.fn(),
}));

vi.mock("~/.server/utils/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("~/.server/workflows/client", () => ({
  workflowClient: { trigger: mockWorkflowTrigger },
}));

vi.mock("~/.server/config/keys", () => ({
  env: { clientUrl: "http://localhost:3700" },
}));

import {
  sendInviteCode,
  signUpWithEmail,
  signUpWithEmailAdmin,
  resendVerifyEmail,
  signInWithEmail,
  getSession,
  logoutUser,
  updateProfileRequest,
  updateAvatarRequest,
  forgotPasswordRequest,
  resetPasswordRequest,
  updatePasswordRequest,
  revokeUserSession,
  requestDeleteAccount,
  updateAdminRole,
  getAMember,
  listUserSessions,
} from "../auth";
import Cohort from "~/.server/model/cohort";
import InviteCode from "~/.server/model/inviteCode";
import User from "~/.server/model/user";
import { AuditLogService } from "~/.server/services/auditlog.service";
import { checkRateLimit } from "~/.server/utils/rate-limit";
import { invalidateCache } from "~/.server/utils/cache";

const hourMs = 60 * 60 * 1000;
const mockSession = {
  user: {
    id: "admin-1",
    name: "Admin",
    email: "admin@example.com",
    role: "admin",
    program: "full-stack",
    isOnboarded: true,
    emailVerified: true,
  },
  session: { token: "mock-token" },
};

const mockRequest = new Request("http://localhost:3700", {
  headers: { "Content-Type": "application/json" },
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue(undefined as any);
  vi.mocked(mockAuthApi.getSession).mockResolvedValue(mockSession as any);
  vi.mocked(mockAuthApi.signUpEmail).mockResolvedValue(mockResponse({ user: { id: "user-1" } }));
  vi.mocked(mockAuthApi.signInEmail).mockResolvedValue(mockResponse({}));
  vi.mocked(mockAuthApi.updateUser).mockResolvedValue(mockResponse({}));
  vi.mocked(mockAuthApi.signOut).mockResolvedValue(mockResponse({}));
  vi.mocked(mockAuthApi.revokeSession).mockResolvedValue(mockResponse({}));
  vi.mocked(mockAuthApi.deleteUser).mockResolvedValue(mockResponse({}));
  vi.mocked(mockAuthApi.sendVerificationEmail).mockResolvedValue(mockResponse({}));
  vi.mocked(mockAuthApi.requestPasswordReset).mockResolvedValue(mockResponse({}));
  vi.mocked(mockAuthApi.resetPassword).mockResolvedValue(mockResponse({}));
  vi.mocked(mockAuthApi.changePassword).mockResolvedValue(mockResponse({}));
  vi.mocked(mockAuthApi.listSessions).mockResolvedValue(mockResponse([]));
});

function jsonResponse(response: Response) {
  return response.json();
}

describe("sendInviteCode", () => {
  const validPayload = {
    name: "John Doe",
    email: "john@example.com",
    cohortName: "June-2025",
    program: "full-stack" as const,
  };

  it("returns 401 if not authenticated", async () => {
    vi.mocked(mockAuthApi.getSession).mockResolvedValue(null);
    const response = await sendInviteCode(mockRequest, validPayload);
    expect(response.status).toBe(401);
    const data = await jsonResponse(response);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Unauthorized");
  });

  it("returns 400 if program does not match", async () => {
    const response = await sendInviteCode(mockRequest, { ...validPayload, program: "product-design" });
    expect(response.status).toBe(400);
    const data = await jsonResponse(response);
    expect(data.success).toBe(false);
    expect(data.message).toBe("You can only manage cohorts for your program");
  });

  it("returns 400 if cohort not found", async () => {
    vi.mocked(Cohort.findOne).mockReturnValue(queryBuilder(null));
    const response = await sendInviteCode(mockRequest, validPayload);
    expect(response.status).toBe(400);
    const data = await jsonResponse(response);
    expect(data.message).toBe("Cohort not found, try creating one first");
  });

  it("creates invite code and triggers workflow on success", async () => {
    const mockCohort = { _id: "cohort-id", cohort: "JUNE-2025", program: "full-stack" };
    vi.mocked(Cohort.findOne).mockReturnValue(queryBuilder(mockCohort));
    vi.mocked(InviteCode.findOneAndUpdate).mockResolvedValue({} as any);

    const response = await sendInviteCode(mockRequest, validPayload);
    expect(response.status).toBe(200);
    const data = await jsonResponse(response);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Invite code sent to the email address");

    expect(InviteCode.findOneAndUpdate).toHaveBeenCalledWith(
      { email: "john@example.com" },
      expect.objectContaining({ inviteCode: expect.any(String) }),
      { upsert: true, returnDocument: "after" },
    );
    expect(mockWorkflowTrigger).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining("workflow/invitation-code"),
      }),
    );
    expect(AuditLogService.record).toHaveBeenCalledWith(
      mockRequest,
      expect.objectContaining({
        action: "SEND_INVITE_CODE",
        category: "auth",
      }),
    );
  });
});

describe("signUpWithEmailAdmin", () => {
  const validPayload = {
    name: "New Admin",
    email: "newadmin@example.com",
    program: "full-stack" as const,
  };

  it("returns 401 if not authenticated", async () => {
    vi.mocked(mockAuthApi.getSession).mockResolvedValue(null);
    const response = await signUpWithEmailAdmin(mockRequest, validPayload);
    expect(response.status).toBe(401);
    const data = await jsonResponse(response);
    expect(data.success).toBe(false);
  });

  it("returns 400 on invalid payload", async () => {
    const response = await signUpWithEmailAdmin(mockRequest, {} as any);
    expect(response.status).toBe(400);
    const data = await jsonResponse(response);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Invalid form data");
  });

  it("calls auth.api.signUpEmail and triggers workflow on success", async () => {
    const response = await signUpWithEmailAdmin(mockRequest, validPayload);
    expect(response.status).toBe(200);
    const data = await jsonResponse(response);
    expect(data.success).toBe(true);
    expect(data.email).toBe("newadmin@example.com");

    expect(mockAuthApi.signUpEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          name: "New Admin",
          email: "newadmin@example.com",
          role: "admin",
        }),
        asResponse: true,
      }),
    );
    expect(mockWorkflowTrigger).toHaveBeenCalled();
    expect(invalidateCache).toHaveBeenCalledWith("coordinators");
    expect(AuditLogService.record).toHaveBeenCalled();
  });

  it("propagates error response if signUpEmail fails", async () => {
    vi.mocked(mockAuthApi.signUpEmail).mockResolvedValue(mockResponse({ message: "Email already exists" }, 400));
    const response = await signUpWithEmailAdmin(mockRequest, validPayload);
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
  });
});

describe("signUpWithEmail", () => {
  const validPayload = {
    name: "John Doe",
    email: "john@example.com",
    password: "SecurePass1!",
    inviteCode: "INV12345",
  };

  const mockInviteCodeRecord = {
    inviteCode: "INV12345",
    email: "john@example.com",
    expiresAt: new Date(Date.now() + hourMs),
    cohort: { _id: "cohort-id", cohort: "JUNE-2025", program: "full-stack" },
  };

  it("returns invalid invite code message if invite code not found", async () => {
    vi.mocked(InviteCode.findOne).mockReturnValue(queryBuilder(null));
    const response = await signUpWithEmail(mockRequest, validPayload);
    expect(response.status).toBe(400);
    const data = await jsonResponse(response);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Invalid invite code");
  });

  it("returns 400 if invite code has expired", async () => {
    vi.mocked(InviteCode.findOne).mockReturnValue(
      queryBuilder({ ...mockInviteCodeRecord, expiresAt: new Date(Date.now() - hourMs) }),
    );
    const response = await signUpWithEmail(mockRequest, validPayload);
    const data = await jsonResponse(response);
    expect(data.message).toBe("Invite code has expired");
    expect(data.success).toBe(false);
  });

  it("signs up user successfully", async () => {
    vi.mocked(InviteCode.findOne).mockReturnValue(queryBuilder(mockInviteCodeRecord));
    const mockCohort = { _id: "cohort-id", cohort: "JUNE-2025", members: [] };
    vi.mocked(Cohort.findOneAndUpdate).mockResolvedValue(mockCohort as any);
    vi.mocked(InviteCode.findOneAndDelete).mockResolvedValue({} as any);

    const response = await signUpWithEmail(mockRequest, validPayload);
    expect(response.status).toBe(200);
    const data = await jsonResponse(response);
    expect(data.success).toBe(true);
    expect(data.message).toContain("Account created successfully");

    expect(mockAuthApi.signUpEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          name: "John Doe",
          email: "john@example.com",
          cohort: "JUNE-2025",
          program: "full-stack",
        }),
        asResponse: true,
      }),
    );
    expect(AuditLogService.record).toHaveBeenCalled();
  });

  it("propagates error if auth API call fails", async () => {
    vi.mocked(InviteCode.findOne).mockReturnValue(queryBuilder(mockInviteCodeRecord));
    vi.mocked(mockAuthApi.signUpEmail).mockResolvedValue(mockResponse({}, 409));

    const response = await signUpWithEmail(mockRequest, validPayload);
    expect(response.ok).toBe(false);
  });
});

describe("resendVerifyEmail", () => {
  it("returns 400 if email is missing", async () => {
    const response = await resendVerifyEmail(mockRequest, { email: "" });
    expect(response.status).toBe(400);
    const data = await jsonResponse(response);
    expect(data.message).toBe("Email is required");
  });

  it("calls sendVerificationEmail and returns success", async () => {
    const response = await resendVerifyEmail(mockRequest, { email: "john@example.com" });
    expect(response.status).toBe(200);
    const data = await jsonResponse(response);
    expect(data.success).toBe(true);

    expect(mockAuthApi.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { email: "john@example.com", callbackURL: expect.stringContaining("verify-email") },
      }),
    );
  });
});

describe("signInWithEmail", () => {
  const validPayload = { email: "john@example.com", password: "SecurePass1!" };

  function mockErrorResponse(data: AnyObj, status: number) {
    return {
      ok: false,
      status,
      json: vi.fn().mockResolvedValue(data),
      clone: vi.fn(function () {
        return mockErrorResponse(data, status);
      }),
      headers: new Headers(),
    };
  }

  it("returns 400 on invalid payload", async () => {
    const response = await signInWithEmail(mockRequest, {} as any);
    expect(response.status).toBe(400);
    const data = await jsonResponse(response);
    expect(data.success).toBe(false);
  });

  it("calls signInEmail and returns success", async () => {
    vi.mocked(User.findOne).mockReturnValue(queryBuilder({ _id: "user-1" }));
    const response = await signInWithEmail(mockRequest, validPayload);
    expect(response.status).toBe(200);
    const data = await jsonResponse(response);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Login successful");

    expect(mockAuthApi.signInEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          email: "john@example.com",
          password: "SecurePass1!",
        }),
      }),
    );
  });

  it("increments failedLoginAttempts and locks account after 5 attempts", async () => {
    vi.mocked(mockAuthApi.signInEmail).mockResolvedValue(mockErrorResponse({}, 401) as any);
    const mockUser = {
      _id: "user-1",
      email: "john@example.com",
      isSuspended: false,
      failedLoginAttempts: 5,
    };
    vi.mocked(User.findOneAndUpdate).mockResolvedValue(mockUser as any);

    const response = await signInWithEmail(mockRequest, validPayload);
    expect(response.status).toBe(403);
    const data = await jsonResponse(response);
    expect(data.message).toContain("Account locked");

    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: "user-1" },
      { $set: { isSuspended: true } },
    );
    expect(mockNotificationSend).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "account_locked",
        userId: "user-1",
      }),
    );
    expect(AuditLogService.record).toHaveBeenCalledWith(
      mockRequest,
      expect.objectContaining({ action: "ACCOUNT_LOCKED" }),
    );
  });

  it("returns isSuspended message when account is already locked", async () => {
    vi.mocked(mockAuthApi.signInEmail).mockResolvedValue(mockErrorResponse({}, 401) as any);
    vi.mocked(User.findOneAndUpdate).mockResolvedValue({
      _id: "user-1",
      isSuspended: true,
      failedLoginAttempts: 3,
    } as any);

    const response = await signInWithEmail(mockRequest, validPayload);
    expect(response.status).toBe(403);
    const data = await jsonResponse(response);
    expect(data.message).toContain("locked");
  });

  it("resets failed attempts on successful login and sends notification", async () => {
    vi.mocked(User.findOne).mockReturnValue(queryBuilder({ _id: "user-1" }));
    const response = await signInWithEmail(mockRequest, validPayload);
    expect(response.status).toBe(200);
    expect(User.updateOne).toHaveBeenCalledWith(
      { email: "john@example.com" },
      { failedLoginAttempts: 0 },
    );
    expect(mockNotificationSend).toHaveBeenCalledWith(
      expect.objectContaining({ type: "account_login", userId: "user-1" }),
    );
    expect(AuditLogService.record).toHaveBeenCalledWith(
      mockRequest,
      expect.objectContaining({ action: "USER_LOGIN" }),
    );
  });
});

describe("getSession", () => {
  it("returns null if no session", async () => {
    vi.mocked(mockAuthApi.getSession).mockResolvedValue(null);
    const result = await getSession(mockRequest);
    expect(result).toBeNull();
  });

  it("returns session data when authenticated", async () => {
    const result = await getSession(mockRequest);
    expect(result).toEqual(mockSession);
  });

  it("returns null on error", async () => {
    vi.mocked(mockAuthApi.getSession).mockRejectedValue(new Error("API error"));
    const result = await getSession(mockRequest);
    expect(result).toBeNull();
  });
});

describe("logoutUser", () => {
  it("calls signOut and returns success", async () => {
    const response = await logoutUser(mockRequest);
    expect(response.status).toBe(200);
    const data = await jsonResponse(response);
    expect(data.success).toBe(true);

    expect(mockAuthApi.signOut).toHaveBeenCalledWith(
      expect.objectContaining({ headers: mockRequest.headers, asResponse: true }),
    );
    expect(AuditLogService.record).toHaveBeenCalledWith(
      mockRequest,
      expect.objectContaining({ action: "USER_LOGOUT" }),
    );
  });

  it("propagates error if signOut fails", async () => {
    vi.mocked(mockAuthApi.signOut).mockResolvedValue(mockResponse({}, 500) as any);
    const response = await logoutUser(mockRequest);
    expect(response.ok).toBe(false);
  });
});

describe("updateProfileRequest", () => {
  const validPayload = {
    name: "Updated Name",
    phone: "+2348012345678",
    gender: "male" as const,
  };

  it("returns 401 if not authenticated", async () => {
    vi.mocked(mockAuthApi.getSession).mockResolvedValue(null);
    const response = await updateProfileRequest(mockRequest, validPayload);
    expect(response.status).toBe(401);
    const data = await jsonResponse(response);
    expect(data.success).toBe(false);
  });

  it("returns 400 on invalid payload", async () => {
    const response = await updateProfileRequest(mockRequest, {} as any);
    expect(response.status).toBe(400);
    const data = await jsonResponse(response);
    expect(data.success).toBe(false);
  });

  it("calls updateUser and sends notification on success", async () => {
    const response = await updateProfileRequest(mockRequest, validPayload);
    expect(response.status).toBe(200);
    const data = await jsonResponse(response);
    expect(data.success).toBe(true);

    expect(mockAuthApi.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { name: "Updated Name", phone: "+2348012345678", gender: "male" },
      }),
    );
    expect(mockNotificationSend).toHaveBeenCalledWith(
      expect.objectContaining({ type: "profile_updated" }),
    );
  });
});

describe("updateAvatarRequest", () => {
  const validPayload = { image: "data:image/png;base64,...", imagePublicId: "avatar-123" };

  it("returns 401 if not authenticated", async () => {
    vi.mocked(mockAuthApi.getSession).mockResolvedValue(null);
    const response = await updateAvatarRequest(mockRequest, validPayload);
    expect(response.status).toBe(401);
  });

  it("calls updateUser and sends notification on success", async () => {
    const response = await updateAvatarRequest(mockRequest, validPayload);
    expect(response.status).toBe(200);
    const data = await jsonResponse(response);
    expect(data.success).toBe(true);

    expect(mockAuthApi.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { image: validPayload.image, imagePublicId: validPayload.imagePublicId },
      }),
    );
    expect(mockNotificationSend).toHaveBeenCalledWith(
      expect.objectContaining({ type: "profile_updated" }),
    );
  });
});

describe("forgotPasswordRequest", () => {
  it("returns 400 on invalid payload", async () => {
    const response = await forgotPasswordRequest(mockRequest, { email: "" } as any);
    expect(response.status).toBe(400);
    const data = await jsonResponse(response);
    expect(data.success).toBe(false);
  });

  it("calls requestPasswordReset and returns success", async () => {
    const response = await forgotPasswordRequest(mockRequest, { email: "john@example.com" });
    expect(response.status).toBe(200);
    const data = await jsonResponse(response);
    expect(data.success).toBe(true);

    expect(mockAuthApi.requestPasswordReset).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { email: "john@example.com", redirectTo: expect.stringContaining("password-reset") },
      }),
    );
    expect(AuditLogService.record).toHaveBeenCalledWith(
      mockRequest,
      expect.objectContaining({ action: "FORGOT_PASSWORD" }),
    );
  });
});

describe("resetPasswordRequest", () => {
  const requestWithToken = new Request("http://localhost:3700?token=reset-token-123", {
    headers: { "Content-Type": "application/json" },
  });

  it("returns 400 if token is missing", async () => {
    const response = await resetPasswordRequest(mockRequest, { newPassword: "NewPass1!" });
    expect(response.status).toBe(400);
    const data = await jsonResponse(response);
    expect(data.message).toBe("Token is required");
  });

  it("returns 400 on invalid payload", async () => {
    const response = await resetPasswordRequest(requestWithToken, {} as any);
    expect(response.status).toBe(400);
    const data = await jsonResponse(response);
    expect(data.success).toBe(false);
  });

  it("calls resetPassword and returns success", async () => {
    const response = await resetPasswordRequest(requestWithToken, { newPassword: "NewPass1!" });
    expect(response.status).toBe(200);
    const data = await jsonResponse(response);
    expect(data.success).toBe(true);

    expect(mockAuthApi.resetPassword).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { newPassword: "NewPass1!", token: "reset-token-123" },
      }),
    );
    expect(AuditLogService.record).toHaveBeenCalledWith(
      requestWithToken,
      expect.objectContaining({ action: "RESET_PASSWORD" }),
    );
  });
});

describe("updatePasswordRequest", () => {
  const validPayload = {
    currentPassword: "OldPass1!",
    newPassword: "NewPass1!",
    confirmPassword: "NewPass1!",
  };

  it("returns 401 if not authenticated", async () => {
    vi.mocked(mockAuthApi.getSession).mockResolvedValue(null);
    const response = await updatePasswordRequest(mockRequest, validPayload);
    expect(response.status).toBe(401);
  });

  it("returns 400 on invalid payload", async () => {
    const response = await updatePasswordRequest(mockRequest, {} as any);
    expect(response.status).toBe(400);
    const data = await jsonResponse(response);
    expect(data.success).toBe(false);
  });

  it("calls changePassword, triggers workflow, and sends notification", async () => {
    const response = await updatePasswordRequest(mockRequest, validPayload);
    expect(response.status).toBe(200);
    const data = await jsonResponse(response);
    expect(data.success).toBe(true);

    expect(mockAuthApi.changePassword).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { newPassword: "NewPass1!", currentPassword: "OldPass1!", revokeOtherSessions: true },
      }),
    );
    expect(mockWorkflowTrigger).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining("workflow/password-reset-success") }),
    );
    expect(mockNotificationSend).toHaveBeenCalledWith(
      expect.objectContaining({ type: "password_changed" }),
    );
    expect(AuditLogService.record).toHaveBeenCalledWith(
      mockRequest,
      expect.objectContaining({ action: "PASSWORD_CHANGE" }),
    );
  });
});

describe("listUserSessions", () => {
  it("returns sessions on success", async () => {
    const mockSessions = [{ token: "session-1" }, { token: "session-2" }];
    vi.mocked(mockAuthApi.listSessions).mockResolvedValue(mockResponse(mockSessions) as any);
    const response = await listUserSessions(mockRequest);
    expect(response.status).toBe(200);
    const data = await jsonResponse(response);
    expect(data.success).toBe(true);
    expect(data.body).toEqual(mockSessions);
  });

  it("returns empty array on error", async () => {
    vi.mocked(mockAuthApi.listSessions).mockResolvedValue(mockResponse([], 500) as any);
    const response = await listUserSessions(mockRequest);
    expect(response.ok).toBe(false);
    const data = await jsonResponse(response);
    expect(data.success).toBe(false);
    expect(data.body).toEqual([]);
  });
});

describe("revokeUserSession", () => {
  it("calls revokeSession and returns success", async () => {
    const response = await revokeUserSession(mockRequest, { token: "session-token" });
    expect(response.status).toBe(200);
    const data = await jsonResponse(response);
    expect(data.success).toBe(true);

    expect(mockAuthApi.revokeSession).toHaveBeenCalledWith(
      expect.objectContaining({ body: { token: "session-token" } }),
    );
    expect(AuditLogService.record).toHaveBeenCalledWith(
      mockRequest,
      expect.objectContaining({ action: "SESSION_REVOKE" }),
    );
  });
});

describe("requestDeleteAccount", () => {
  it("returns 401 if not authenticated", async () => {
    vi.mocked(mockAuthApi.getSession).mockResolvedValue(null);
    const response = await requestDeleteAccount(mockRequest);
    expect(response.status).toBe(401);
  });

  it("calls deleteUser and returns success", async () => {
    const response = await requestDeleteAccount(mockRequest);
    expect(response.status).toBe(200);
    const data = await jsonResponse(response);
    expect(data.success).toBe(true);

    expect(mockAuthApi.deleteUser).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { callbackURL: expect.stringContaining("delete-account-confirmation") },
      }),
    );
    expect(AuditLogService.record).toHaveBeenCalledWith(
      mockRequest,
      expect.objectContaining({ action: "DELETE_ACCOUNT_REQUEST" }),
    );
  });
});

describe("updateAdminRole", () => {
  it("returns 401 if not authenticated", async () => {
    vi.mocked(mockAuthApi.getSession).mockResolvedValue(null);
    const response = await updateAdminRole(mockRequest, { role: "admin", id: "user-2" });
    expect(response.status).toBe(401);
  });

  it("returns 400 if payload is missing", async () => {
    const response = await updateAdminRole(mockRequest, undefined as any);
    expect(response.status).toBe(400);
    const data = await jsonResponse(response);
    expect(data.message).toBe("Invalid payload");
  });

  it("returns 400 if user not found", async () => {
    vi.mocked(User.findById).mockReturnValue(queryBuilder(null));
    const response = await updateAdminRole(mockRequest, { role: "admin", id: "nonexistent" });
    expect(response.status).toBe(400);
    const data = await jsonResponse(response);
    expect(data.message).toBe("Cohort not found");
  });

  it("updates role and invalidates cache", async () => {
    const mockUser = { _id: "user-2", name: "Target", email: "target@example.com", role: "user" };
    vi.mocked(User.findById).mockReturnValue(queryBuilder(mockUser));
    const mockUpdated = { ...mockUser, role: "admin" };
    vi.mocked(User.findByIdAndUpdate).mockResolvedValue(mockUpdated as any);

    const response = await updateAdminRole(mockRequest, { role: "admin", id: "user-2" });
    expect(response.status).toBe(200);
    const data = await jsonResponse(response);
    expect(data.success).toBe(true);
    expect(data.message).toContain("Target");

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "user-2",
      { role: "admin" },
      { returnDocument: "after" },
    );
    expect(invalidateCache).toHaveBeenCalledWith("coordinators");
    expect(mockNotificationSend).toHaveBeenCalledWith(
      expect.objectContaining({ type: "role_updated", userId: "user-2" }),
    );
    expect(AuditLogService.record).toHaveBeenCalledWith(
      mockRequest,
      expect.objectContaining({ action: "UPDATE_ROLE" }),
    );
  });
});

describe("getAMember", () => {
  it("returns 401 if not authenticated", async () => {
    vi.mocked(mockAuthApi.getSession).mockResolvedValue(null);
    const response = await getAMember(mockRequest, "user-1");
    expect(response.status).toBe(401);
  });

  it("returns 404 if member not found", async () => {
    const { fetchWithCache } = await import("~/.server/utils/cache");
    vi.mocked(fetchWithCache).mockResolvedValue(null);
    const response = await getAMember(mockRequest, "nonexistent");
    expect(response.status).toBe(404);
    const data = await jsonResponse(response);
    expect(data.message).toBe("Member not found");
  });

  it("returns member profile on success", async () => {
    const mockMember = { _id: "user-1", name: "John", email: "john@example.com", role: "intern" };
    const { fetchWithCache } = await import("~/.server/utils/cache");
    vi.mocked(fetchWithCache).mockResolvedValue(mockMember);
    const response = await getAMember(mockRequest, "user-1");
    expect(response.status).toBe(200);
    const data = await jsonResponse(response);
    expect(data.success).toBe(true);
    expect(data.body).toEqual(mockMember);
  });
});
