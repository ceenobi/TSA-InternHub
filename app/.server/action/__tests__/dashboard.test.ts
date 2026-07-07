// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

type AnyObj = Record<string, any>;

function queryBuilder(result: AnyObj | AnyObj[] | null) {
  const q = vi.fn(() => q) as any;
  q.lean = vi.fn(() => q);
  q.select = vi.fn(() => q);
  q.populate = vi.fn(() => q);
  q.sort = vi.fn(() => q);
  q.distinct = vi.fn(() => q);
  q.then = (onfulfilled: any) => Promise.resolve(result).then(onfulfilled);
  q.exec = () => Promise.resolve(result);
  return q;
}

function jsonResponse(data: any, status = 200) {
  return Response.json(data, { status });
}

const mockFetchAnnouncements = vi.fn();
const mockFetchAllAuditLogs = vi.fn();
const mockGetCalendarData = vi.fn();
const mockGetActiveCohortWithMembers = vi.fn();
const mockGetProjectTaskScoreBoard = vi.fn();
const mockGetTaskStatsForAdmins = vi.fn();
const mockGetTaskStatsForUser = vi.fn();
const mockFetchTickets = vi.fn();

vi.mock("~/.server/action/announcement", () => ({ fetchAnnouncements: (...args: any[]) => mockFetchAnnouncements(...args) }));
vi.mock("~/.server/action/audit-logs", () => ({ fetchAllAuditLogs: (...args: any[]) => mockFetchAllAuditLogs(...args) }));
vi.mock("~/.server/action/calendar", () => ({ getCalendarData: (...args: any[]) => mockGetCalendarData(...args) }));
vi.mock("~/.server/action/cohort", () => ({ getActiveCohortWithMembers: (...args: any[]) => mockGetActiveCohortWithMembers(...args) }));
vi.mock("~/.server/action/project", () => ({ getProjectTaskScoreBoard: (...args: any[]) => mockGetProjectTaskScoreBoard(...args) }));
vi.mock("~/.server/action/task", () => ({ getTaskStatsForAdmins: (...args: any[]) => mockGetTaskStatsForAdmins(...args), getTaskStatsForUser: (...args: any[]) => mockGetTaskStatsForUser(...args) }));
vi.mock("~/.server/action/ticket", () => ({ fetchTickets: (...args: any[]) => mockFetchTickets(...args) }));

vi.mock("~/.server/services/better-auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));
vi.mock("~/.server/utils/cache", () => ({
  fetchWithCache: vi.fn(async (_key: string, _ttl: number, fn: () => any) => fn()),
}));
vi.mock("~/.server/utils/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => {}),
}));

const mockCohortDistinct = vi.fn();
vi.mock("~/.server/model/cohort", () => ({
  default: { distinct: (...args: any[]) => mockCohortDistinct(...args) },
}));

const mockUserFindById = vi.fn();
vi.mock("~/.server/model/user", () => ({
  default: { findById: (...args: any[]) => mockUserFindById(...args) },
}));

import { fetchDashboardData } from "../dashboard";
import { auth } from "~/.server/services/better-auth";
import { checkRateLimit } from "~/.server/utils/rate-limit";

const adminSession = {
  user: { id: "admin-1", name: "Admin", email: "admin@test.com", role: "admin", program: "full-stack" } as any,
  session: { token: "mock" } as any,
};
const superAdminSession = {
  user: { id: "super-1", name: "Super", email: "super@test.com", role: "super_admin", program: "full-stack" } as any,
  session: { token: "mock" } as any,
};
const userSession = {
  user: { id: "user-1", name: "User", email: "user@test.com", role: "user", program: "full-stack" } as any,
  session: { token: "mock" } as any,
};

const emptyAdminStats = {
  body: {
    summary: { totalUsers: 0, activeUsers: 0, suspendedUsers: 0, totalSubmissions: 0, pendingCount: 0, averageScore: 0, onTimeRate: 0, totalTasks: 0 },
    trends: { scoreDistribution: [], submissionActivity: [], stageCompletion: [], topUsers: [] },
  },
};
const emptyUserStats = {
  body: {
    summary: { tasksCompleted: 0, averageScore: 0, onTimeRate: 0, stageProgress: 0, tasksSubmitted: 0, tasksReturned: 0, totalTasks: 0 },
    trends: { scoreTrend: [], stageBreakdown: [] },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue(undefined as any);
});

describe("fetchDashboardData for admin", () => {
  beforeEach(() => {
    vi.mocked(auth.api.getSession).mockResolvedValue(adminSession as any);
    mockGetTaskStatsForAdmins.mockResolvedValue(jsonResponse(emptyAdminStats));
    mockGetActiveCohortWithMembers.mockResolvedValue(jsonResponse({ body: null }));
    mockGetProjectTaskScoreBoard.mockResolvedValue(jsonResponse({ body: [] }));
    mockFetchTickets.mockResolvedValue(jsonResponse({ body: { summary: { openTickets: 0, inProgressTickets: 0, resolvedTickets: 0 }, tickets: [] } }));
    mockFetchAllAuditLogs.mockResolvedValue(jsonResponse({ body: { logs: [] } }));
    mockFetchAnnouncements.mockResolvedValue(jsonResponse({ body: { announcements: [] } }));
  });

  it("returns admin dashboard data", async () => {
    const response = await fetchDashboardData(new Request("http://localhost:3700"));
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.body.role).toBe("admin");
    expect(body.body.isSuperAdmin).toBe(false);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await fetchDashboardData(new Request("http://localhost:3700"));
    expect(response.status).toBe(401);
  });

  it("fetches programs for super admin", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(superAdminSession as any);
    mockCohortDistinct.mockResolvedValue(["full-stack", "product-design"]);

    const response = await fetchDashboardData(new Request("http://localhost:3700"));
    const body = await response.json();
    expect(body.body.isSuperAdmin).toBe(true);
    expect(body.body.programs).toEqual(["full-stack", "product-design"]);
  });

  it("passes program filter to getTaskStatsForAdmins", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(superAdminSession as any);
    mockCohortDistinct.mockResolvedValue([]);

    await fetchDashboardData(new Request("http://localhost:3700?program=data-analysis"));
    expect(mockGetTaskStatsForAdmins).toHaveBeenCalledWith(
      expect.any(Request),
      "data-analysis",
    );
  });
});

describe("fetchDashboardData for regular user", () => {
  beforeEach(() => {
    vi.mocked(auth.api.getSession).mockResolvedValue(userSession as any);
    mockGetTaskStatsForUser.mockResolvedValue(jsonResponse(emptyUserStats));
    mockGetCalendarData.mockResolvedValue(jsonResponse({ body: { project: null, stages: [], tasks: [], events: [] } }));
    mockGetProjectTaskScoreBoard.mockResolvedValue(jsonResponse({ body: [] }));
    mockFetchAnnouncements.mockResolvedValue(jsonResponse({ body: { announcements: [] } }));
    mockUserFindById.mockReturnValue(queryBuilder({ _id: "user-1", cohort: "June-2025" }));
  });

  it("returns user dashboard data", async () => {
    const response = await fetchDashboardData(new Request("http://localhost:3700"));
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.body.role).toBe("user");
    expect(body.body.cohortName).toBe("June-2025");
  });
});
