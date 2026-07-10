// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

type AnyObj = Record<string, any>;

let mockFindOneResult: AnyObj | null = null;
let mockFindResult: AnyObj[] = [];
let mockFindByIdResult: AnyObj | null = null;

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

const mockProjectConstructor = vi.fn();

vi.mock("~/.server/services/better-auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("~/.server/config/logger", () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("~/.server/services/auditlog.service", () => ({
  AuditLogService: { record: vi.fn() },
}));

vi.mock("~/.server/utils/cache", () => ({
  fetchWithCache: vi.fn(async (_key: string, _ttl: number, fn: () => any) => fn()),
  invalidateCache: vi.fn(),
}));

vi.mock("~/.server/utils/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => {}),
}));

vi.mock("~/.server/model/user", () => ({
  default: { findById: vi.fn(() => queryBuilder(mockFindByIdResult)) },
}));

const mockStageFindById = vi.fn();
const mockStageFindOne = vi.fn();
const mockStageFind = vi.fn();
const mockStageCreate = vi.fn();

vi.mock("~/.server/model/stage", () => ({
  default: {
    findById: (...args: any[]) => mockStageFindById(...args),
    findOne: (...args: any[]) => mockStageFindOne(...args),
    find: (...args: any[]) => mockStageFind(...args),
    create: (...args: any[]) => mockStageCreate(...args),
  },
}));

const mockCohortFindOne = vi.fn();
vi.mock("~/.server/model/cohort", () => ({
  default: { findOne: (...args: any[]) => mockCohortFindOne(...args) },
}));

const mockProjectFindOne = vi.fn();
vi.mock("~/.server/model/project", () => ({
  default: { findOne: (...args: any[]) => mockProjectFindOne(...args) },
}));

const mockStageProgressFind = vi.fn();
const mockStageProgressFindOne = vi.fn();
const mockStageProgressCreate = vi.fn();
vi.mock("~/.server/model/stageProgress", () => ({
  default: {
    find: (...args: any[]) => mockStageProgressFind(...args),
    findOne: (...args: any[]) => mockStageProgressFindOne(...args),
    create: (...args: any[]) => mockStageProgressCreate(...args),
  },
}));

const mockSubmissionFind = vi.fn();
const mockSubmissionCountDocuments = vi.fn();
const mockSubmissionCreate = vi.fn();
vi.mock("~/.server/model/submission", () => ({
  default: {
    find: (...args: any[]) => mockSubmissionFind(...args),
    countDocuments: (...args: any[]) => mockSubmissionCountDocuments(...args),
    create: (...args: any[]) => mockSubmissionCreate(...args),
  },
}));

const mockTaskFind = vi.fn();
const mockTaskFindById = vi.fn();
const mockTaskCreate = vi.fn();
const mockTaskFindByIdAndUpdate = vi.fn();
vi.mock("~/.server/model/task", () => ({
  default: {
    find: (...args: any[]) => mockTaskFind(...args),
    findById: (...args: any[]) => mockTaskFindById(...args),
    create: (...args: any[]) => mockTaskCreate(...args),
    findByIdAndUpdate: (...args: any[]) => mockTaskFindByIdAndUpdate(...args),
  },
}));

import { fetchTasksData, activateStage, submitTask, createTask, editTask } from "../task";
import { auth } from "~/.server/services/better-auth";
import { checkRateLimit } from "~/.server/utils/rate-limit";
import { invalidateCache } from "~/.server/utils/cache";
import { AuditLogService } from "~/.server/services/auditlog.service";

const mockSession = {
  user: { id: "user-1", name: "Test User", email: "test@example.com", role: "admin", program: "full-stack" } as any,
  session: { token: "mock-token" } as any,
};

const mockRequest = new Request("http://localhost:3700", { headers: { "Content-Type": "application/json" } });

function futureDateStr(daysAhead = 5) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue(undefined as any);
  vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
  mockFindOneResult = null;
  mockFindResult = [];
  mockFindByIdResult = null;
});

