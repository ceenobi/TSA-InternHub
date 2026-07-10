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

const mockSubmissionCountDocuments = vi.fn();
const mockSubmissionFind = vi.fn();
vi.mock("~/.server/model/submission", () => ({
  default: {
    countDocuments: (...args: any[]) => mockSubmissionCountDocuments(...args),
    find: (...args: any[]) => mockSubmissionFind(...args),
  },
}));

import { getUserTaskSubmissions } from "../submissions";
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
  mockCountResult = 0;
  mockFindResult = [];
});

describe("getUserTaskSubmissions", () => {
  it("fetches user submissions", async () => {
    mockCountResult = 2;
    mockFindResult = [
      { _id: "sub-1", task: { _id: "task-1", title: "Task 1", maxScore: 100 }, status: "graded", score: 85 },
      { _id: "sub-2", task: { _id: "task-2", title: "Task 2", maxScore: 100 }, status: "submitted" },
    ];
    mockSubmissionCountDocuments.mockResolvedValue(mockCountResult);
    mockSubmissionFind.mockReturnValue(queryBuilder(mockFindResult));

    const response = await getUserTaskSubmissions({ request: mockRequest });
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.body.submissions).toHaveLength(2);
    expect(body.body.meta.total).toBe(2);
  });

  it("filters by taskId", async () => {
    mockSubmissionCountDocuments.mockResolvedValue(0);
    mockSubmissionFind.mockReturnValue(queryBuilder([]));

    await getUserTaskSubmissions({ request: mockRequest, taskId: "task-1" });
    expect(mockSubmissionCountDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ task: "task-1", user: "user-1" }),
    );
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await getUserTaskSubmissions({ request: mockRequest });
    expect(response.status).toBe(401);
  });
});
