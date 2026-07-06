// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

type AnyObj = Record<string, any>;
let mockFindOneResult: AnyObj | null = null;
let mockFindResult: AnyObj[] = [];

function queryBuilder(result: AnyObj | AnyObj[] | null) {
  const q = vi.fn(() => q) as any;
  q.lean = vi.fn(() => Promise.resolve(result));
  q.select = vi.fn(() => q);
  q.populate = vi.fn(() => q);
  q.sort = vi.fn(() => q);
  q.skip = vi.fn(() => q);
  q.limit = vi.fn(() => q);
  return q;
}

vi.mock("~/.server/services/better-auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

vi.mock("~/.server/config/logger", () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("~/.server/model/cohort", () => ({
  default: {
    create: vi.fn(),
    findOne: vi.fn(() => queryBuilder(mockFindOneResult)),
    find: vi.fn(() => queryBuilder(mockFindResult)),
    countDocuments: vi.fn(() => Promise.resolve(0)),
  },
}));

vi.mock("~/.server/services/auditlog.service", () => ({
  AuditLogService: { record: vi.fn() },
}));

vi.mock("~/.server/utils/cache", () => ({
  fetchWithCache: vi.fn(),
  invalidateCache: vi.fn(),
}));

vi.mock("~/.server/utils/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

import { createCohort } from "../cohort";
import { auth } from "~/.server/services/better-auth";
import Cohort from "~/.server/model/cohort";
import { checkRateLimit } from "~/.server/utils/rate-limit";
import { invalidateCache } from "~/.server/utils/cache";
import { AuditLogService } from "~/.server/services/auditlog.service";

const mockSession = {
  user: { id: "admin-1", name: "Admin", email: "admin@example.com", role: "admin", program: "full-stack" },
  session: { token: "mock-token" },
};

const mockRequest = new Request("http://localhost:3700", {
  headers: { "Content-Type": "application/json" },
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue(null as any);
  vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
  vi.mocked(auth.api.updateUser).mockResolvedValue({} as any);
  mockFindOneResult = null;
  mockFindResult = [];
});

describe("createCohort", () => {
  const validPayload = {
    cohort: "June-2025-cohort",
    program: "full-stack" as const,
  };

  it("creates a cohort successfully", async () => {
    const mockCohort = {
      _id: "cohort-1",
      cohort: "JUNE-2025-COHORT",
      program: "full-stack",
      status: "active",
    };
    vi.mocked(Cohort.create).mockResolvedValue(mockCohort as any);
    mockFindOneResult = null;

    const response = await createCohort(mockRequest, validPayload);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe("Cohort created successfully");
    expect(Cohort.create).toHaveBeenCalledWith({
      ...validPayload,
      cohort: "JUNE-2025-COHORT",
    });
    expect(invalidateCache).toHaveBeenCalled();
    expect(AuditLogService.record).toHaveBeenCalledOnce();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const response = await createCohort(mockRequest, validPayload);
    expect(response.status).toBe(401);
  });

  it("returns 400 when active cohort already exists for program", async () => {
    mockFindOneResult = { _id: "existing", cohort: "JAN-2025", status: "active", program: "full-stack" };

    const response = await createCohort(mockRequest, validPayload);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.message).toContain("already active");
  });

  it("returns 400 when cohort name already exists", async () => {
    mockFindOneResult = null;

    vi.mocked(Cohort.findOne)
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(null) } as any)
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue({ _id: "existing", cohort: "JUNE-2025-COHORT" }) } as any);

    const response = await createCohort(mockRequest, validPayload);
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid data", async () => {
    const response = await createCohort(mockRequest, {
      cohort: "AB",
      program: "invalid" as any,
    });
    expect(response.status).toBe(400);
  });
});