describe("fetchTasksData", () => {
  beforeEach(() => {
    mockCohortFindOne.mockReturnValue(queryBuilder({ _id: "cohort-1" }));
    mockProjectFindOne.mockReturnValue(
      queryBuilder({
        _id: "project-1",
        cohort: { cohort: "June-2025", program: "full-stack", status: "active" },
        createdBy: { name: "Admin", email: "admin@test.com" },
      }),
    );
    mockStageFind.mockReturnValue(
      queryBuilder([{ _id: "stage-1", project: "project-1", title: "Stage 1", order: 1 }]),
    );
    mockTaskFind.mockReturnValue(
      queryBuilder([{ _id: "task-1", stage: "stage-1", title: "Task 1", maxScore: 100, order: 1, maxAttempts: 3, allowLate: false, type: "individual", isBonus: false }]),
    );
    mockStageProgressFind.mockReturnValue(
      queryBuilder([{ _id: "progress-1", stage: "stage-1", user: "user-1", status: "active" }]),
    );
  });

  it("fetches tasks data for authenticated user", async () => {
    const response = await fetchTasksData(mockRequest);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.body.project._id).toBe("project-1");
    expect(body.body.stages).toHaveLength(1);
    expect(body.body.stages[0].tasks).toHaveLength(1);
    expect(body.body.stages[0].progress.status).toBe("active");
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await fetchTasksData(mockRequest);
    expect(response.status).toBe(401);
  });

  it("returns null project when no active cohort", async () => {
    mockCohortFindOne.mockReturnValue(queryBuilder(null));
    const response = await fetchTasksData(mockRequest);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.body.project).toBeNull();
  });

  it("returns null project when project not found", async () => {
    mockProjectFindOne.mockReturnValue(queryBuilder(null));
    const response = await fetchTasksData(mockRequest);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.body.project).toBeNull();
  });
});

describe("activateStage", () => {
  it("activates a stage successfully", async () => {
    mockStageFindById.mockReturnValue(
      queryBuilder({ _id: "stage-1", title: "Stage 1", order: 1 }),
    );
    mockStageProgressFindOne.mockReturnValue(queryBuilder(null));
    mockStageProgressCreate.mockResolvedValue({} as any);

    const response = await activateStage(mockRequest, { stageId: "stage-1" });

    expect(response.status).toBe(200);
    expect(mockStageProgressCreate).toHaveBeenCalledWith({
      user: "user-1",
      stage: "stage-1",
      status: "active",
    });
    expect(AuditLogService.record).toHaveBeenCalled();
    expect(invalidateCache).toHaveBeenCalled();
  });

  it("returns 404 when stage not found", async () => {
    mockStageFindById.mockReturnValue(queryBuilder(null));

    const response = await activateStage(mockRequest, { stageId: "nonexistent" });
    expect(response.status).toBe(404);
  });

  it("returns 400 when stage already active", async () => {
    mockStageFindById.mockReturnValue(
      queryBuilder({ _id: "stage-1", title: "Stage 1" }),
    );
    mockStageProgressFindOne.mockReturnValue(
      queryBuilder({ _id: "progress-1", stage: "stage-1", user: "user-1", status: "active" }),
    );

    const response = await activateStage(mockRequest, { stageId: "stage-1" });
    expect(response.status).toBe(400);
  });
});

