// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

type AnyObj = Record<string, any>;

function queryBuilder(result: AnyObj | null) {
  const q = vi.fn(() => q) as any;
  q.lean = vi.fn(() => Promise.resolve(result));
  q.select = vi.fn(() => q);
  q.populate = vi.fn(() => q);
  q.sort = vi.fn(() => q);
  return q;
}

const mockSession = {
  user: { id: "admin-1", name: "Admin", email: "admin@example.com", role: "admin", program: "full-stack" },
  session: { token: "mock-token" },
};

vi.mock("~/.server/services/better-auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("~/.server/config/logger", () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("~/.server/model/submission", () => ({
  default: { findById: vi.fn(), findByIdAndUpdate: vi.fn(), find: vi.fn() },
}));

vi.mock("~/.server/model/task", () => ({
  default: { findById: vi.fn(), find: vi.fn() },
}));

vi.mock("~/.server/utils/cache", () => ({
  fetchWithCache: vi.fn(async (_key: string, _ttl: number, fn: () => any) => fn()),
  invalidateCache: vi.fn(),
}));

vi.mock("~/.server/utils/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("~/.server/workflows/client", () => ({
  workflowClient: { sendRequest: vi.fn() },
}));

import { fetchGradeTaskData } from "../grade";
import { auth } from "~/.server/services/better-auth";
import { checkRateLimit } from "~/.server/utils/rate-limit";
import Task from "~/.server/model/task";
import Submission from "~/.server/model/submission";

const mockRequest = new Request("http://localhost:3700", { headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue(null as any);
  vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
});

describe("fetchGradeTaskData", () => {
  it("fetches task and submissions for a given task ID", async () => {
    const mockTask = {
      _id: "task-1",
      title: "Build API",
      description: "Build a REST API",
      instructions: "Follow the spec",
      resources: [{ name: "Docs", url: "http://docs.com" }],
      type: "individual",
      maxScore: 100,
      isBonus: false,
      dueDate: new Date("2025-06-01"),
      maxAttempts: 2,
      allowLate: true,
      stage: { _id: "stage-1", title: "Stage 1", order: 1, passPercentage: 70 },
    };

    const mockSubmissions = [{
      _id: "sub-1",
      user: { _id: "user-1", name: "John", email: "john@test.com", image: null },
      content: "My submission",
      fileUrls: [{ name: "file.pdf", url: "http://files.com/file.pdf" }],
      status: "graded",
      score: 85,
      maxScore: 100,
      percentage: 85,
      feedback: "Good work",
      gradedBy: "admin-1",
      attemptNumber: 1,
      submittedAt: new Date("2025-05-30"),
      gradedAt: new Date("2025-06-01"),
      isLate: false,
      latePenalty: 0,
    }];

    vi.mocked(Task.findById).mockReturnValue({
      populate: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(mockTask) }),
    } as any);
    vi.mocked(Submission.find).mockReturnValue({
      populate: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(mockSubmissions) }),
      }),
    } as any);

    const response = await fetchGradeTaskData(mockRequest, "task-1");

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.body.task.title).toBe("Build API");
    expect(body.body.submissions).toHaveLength(1);
    expect(body.body.submissions[0].score).toBe(85);
    expect(body.body.stage.title).toBe("Stage 1");
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await fetchGradeTaskData(mockRequest, "task-1");
    expect(response.status).toBe(401);
  });
});
