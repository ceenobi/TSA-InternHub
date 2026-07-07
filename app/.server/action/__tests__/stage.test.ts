// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

type AnyObj = Record<string, any>;

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
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock("~/.server/services/auditlog.service", () => ({
  AuditLogService: { record: vi.fn() },
}));
vi.mock("~/.server/utils/cache", () => ({
  invalidateCache: vi.fn(),
}));
vi.mock("~/.server/utils/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => {}),
}));

const mockProjectFindById = vi.fn();
const mockStageFindById = vi.fn();
const mockStageCountDocuments = vi.fn();
const mockStageCreate = vi.fn();
const mockStageFindByIdAndUpdate = vi.fn();
const mockStageFindByIdAndDelete = vi.fn();
const mockStageUpdateMany = vi.fn();
const mockStageFind = vi.fn();
const mockTaskFind = vi.fn();
const mockSubmissionDeleteMany = vi.fn();
const mockStageProgressDeleteMany = vi.fn();
const mockTaskDeleteMany = vi.fn();

vi.mock("~/.server/model/project", () => ({
  default: { findById: (...args: any[]) => mockProjectFindById(...args) },
}));
vi.mock("~/.server/model/stage", () => ({
  default: {
    findById: (...args: any[]) => mockStageFindById(...args),
    countDocuments: (...args: any[]) => mockStageCountDocuments(...args),
    create: (...args: any[]) => mockStageCreate(...args),
    findByIdAndUpdate: (...args: any[]) => mockStageFindByIdAndUpdate(...args),
    findByIdAndDelete: (...args: any[]) => mockStageFindByIdAndDelete(...args),
    updateMany: (...args: any[]) => mockStageUpdateMany(...args),
    find: (...args: any[]) => mockStageFind(...args),
  },
}));
vi.mock("~/.server/model/task", () => ({
  default: {
    find: (...args: any[]) => mockTaskFind(...args),
    deleteMany: (...args: any[]) => mockTaskDeleteMany(...args),
  },
}));
vi.mock("~/.server/model/submission", () => ({
  default: { deleteMany: (...args: any[]) => mockSubmissionDeleteMany(...args) },
}));
vi.mock("~/.server/model/stageProgress", () => ({
  default: { deleteMany: (...args: any[]) => mockStageProgressDeleteMany(...args) },
}));

import { createStage, updateStage, deleteStage } from "../stage";
import { auth } from "~/.server/services/better-auth";
import { checkRateLimit } from "~/.server/utils/rate-limit";
import { AuditLogService } from "~/.server/services/auditlog.service";
import { invalidateCache } from "~/.server/utils/cache";

const adminSession = {
  user: { id: "admin-1", name: "Admin", email: "admin@test.com", role: "admin", program: "full-stack" } as any,
  session: { token: "mock" } as any,
};
const mockRequest = new Request("http://localhost:3700");

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue(undefined as any);
  vi.mocked(auth.api.getSession).mockResolvedValue(adminSession as any);
});

describe("createStage", () => {
  const validPayload = {
    projectId: "project-1",
    title: "Stage 1 Title",
    description: "Stage description here",
    passPercentage: 70,
    lateGraceHours: 24,
    latePenaltyPerDay: 20,
  };

  it("creates a stage successfully", async () => {
    mockProjectFindById.mockReturnValue(
      queryBuilder({ _id: "project-1", cohort: { program: "full-stack" } }),
    );
    mockStageCountDocuments.mockResolvedValue(0);
    mockStageCreate.mockResolvedValue({ _id: "stage-1", ...validPayload } as any);

    const response = await createStage(mockRequest, validPayload);
    expect(response.status).toBe(201);
    expect(mockStageCreate).toHaveBeenCalled();
    expect(AuditLogService.record).toHaveBeenCalled();
    expect(invalidateCache).toHaveBeenCalled();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await createStage(mockRequest, validPayload);
    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid payload", async () => {
    const response = await createStage(mockRequest, { projectId: "p-1" } as any);
    expect(response.status).toBe(400);
  });

  it("returns 404 when project not found", async () => {
    mockProjectFindById.mockReturnValue(queryBuilder(null));
    const response = await createStage(mockRequest, validPayload);
    expect(response.status).toBe(404);
  });

  it("returns 400 when max 5 stages reached", async () => {
    mockProjectFindById.mockReturnValue(
      queryBuilder({ _id: "project-1", cohort: { program: "full-stack" } }),
    );
    mockStageCountDocuments.mockResolvedValue(5);
    const response = await createStage(mockRequest, validPayload);
    expect(response.status).toBe(400);
  });
});

