// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

type AnyObj = Record<string, any>;

let mockCountResult = 0;
let mockFindResult: AnyObj[] = [];

function queryBuilder(result: AnyObj | AnyObj[] | null) {
  const q = vi.fn(() => q) as any;
  q.lean = vi.fn(() => q);
  q.select = vi.fn(() => q);
  q.populate = vi.fn(() => q);
  q.sort = vi.fn(() => q);
  q.skip = vi.fn(() => q);
  q.limit = vi.fn(() => q);
  q.distinct = vi.fn(() => q);
  q.then = (onfulfilled: any) => Promise.resolve(result).then(onfulfilled);
  q.exec = () => Promise.resolve(result);
  return q;
}

vi.mock("~/.server/services/better-auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("~/.server/config/logger", () => ({
  default: { error: vi.fn() },
}));

vi.mock("~/.server/utils/cache", () => ({
  fetchWithCache: vi.fn(async (_key: string, _ttl: number, fn: () => any) => fn()),
}));

vi.mock("~/.server/utils/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => {}),
}));

const mockAuditLogCountDocuments = vi.fn();
const mockAuditLogFind = vi.fn();
vi.mock("~/.server/model/auditLog", () => ({
  default: {
    countDocuments: (...args: any[]) => mockAuditLogCountDocuments(...args),
    find: (...args: any[]) => mockAuditLogFind(...args),
  },
}));

import { fetchUserAuditLogs, fetchAllAuditLogs } from "../audit-logs";
import { auth } from "~/.server/services/better-auth";
import { checkRateLimit } from "~/.server/utils/rate-limit";

const mockSession = {
  user: { id: "aaaaaaaaaaaaaaaaaaaaaaaa", name: "Test User", email: "test@example.com", role: "admin", program: "full-stack" } as any,
  session: { token: "mock-token" } as any,
};
const mockRequest = new Request("http://localhost:3700");

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue(undefined as any);
  vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
  mockCountResult = 0;
  mockFindResult = [];
});

describe("fetchUserAuditLogs", () => {
  it("fetches user audit logs", async () => {
    mockCountResult = 1;
    mockFindResult = [{ _id: "log-1", action: "LOGIN", category: "auth" }];
    mockAuditLogCountDocuments.mockResolvedValue(mockCountResult);
    mockAuditLogFind.mockReturnValue(queryBuilder(mockFindResult));

    const response = await fetchUserAuditLogs({ request: mockRequest });
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.body.logs).toHaveLength(1);
    expect(body.body.meta.total).toBe(1);
  });

  it("filters by category", async () => {
    mockCountResult = 1;
    mockFindResult = [{ _id: "log-2", action: "CREATE", category: "tasks" }];
    mockAuditLogCountDocuments.mockResolvedValue(mockCountResult);
    mockAuditLogFind.mockReturnValue(queryBuilder(mockFindResult));

    const response = await fetchUserAuditLogs({ request: mockRequest, category: "tasks" });
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.body.logs[0].category).toBe("tasks");
    expect(mockAuditLogCountDocuments).toHaveBeenCalledWith(expect.objectContaining({ category: "tasks" }));
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await fetchUserAuditLogs({ request: mockRequest });
    expect(response.status).toBe(401);
  });
});

describe("fetchAllAuditLogs", () => {
  it("fetches all audit logs", async () => {
    mockCountResult = 3;
    mockFindResult = [{ _id: "log-1" }, { _id: "log-2" }, { _id: "log-3" }];
    mockAuditLogCountDocuments.mockResolvedValue(mockCountResult);
    mockAuditLogFind.mockReturnValue(queryBuilder(mockFindResult));

    const response = await fetchAllAuditLogs({ request: mockRequest });
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.body.logs).toHaveLength(3);
  });

  it("filters by category", async () => {
    mockAuditLogCountDocuments.mockResolvedValue(0);
    mockAuditLogFind.mockReturnValue(queryBuilder([]));

    await fetchAllAuditLogs({ request: mockRequest, category: "settings" });
    expect(mockAuditLogCountDocuments).toHaveBeenCalledWith(expect.objectContaining({ category: "settings" }));
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await fetchAllAuditLogs({ request: mockRequest });
    expect(response.status).toBe(401);
  });
});
