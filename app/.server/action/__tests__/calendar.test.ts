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

const mockCohortFindOne = vi.fn();
const mockProjectFindOne = vi.fn();
const mockStageFind = vi.fn();
const mockTaskFind = vi.fn();

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
vi.mock("~/.server/model/cohort", () => ({
  default: { findOne: (...args: any[]) => mockCohortFindOne(...args) },
}));
vi.mock("~/.server/model/project", () => ({
  default: { findOne: (...args: any[]) => mockProjectFindOne(...args) },
}));
vi.mock("~/.server/model/stage", () => ({
  default: { find: (...args: any[]) => mockStageFind(...args) },
}));
vi.mock("~/.server/model/task", () => ({
  default: { find: (...args: any[]) => mockTaskFind(...args) },
}));

import { getCalendarData } from "../calendar";
import { auth } from "~/.server/services/better-auth";
import { checkRateLimit } from "~/.server/utils/rate-limit";

const mockSession = {
  user: { id: "user-1", name: "Test", email: "test@example.com", role: "user", program: "full-stack" } as any,
  session: { token: "mock" } as any,
};
const mockRequest = new Request("http://localhost:3700");

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue(undefined as any);
  vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
});

describe("getCalendarData", () => {
  it("returns calendar data with project, stages, tasks, and events", async () => {
    mockCohortFindOne.mockReturnValue(queryBuilder({ _id: "cohort-1" }));
    mockProjectFindOne.mockReturnValue(
      queryBuilder({
        _id: "project-1",
        title: "Test Project",
        status: "active",
        startDate: new Date("2026-07-01"),
        endDate: new Date("2026-09-01"),
        cohort: { cohort: "July-2026", program: "full-stack" },
        createdBy: { name: "Admin", email: "admin@test.com" },
      }),
    );
    mockStageFind.mockReturnValue(
      queryBuilder([
        { _id: "stage-1", project: "project-1", title: "Stage 1", order: 1, startDate: new Date("2026-07-01"), endDate: new Date("2026-07-15") },
      ]),
    );
    mockTaskFind.mockReturnValue(
      queryBuilder([
        { _id: "task-1", stage: "stage-1", title: "Task 1", dueDate: new Date("2026-07-10"), description: "Do it", type: "individual", maxScore: 100, order: 1 },
      ]),
    );

    const response = await getCalendarData(mockRequest);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.body.events).toHaveLength(3);
    expect(body.body.events[0].type).toBe("project");
    expect(body.body.events[1].type).toBe("stage");
    expect(body.body.events[2].type).toBe("task");
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await getCalendarData(mockRequest);
    expect(response.status).toBe(401);
  });

  it("returns empty when no active cohort", async () => {
    mockCohortFindOne.mockReturnValue(queryBuilder(null));
    const response = await getCalendarData(mockRequest);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.body.project).toBeNull();
    expect(body.body.events).toEqual([]);
  });
});