describe("updateStage", () => {
  const validPayload = {
    stageId: "stage-1",
    projectId: "project-1",
    title: "Updated Stage Title",
    description: "Updated description here",
    passPercentage: 80,
    lateGraceHours: 12,
    latePenaltyPerDay: 10,
  };

  it("updates a stage successfully", async () => {
    mockProjectFindById.mockReturnValue(
      queryBuilder({ _id: "project-1", cohort: { program: "full-stack" } }),
    );
    mockStageFindByIdAndUpdate.mockResolvedValue({ _id: "stage-1" } as any);

    const response = await updateStage(mockRequest, validPayload);
    expect(response.status).toBe(200);
    expect(mockStageFindByIdAndUpdate).toHaveBeenCalledWith(
      "stage-1",
      expect.objectContaining({ title: "Updated Stage Title" }),
      expect.any(Object),
    );
    expect(AuditLogService.record).toHaveBeenCalled();
  });

  it("returns 404 when stage not found (update returns null)", async () => {
    mockProjectFindById.mockReturnValue(
      queryBuilder({ _id: "project-1", cohort: { program: "full-stack" } }),
    );
    mockStageFindByIdAndUpdate.mockResolvedValue(null);

    const response = await updateStage(mockRequest, validPayload);
    expect(response.status).toBe(404);
  });
});

describe("deleteStage", () => {
  it("deletes a stage with cascading cleanup", async () => {
    mockProjectFindById.mockReturnValue(
      queryBuilder({ _id: "project-1", cohort: { program: "full-stack" } }),
    );
    mockStageFindById.mockReturnValue(
      queryBuilder({ _id: "stage-1", title: "Stage 1", order: 3 }),
    );
    mockTaskFind.mockReturnValue(queryBuilder([{ _id: "task-1" }, { _id: "task-2" }]));
    mockSubmissionDeleteMany.mockResolvedValue({ deletedCount: 2 } as any);
    mockStageProgressDeleteMany.mockResolvedValue({ deletedCount: 5 } as any);
    mockTaskDeleteMany.mockResolvedValue({ deletedCount: 2 } as any);
    mockStageFindByIdAndDelete.mockResolvedValue({ _id: "stage-1" } as any);
    mockStageUpdateMany.mockResolvedValue({ modifiedCount: 2 } as any);

    const response = await deleteStage(mockRequest, { stageId: "stage-1", projectId: "project-1" });
    expect(response.status).toBe(200);
    expect(mockSubmissionDeleteMany).toHaveBeenCalled();
    expect(mockStageProgressDeleteMany).toHaveBeenCalled();
    expect(mockTaskDeleteMany).toHaveBeenCalled();
    expect(mockStageFindByIdAndDelete).toHaveBeenCalledWith("stage-1");
    expect(mockStageUpdateMany).toHaveBeenCalledWith(
      { project: "project-1", order: { $gt: 3 } },
      { $inc: { order: -1 } },
    );
    expect(AuditLogService.record).toHaveBeenCalled();
  });

  it("returns 404 when stage not found", async () => {
    mockProjectFindById.mockReturnValue(
      queryBuilder({ _id: "project-1", cohort: { program: "full-stack" } }),
    );
    mockStageFindById.mockReturnValue(queryBuilder(null));

    const response = await deleteStage(mockRequest, { stageId: "nonexistent", projectId: "project-1" });
    expect(response.status).toBe(404);
  });
});
