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
vi.mock("~/.server/services/stage-names", () => ({
  getStageTitle: vi.fn((_program: string, order: number) => `Stage ${order}`),
}));
vi.mock("~/.server/utils/cache", () => ({
  fetchWithCache: vi.fn(async (_key: string, _ttl: number, fn: () => any) => fn()),
  invalidateCache: vi.fn(),
}));
vi.mock("~/.server/utils/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => {}),
}));

const mockCohortFindById = vi.fn();
const mockCohortFindOne = vi.fn();
const mockCohortFind = vi.fn();
const mockProjectFindOne = vi.fn();
const mockProjectFindById = vi.fn();
const mockProjectFind = vi.fn();
const mockProjectCreate = vi.fn();
const mockProjectFindByIdAndUpdate = vi.fn();
const mockProjectFindByIdAndDelete = vi.fn();
const mockProjectCountDocuments = vi.fn();
const mockStageFind = vi.fn();
const mockStageInsertMany = vi.fn();
const mockStageDeleteMany = vi.fn();
const mockStageProgressFind = vi.fn();
const mockStageProgressDeleteMany = vi.fn();
const mockSubmissionDeleteMany = vi.fn();
const mockTaskDeleteMany = vi.fn();

vi.mock("~/.server/model/cohort", () => ({
  default: {
    findById: (...args: any[]) => mockCohortFindById(...args),
    findOne: (...args: any[]) => mockCohortFindOne(...args),
    find: (...args: any[]) => mockCohortFind(...args),
  },
}));
vi.mock("~/.server/model/project", () => ({
  default: {
    findOne: (...args: any[]) => mockProjectFindOne(...args),
    findById: (...args: any[]) => mockProjectFindById(...args),
    find: (...args: any[]) => mockProjectFind(...args),
    create: (...args: any[]) => mockProjectCreate(...args),
    findByIdAndUpdate: (...args: any[]) => mockProjectFindByIdAndUpdate(...args),
    findByIdAndDelete: (...args: any[]) => mockProjectFindByIdAndDelete(...args),
    countDocuments: (...args: any[]) => mockProjectCountDocuments(...args),
  },
}));
vi.mock("~/.server/model/stage", () => ({
  default: {
    find: (...args: any[]) => mockStageFind(...args),
    insertMany: (...args: any[]) => mockStageInsertMany(...args),
    deleteMany: (...args: any[]) => mockStageDeleteMany(...args),
  },
}));
vi.mock("~/.server/model/stageProgress", () => ({
  default: {
    find: (...args: any[]) => mockStageProgressFind(...args),
    deleteMany: (...args: any[]) => mockStageProgressDeleteMany(...args),
  },
}));
vi.mock("~/.server/model/submission", () => ({
  default: { deleteMany: (...args: any[]) => mockSubmissionDeleteMany(...args) },
}));
vi.mock("~/.server/model/task", () => ({
  default: { deleteMany: (...args: any[]) => mockTaskDeleteMany(...args) },
}));

import {
  createProject, getCurrentProject, fetchProgramProjects,
  updateProject, deleteProject, getProjectStages, getProjectTaskScoreBoard,
} from "../project";
import { auth } from "~/.server/services/better-auth";
import { checkRateLimit } from "~/.server/utils/rate-limit";
import { AuditLogService } from "~/.server/services/auditlog.service";
import { invalidateCache } from "~/.server/utils/cache";

const adminSession = {
  user: { id: "admin-1", name: "Admin", email: "admin@test.com", role: "admin", program: "full-stack" } as any,
  session: { token: "mock" } as any,
};
const mockRequest = new Request("http://localhost:3700");

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
  vi.mocked(auth.api.getSession).mockResolvedValue(adminSession as any);
});

