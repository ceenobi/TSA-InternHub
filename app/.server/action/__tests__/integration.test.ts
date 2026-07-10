// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("~/.server/services/better-auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));
vi.mock("~/.server/utils/cache", () => ({
  fetchWithCache: vi.fn(),
  invalidateCache: vi.fn(),
}));
vi.mock("~/.server/utils/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => {}),
}));

vi.mock("~/.server/model/integration", () => ({
  default: { findOne: vi.fn(), find: vi.fn(), create: vi.fn(), deleteOne: vi.fn() },
}));

import { saveIntegration, getIntegrations, deleteIntegration } from "../integration";
import { auth } from "~/.server/services/better-auth";
import { checkRateLimit } from "~/.server/utils/rate-limit";

const adminSession = {
  user: { id: "admin-1", name: "Admin", email: "admin@test.com", role: "admin", program: "full-stack" } as any,
  session: { token: "mock" } as any,
};
const userSession = {
  user: { id: "user-1", name: "User", email: "user@test.com", role: "user", program: "full-stack" } as any,
  session: { token: "mock" } as any,
};
const mockRequest = new Request("http://localhost:3700");
const payload = { provider: "slack", config: { webhook: "https://hooks.slack.com/abc" }, label: "Slack" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue(undefined as any);
});

describe("saveIntegration", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await saveIntegration(mockRequest, payload);
    expect(response.status).toBe(401);
  });

  it("returns 403 for non-admin users", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(userSession as any);
    const response = await saveIntegration(mockRequest, payload);
    expect(response.status).toBe(403);
  });
});

describe("getIntegrations", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await getIntegrations(mockRequest);
    expect(response.status).toBe(401);
  });

  it("returns 403 for non-admin users", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(userSession as any);
    const response = await getIntegrations(mockRequest);
    expect(response.status).toBe(403);
  });
});

describe("deleteIntegration", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await deleteIntegration(mockRequest, { provider: "slack" });
    expect(response.status).toBe(401);
  });

  it("returns 403 for non-admin users", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(userSession as any);
    const response = await deleteIntegration(mockRequest, { provider: "slack" });
    expect(response.status).toBe(403);
  });
});
