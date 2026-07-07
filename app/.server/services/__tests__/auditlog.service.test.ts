// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockWorkflowTrigger } = vi.hoisted(() => ({
  mockWorkflowTrigger: vi.fn(),
}));

vi.mock("~/.server/config/keys", () => ({
  env: { clientUrl: "http://localhost:3700" },
}));

vi.mock("~/.server/config/logger", () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("~/.server/model/auditLog", () => ({
  default: { create: vi.fn() },
}));

vi.mock("~/.server/workflows/client", () => ({
  workflowClient: { trigger: mockWorkflowTrigger },
}));

const mockAuthApi = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock("~/.server/services/better-auth", () => ({
  auth: { api: mockAuthApi },
}));

import AuditLog from "~/.server/model/auditLog";
import { AuditLogService } from "../auditlog.service";

const mockSession = {
  user: {
    id: "user-1",
    name: "John Doe",
    email: "john@example.com",
    role: "admin",
    program: "full-stack",
  },
  session: { token: "mock-token" },
};

const defaultRequest = new Request("http://localhost:3700", {
  headers: {
    "Content-Type": "application/json",
    "x-forwarded-for": "192.168.1.1",
    "user-agent": "TestAgent/1.0",
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(mockAuthApi.getSession).mockResolvedValue(mockSession as any);
});

describe("AuditLogService.record", () => {
  const baseOptions = {
    action: "USER_LOGIN",
    category: "auth" as const,
    description: "User logged in",
    details: { email: "john@example.com" },
  };

  it("creates an audit log entry", async () => {
    await AuditLogService.record(defaultRequest, baseOptions);

    expect(AuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        userName: "John Doe",
        action: "USER_LOGIN",
        category: "auth",
        description: "User logged in",
        details: { email: "john@example.com" },
        status: "success",
        ipAddress: "192.168.1.1",
        userAgent: "TestAgent/1.0",
      }),
    );
  });

  it("does nothing if there is no session", async () => {
    vi.mocked(mockAuthApi.getSession).mockResolvedValue(null);

    await AuditLogService.record(defaultRequest, baseOptions);

    expect(AuditLog.create).not.toHaveBeenCalled();
    expect(mockWorkflowTrigger).not.toHaveBeenCalled();
  });

  it("falls back to x-real-ip when x-forwarded-for is missing", async () => {
    const req = new Request("http://localhost:3700", {
      headers: { "x-real-ip": "10.0.0.1" },
    });

    await AuditLogService.record(req, baseOptions);

    expect(AuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ ipAddress: "10.0.0.1" }),
    );
  });

  it("uses 'unknown' when no IP headers are present", async () => {
    const req = new Request("http://localhost:3700");

    await AuditLogService.record(req, baseOptions);

    expect(AuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ ipAddress: "unknown" }),
    );
  });

  it("defaults status to 'success'", async () => {
    await AuditLogService.record(defaultRequest, {
      action: "PROFILE_UPDATE",
      category: "settings",
    });

    expect(AuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: "success" }),
    );
  });

  it("uses provided status", async () => {
    await AuditLogService.record(defaultRequest, {
      ...baseOptions,
      status: "failure",
    });

    expect(AuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failure" }),
    );
  });

  it("does not trigger workflow for low-risk actions", async () => {
    await AuditLogService.record(defaultRequest, {
      ...baseOptions,
      action: "PROFILE_UPDATE",
      category: "settings",
    });

    expect(mockWorkflowTrigger).not.toHaveBeenCalled();
  });

  it("triggers security workflow for high-risk actions", async () => {
    await AuditLogService.record(defaultRequest, {
      action: "PASSWORD_CHANGE",
      category: "security",
      description: "Password changed",
    });

    expect(mockWorkflowTrigger).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining("workflow/security-notification"),
        body: expect.objectContaining({
          action: "PASSWORD_CHANGE",
          user: mockSession.user,
          ipAddress: "192.168.1.1",
          userAgent: "TestAgent/1.0",
        }),
      }),
    );
  });

  it("triggers workflow for ACCOUNT_LOCKED", async () => {
    await AuditLogService.record(defaultRequest, {
      action: "ACCOUNT_LOCKED",
      category: "security",
    });

    expect(mockWorkflowTrigger).toHaveBeenCalled();
  });

  it("triggers workflow for DELETE_ACCOUNT_REQUEST", async () => {
    await AuditLogService.record(defaultRequest, {
      action: "DELETE_ACCOUNT_REQUEST",
      category: "security",
    });

    expect(mockWorkflowTrigger).toHaveBeenCalled();
  });

  it("triggers workflow for SUPPORT_TICKET", async () => {
    await AuditLogService.record(defaultRequest, {
      action: "SUPPORT_TICKET",
      category: "support",
    });

    expect(mockWorkflowTrigger).toHaveBeenCalled();
  });

  it("handles AuditLog.create error gracefully", async () => {
    vi.mocked(AuditLog.create).mockRejectedValue(new Error("DB error"));

    await expect(
      AuditLogService.record(defaultRequest, baseOptions),
    ).resolves.toBeUndefined();
  });

  it("handles workflow trigger error gracefully", async () => {
    mockWorkflowTrigger.mockRejectedValue(new Error("Workflow error"));

    await expect(
      AuditLogService.record(defaultRequest, {
        action: "PASSWORD_CHANGE",
        category: "security",
      }),
    ).resolves.toBeUndefined();
  });
});