describe("createProject", () => {
  const validPayload = {
    title: "My New Project",
    description: "A project description with at least ten characters.",
    cohortId: "cohort-1",
    startDate: futureDateStr(),
    endDate: futureDateStr(10),
  };

  it("creates a project with stages", async () => {
    mockCohortFindById.mockReturnValue(
      queryBuilder({ _id: "cohort-1", status: "active", program: "full-stack" }),
    );
    mockProjectFindOne.mockReturnValue(queryBuilder(null));
    mockProjectCreate.mockResolvedValue({ _id: "project-1", ...validPayload } as any);
    mockStageInsertMany.mockResolvedValue([{}, {}, {}, {}, {}] as any);

    const response = await createProject(mockRequest, validPayload);
    expect(response.status).toBe(201);
    expect(mockProjectCreate).toHaveBeenCalled();
    expect(mockStageInsertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ order: 1, project: "project-1" }),
        expect.objectContaining({ order: 5, project: "project-1" }),
      ]),
    );
    expect(AuditLogService.record).toHaveBeenCalled();
    expect(invalidateCache).toHaveBeenCalled();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await createProject(mockRequest, validPayload);
    expect(response.status).toBe(401);
  });

  it("returns 400 when cohort not found", async () => {
    mockCohortFindById.mockReturnValue(queryBuilder(null));
    const response = await createProject(mockRequest, validPayload);
    expect(response.status).toBe(400);
  });

  it("returns 400 when cohort is not active", async () => {
    mockCohortFindById.mockReturnValue(
      queryBuilder({ _id: "cohort-1", status: "completed", program: "full-stack" }),
    );
    const response = await createProject(mockRequest, validPayload);
    expect(response.status).toBe(400);
  });

  it("returns 400 when project already exists for cohort", async () => {
    mockCohortFindById.mockReturnValue(
      queryBuilder({ _id: "cohort-1", status: "active", program: "full-stack" }),
    );
    mockProjectFindOne.mockReturnValue(queryBuilder({ _id: "existing-project" }));
    const response = await createProject(mockRequest, validPayload);
    expect(response.status).toBe(400);
  });
});

describe("getCurrentProject", () => {
  it("returns current project", async () => {
    mockCohortFindOne.mockReturnValue(queryBuilder({ _id: "cohort-1" }));
    mockProjectFindOne.mockReturnValue(
      queryBuilder({ _id: "project-1", title: "Active Project" }),
    );

    const response = await getCurrentProject(mockRequest);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.body._id).toBe("project-1");
  });

  it("returns null when no active cohort", async () => {
    mockCohortFindOne.mockReturnValue(queryBuilder(null));
    const response = await getCurrentProject(mockRequest);
    const body = await response.json();
    expect(body.body).toBeNull();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await getCurrentProject(mockRequest);
    expect(response.status).toBe(401);
  });
});

describe("fetchProgramProjects", () => {
  it("fetches paginated projects", async () => {
    mockCohortFind.mockReturnValue(queryBuilder(["cohort-1"]));
    mockProjectCountDocuments.mockResolvedValue(1);
    mockProjectFind.mockReturnValue(
      queryBuilder([{ _id: "project-1", title: "Project 1" }]),
    );

    const response = await fetchProgramProjects({
      request: mockRequest, page: 1, limit: 10, query: undefined, status: undefined,
    });
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(mockCohortFind).toHaveBeenCalledWith({ program: "full-stack" });
    expect(body.body.meta.total).toBe(1);
    expect(body.body.projects).toHaveLength(1);
  });

  it("filters by status", async () => {
    mockCohortFind.mockReturnValue(queryBuilder(["cohort-1"]));
    mockProjectCountDocuments.mockResolvedValue(0);
    mockProjectFind.mockReturnValue(queryBuilder([]));

    await fetchProgramProjects({
      request: mockRequest, page: 1, limit: 10, query: undefined, status: "active",
    });
    expect(mockProjectCountDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ status: "active" }),
    );
  });
});