describe("submitTask", () => {
  it("submits a task successfully", async () => {
    mockTaskFindById.mockReturnValue(
      queryBuilder({
        _id: "task-1",
        title: "Task 1",
        maxAttempts: 3,
        maxScore: 100,
        allowLate: false,
        dueDate: new Date(Date.now() + 86400000),
      }),
    );
    mockSubmissionCountDocuments.mockResolvedValue(0);
    mockSubmissionCreate.mockResolvedValue({ _id: "sub-1" } as any);

    const response = await submitTask(mockRequest, {
      taskId: "task-1",
      content: "My solution",
    });

    expect(response.status).toBe(200);
    expect(mockSubmissionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        task: "task-1",
        content: "My solution",
        user: "user-1",
        attemptNumber: 1,
        status: "submitted",
      }),
    );
  });

  it("returns 404 when task not found", async () => {
    mockTaskFindById.mockReturnValue(queryBuilder(null));
    const response = await submitTask(mockRequest, { taskId: "nonexistent", content: "test" });
    expect(response.status).toBe(404);
  });

  it("returns 400 when max attempts exceeded", async () => {
    mockTaskFindById.mockReturnValue(
      queryBuilder({ _id: "task-1", maxAttempts: 2, maxScore: 100 }),
    );
    mockSubmissionCountDocuments.mockResolvedValue(2);

    const response = await submitTask(mockRequest, { taskId: "task-1", content: "test" });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toContain("Maximum submission");
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await submitTask(mockRequest, { taskId: "task-1", content: "test" });
    expect(response.status).toBe(401);
  });
});

describe("createTask", () => {
  const validPayload = {
    stage: "stage-1",
    title: "New Task Title",
    description: "This is a description with at least ten characters.",
    type: "individual" as const,
    maxScore: 100,
    isBonus: false,
    order: 1,
    dueDate: futureDateStr(),
    allowLate: false,
    maxAttempts: 3,
    latePenaltyPercent: 10,
    resources: [],
  };

  it("creates a task successfully", async () => {
    mockStageFindById.mockReturnValue(
      queryBuilder({
        _id: "stage-1",
        project: {
          _id: "project-1",
          cohort: { program: "full-stack" },
        },
      }),
    );
    mockTaskCreate.mockResolvedValue({ _id: "task-1" } as any);

    const response = await createTask(mockRequest, validPayload);

    expect(response.status).toBe(201);
    expect(mockTaskCreate).toHaveBeenCalled();
    expect(AuditLogService.record).toHaveBeenCalled();
    expect(invalidateCache).toHaveBeenCalled();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await createTask(mockRequest, validPayload);
    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid payload", async () => {
    const response = await createTask(mockRequest, { stage: "stage-1" } as any);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toContain("Invalid data format");
  });

  it("returns 404 when stage not found", async () => {
    mockStageFindById.mockReturnValue(queryBuilder(null));
    const response = await createTask(mockRequest, validPayload);
    expect(response.status).toBe(404);
  });
});

describe("editTask", () => {
  const validPayload = {
    taskId: "task-1",
    stage: "stage-1",
    title: "Updated Task Title",
    description: "Updated description with enough characters now.",
    type: "individual" as const,
    maxScore: 100,
    isBonus: false,
    order: 1,
    dueDate: futureDateStr(),
    allowLate: false,
    maxAttempts: 3,
    latePenaltyPercent: 5,
    resources: [],
  };

  it("edits a task successfully", async () => {
    mockTaskFindById.mockReturnValue(
      queryBuilder({
        _id: "task-1",
        stage: {
          _id: "stage-1",
          project: { _id: "project-1", cohort: { program: "full-stack" } },
        },
      }),
    );
    mockTaskFindByIdAndUpdate.mockReturnValue(
      queryBuilder({ _id: "task-1", title: "Updated Task Title" }),
    );

    const response = await editTask(mockRequest, validPayload);

    expect(response.status).toBe(200);
    expect(mockTaskFindByIdAndUpdate).toHaveBeenCalledWith("task-1", expect.any(Object), { new: true });
    expect(AuditLogService.record).toHaveBeenCalled();
  });

  it("returns 400 when taskId missing", async () => {
    const { taskId: _, ...rest } = validPayload;
    const response = await editTask(mockRequest, rest as any);
    expect(response.status).toBe(400);
  });

  it("returns 404 when task not found", async () => {
    mockTaskFindById.mockReturnValue(queryBuilder(null));
    const response = await editTask(mockRequest, validPayload);
    expect(response.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await editTask(mockRequest, validPayload);
    expect(response.status).toBe(401);
  });
});