describe("updateProject", () => {
  const validPayload = {
    title: "Updated Title",
    description: "Updated description with enough characters here.",
    cohortId: "cohort-1",
    startDate: futureDateStr(),
    endDate: futureDateStr(10),
    status: "active" as const,
  };

  it("updates a project", async () => {
    const reqWithId = new Request(`http://localhost:3700?id=project-1`);
    mockProjectFindById.mockReturnValue(queryBuilder({ _id: "project-1" }));
    mockProjectFindByIdAndUpdate.mockReturnValue(queryBuilder({ _id: "project-1", title: "Updated Title" }));

    const response = await updateProject(reqWithId, validPayload);
    expect(response.status).toBe(200);
    expect(mockProjectFindByIdAndUpdate).toHaveBeenCalledWith(
      "project-1",
      expect.objectContaining({ title: "Updated Title" }),
      expect.any(Object),
    );
    expect(AuditLogService.record).toHaveBeenCalled();
  });

  it("returns 400 when id missing", async () => {
    const response = await updateProject(mockRequest, validPayload);
    expect(response.status).toBe(400);
  });
});

describe("deleteProject", () => {
  it("deletes a project with cascading cleanup", async () => {
    mockProjectFindById.mockReturnValue(
      queryBuilder({
        _id: "project-1",
        title: "Test Project",
        cohort: { program: "full-stack" },
        createdBy: "admin-1",
      }),
    );
    mockStageFind.mockReturnValue(queryBuilder([{ _id: "stage-1" }, { _id: "stage-2" }]));
    mockSubmissionDeleteMany.mockResolvedValue({} as any);
    mockTaskDeleteMany.mockResolvedValue({} as any);
    mockStageProgressDeleteMany.mockResolvedValue({} as any);
    mockStageDeleteMany.mockResolvedValue({} as any);
    mockProjectFindByIdAndDelete.mockResolvedValue({} as any);

    const response = await deleteProject(mockRequest, { id: "project-1" });
    expect(response.status).toBe(200);
    expect(mockSubmissionDeleteMany).toHaveBeenCalled();
    expect(mockStageDeleteMany).toHaveBeenCalled();
    expect(mockProjectFindByIdAndDelete).toHaveBeenCalledWith("project-1");
    expect(AuditLogService.record).toHaveBeenCalled();
  });

  it("returns 403 when not authorized", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "other-user", name: "Other", email: "other@test.com", role: "user", program: "data-analysis" } as any,
      session: { token: "mock" } as any,
    });
    mockProjectFindById.mockReturnValue(
      queryBuilder({ _id: "project-1", title: "Test", cohort: { program: "full-stack" }, createdBy: "admin-1" }),
    );

    const response = await deleteProject(mockRequest, { id: "project-1" });
    expect(response.status).toBe(403);
  });
});

describe("getProjectStages", () => {
  it("returns stages for a project", async () => {
    mockStageFind.mockReturnValue(
      queryBuilder([{ _id: "stage-1", title: "Stage 1", order: 1, project: "project-1" }]),
    );

    const response = await getProjectStages(mockRequest, { projectId: "project-1" });
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.body).toHaveLength(1);
  });
});

describe("getProjectTaskScoreBoard", () => {
  it("returns scoreboard data", async () => {
    mockCohortFind.mockReturnValue(
      queryBuilder([
        { _id: "cohort-1", cohort: "June-2025", program: "full-stack", status: "active", members: [{ _id: "user-1", name: "User", email: "u@test.com", image: null }] },
      ]).populate(() => queryBuilder([])),
    );
    mockProjectFind.mockReturnValue(
      queryBuilder([{ _id: "project-1", title: "Project 1", cohort: "cohort-1" }]),
    );
    mockStageFind.mockReturnValue(queryBuilder([]));
    mockStageProgressFind.mockReturnValue(queryBuilder([]));

    const response = await getProjectTaskScoreBoard(mockRequest);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.body)).toBe(true);
  });
});
