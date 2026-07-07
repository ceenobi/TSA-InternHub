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
vi.mock("~/.server/services/notification.service", () => ({
  NotificationService: { send: vi.fn() },
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
const mockUserFindById = vi.fn();
const mockUserFind = vi.fn();
const mockProjectFindOne = vi.fn();
const mockStageFind = vi.fn();
const mockStageFindOne = vi.fn();
const mockStageProgressFind = vi.fn();
const mockTaskFindOne = vi.fn();
const mockHubTeamFindOne = vi.fn();
const mockHubTeamCreate = vi.fn();
const mockHubTeamFindById = vi.fn();
const mockHubTeamFindOneAndUpdate = vi.fn();
const mockHubTeamFindByIdAndUpdate = vi.fn();
const mockHubTaskFind = vi.fn();
const mockHubTaskCreate = vi.fn();
const mockHubTaskFindById = vi.fn();
const mockHubTaskFindByIdAndUpdate = vi.fn();
const mockHubTaskFindByIdAndDelete = vi.fn();

vi.mock("~/.server/model/cohort", () => ({
  default: {
    findById: (...args: any[]) => mockCohortFindById(...args),
    findOne: (...args: any[]) => mockCohortFindOne(...args),
  },
}));
vi.mock("~/.server/model/user", () => ({
  default: {
    findById: (...args: any[]) => mockUserFindById(...args),
    find: (...args: any[]) => mockUserFind(...args),
  },
}));
vi.mock("~/.server/model/project", () => ({
  default: { findOne: (...args: any[]) => mockProjectFindOne(...args) },
}));
vi.mock("~/.server/model/stage", () => ({
  default: {
    find: (...args: any[]) => mockStageFind(...args),
    findOne: (...args: any[]) => mockStageFindOne(...args),
  },
}));
vi.mock("~/.server/model/stageProgress", () => ({
  default: { find: (...args: any[]) => mockStageProgressFind(...args) },
}));
vi.mock("~/.server/model/task", () => ({
  default: { findOne: (...args: any[]) => mockTaskFindOne(...args) },
}));
vi.mock("~/.server/model/hubTeam", () => ({
  default: {
    findOne: (...args: any[]) => mockHubTeamFindOne(...args),
    create: (...args: any[]) => mockHubTeamCreate(...args),
    findById: (...args: any[]) => mockHubTeamFindById(...args),
    findOneAndUpdate: (...args: any[]) => mockHubTeamFindOneAndUpdate(...args),
    findByIdAndUpdate: (...args: any[]) => mockHubTeamFindByIdAndUpdate(...args),
  },
}));
vi.mock("~/.server/model/hubTask", () => ({
  default: {
    find: (...args: any[]) => mockHubTaskFind(...args),
    create: (...args: any[]) => mockHubTaskCreate(...args),
    findById: (...args: any[]) => mockHubTaskFindById(...args),
    findByIdAndUpdate: (...args: any[]) => mockHubTaskFindByIdAndUpdate(...args),
    findByIdAndDelete: (...args: any[]) => mockHubTaskFindByIdAndDelete(...args),
  },
}));

import { checkHubQualification, assignTeamLeader, createHubTask, updateHubTaskStatus, deleteHubTask, fetchHubData, updateHubTask, updateMeetingUrl } from "../hub";
import { auth } from "~/.server/services/better-auth";
import { AuditLogService } from "~/.server/services/auditlog.service";
import { NotificationService } from "~/.server/services/notification.service";

const adminSession = {
  user: { id: "admin-1", name: "Admin", email: "admin@test.com", role: "admin", program: "full-stack" } as any,
  session: { token: "mock" } as any,
};
const teamLeaderSession = {
  user: { id: "leader-1", name: "Leader", email: "leader@test.com", role: "user", program: "full-stack" } as any,
  session: { token: "mock" } as any,
};
const userSession = {
  user: { id: "user-1", name: "User", email: "user@test.com", role: "user", program: "full-stack" } as any,
  session: { token: "mock" } as any,
};
const mockRequest = new Request("http://localhost:3700");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkHubQualification", () => {
  it("returns qualified when average >= 70% and stage 4 reached", async () => {
    mockCohortFindOne.mockReturnValue(queryBuilder({ _id: "cohort-1", cohort: "June-2025" }));
    mockProjectFindOne.mockReturnValue(queryBuilder({ _id: "project-1" }));
    mockStageFind.mockReturnValue(
      queryBuilder([
        { _id: "s1", order: 1 }, { _id: "s2", order: 2 }, { _id: "s3", order: 3 }, { _id: "s4", order: 4 },
      ]).select(() => null),
    );
    mockStageProgressFind.mockReturnValue(
      queryBuilder([
        { stage: "s1", totalScore: 80, maxPossibleScore: 100 },
        { stage: "s2", totalScore: 90, maxPossibleScore: 100 },
        { stage: "s3", totalScore: 85, maxPossibleScore: 100 },
        { stage: "s4", totalScore: 75, maxPossibleScore: 100, status: "completed" },
      ]),
    );

    const result = await checkHubQualification("user-1", "cohort-1");
    expect(result.isQualified).toBe(true);
    expect(result.averageScore).toBe(82.5);
  });

  it("returns not qualified when average < 70%", async () => {
    mockCohortFindOne.mockReturnValue(queryBuilder({ _id: "cohort-1" }));
    mockProjectFindOne.mockReturnValue(queryBuilder({ _id: "project-1" }));
    mockStageFind.mockReturnValue(
      queryBuilder([{ _id: "s4", order: 4 }]).select(() => null),
    );
    mockStageProgressFind.mockReturnValue(
      queryBuilder([{ stage: "s4", totalScore: 30, maxPossibleScore: 100, status: "completed" }]),
    );

    const result = await checkHubQualification("user-1", "cohort-1");
    expect(result.isQualified).toBe(false);
    expect(result.averageScore).toBe(30);
  });

  it("returns not qualified when cohort not found", async () => {
    mockCohortFindOne.mockReturnValue(queryBuilder(null));
    const result = await checkHubQualification("user-1", "nonexistent");
    expect(result.isQualified).toBe(false);
  });

  it("returns not qualified when stage 4 is locked", async () => {
    mockCohortFindOne.mockReturnValue(queryBuilder({ _id: "cohort-1" }));
    mockProjectFindOne.mockReturnValue(queryBuilder({ _id: "project-1" }));
    mockStageFind.mockReturnValue(
      queryBuilder([{ _id: "s4", order: 4 }]).select(() => null),
    );
    mockStageProgressFind.mockReturnValue(
      queryBuilder([{ stage: "s4", totalScore: 0, maxPossibleScore: 100, status: "locked" }]),
    );

    const result = await checkHubQualification("user-1", "cohort-1");
    expect(result.isQualified).toBe(false);
  });
});

describe("assignTeamLeader", () => {
  beforeEach(() => {
    vi.mocked(auth.api.getSession).mockResolvedValue(adminSession as any);
  });

  it("assigns a team leader", async () => {
    mockUserFindById.mockReturnValue(queryBuilder({ _id: "leader-1", name: "Leader" }));
    mockHubTeamFindOneAndUpdate.mockReturnValue(
      queryBuilder({ _id: "team-1", teamLeader: "leader-1" }),
    );

    const response = await assignTeamLeader(mockRequest, { userId: "leader-1", cohortId: "cohort-1" });
    expect(response.status).toBe(200);
    expect(mockHubTeamFindOneAndUpdate).toHaveBeenCalledWith(
      { cohort: "cohort-1" },
      { $set: { teamLeader: "leader-1" } },
      { new: true },
    );
    expect(AuditLogService.record).toHaveBeenCalled();
    expect(NotificationService.send).toHaveBeenCalled();
  });

  it("returns 403 for non-admin", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(userSession as any);
    const response = await assignTeamLeader(mockRequest, { userId: "leader-1", cohortId: "cohort-1" });
    expect(response.status).toBe(403);
  });

  it("returns 404 when user not found", async () => {
    mockUserFindById.mockReturnValue(queryBuilder(null));
    const response = await assignTeamLeader(mockRequest, { userId: "nonexistent", cohortId: "cohort-1" });
    expect(response.status).toBe(404);
  });
});

describe("createHubTask", () => {
  beforeEach(() => {
    vi.mocked(auth.api.getSession).mockResolvedValue(teamLeaderSession as any);
  });

  it("creates a hub task", async () => {
    mockUserFindById.mockReturnValue(queryBuilder({ _id: "leader-1", cohort: "June-2025", role: "user" }));
    mockCohortFindOne.mockReturnValue(queryBuilder({ _id: "cohort-1" }));
    mockHubTeamFindOne.mockReturnValue(
      queryBuilder({ _id: "team-1", teamLeader: "leader-1" }),
    );
    mockHubTaskCreate.mockResolvedValue({ _id: "task-1", title: "Test Task" } as any);

    const response = await createHubTask(mockRequest, {
      title: "Test Task Title",
      description: "Do this task",
      priority: "high",
      assignedTo: ["user-2"],
    });
    expect(response.status).toBe(200);
    expect(mockHubTaskCreate).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Test Task Title", hubTeam: "team-1" }),
    );
    expect(NotificationService.send).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-2" }),
    );
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await createHubTask(mockRequest, { title: "Test" });
    expect(response.status).toBe(401);
  });

  it("returns 403 when user is not team leader", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(userSession as any);
    mockUserFindById.mockReturnValue(queryBuilder({ _id: "user-1", cohort: "June-2025", role: "user" }));
    mockCohortFindOne.mockReturnValue(queryBuilder({ _id: "cohort-1" }));
    mockHubTeamFindOne.mockReturnValue(
      queryBuilder({ _id: "team-1", teamLeader: "leader-1" }),
    );

    const response = await createHubTask(mockRequest, {
      title: "Test Task Title",
      description: "Do this",
      priority: "low",
    });
    expect(response.status).toBe(403);
  });
});

describe("updateHubTaskStatus", () => {
  beforeEach(() => {
    vi.mocked(auth.api.getSession).mockResolvedValue(userSession as any);
  });

  it("updates task status when assigned user", async () => {
    mockHubTaskFindById.mockReturnValue(
      queryBuilder({ _id: "task-1", assignedTo: ["user-1"], hubTeam: "team-1" }),
    );
    mockHubTeamFindById.mockReturnValue(
      queryBuilder({ _id: "team-1", teamLeader: "leader-1" }),
    );
    mockHubTaskFindByIdAndUpdate.mockReturnValue(
      queryBuilder({ _id: "task-1", status: "in-progress" }),
    );

    const response = await updateHubTaskStatus(mockRequest, { taskId: "task-1", status: "in-progress" });
    expect(response.status).toBe(200);
  });

  it("returns 404 when task not found", async () => {
    mockHubTaskFindById.mockReturnValue(queryBuilder(null));
    const response = await updateHubTaskStatus(mockRequest, { taskId: "nonexistent", status: "todo" });
    expect(response.status).toBe(404);
  });

  it("returns 403 when not assigned", async () => {
    mockHubTaskFindById.mockReturnValue(
      queryBuilder({ _id: "task-1", assignedTo: ["user-2"], hubTeam: "team-1" }),
    );
    mockHubTeamFindById.mockReturnValue(
      queryBuilder({ _id: "team-1", teamLeader: "leader-1" }),
    );

    const response = await updateHubTaskStatus(mockRequest, { taskId: "task-1", status: "in-progress" });
    expect(response.status).toBe(403);
  });
});

describe("deleteHubTask", () => {
  beforeEach(() => {
    vi.mocked(auth.api.getSession).mockResolvedValue(adminSession as any);
  });

  it("deletes a hub task", async () => {
    mockHubTaskFindById.mockReturnValue(
      queryBuilder({ _id: "task-1", hubTeam: "team-1" }),
    );
    mockHubTeamFindById.mockReturnValue(
      queryBuilder({ _id: "team-1", teamLeader: "leader-1" }),
    );
    mockHubTaskFindByIdAndDelete.mockResolvedValue({ _id: "task-1" } as any);

    const response = await deleteHubTask(mockRequest, { taskId: "task-1" });
    expect(response.status).toBe(200);
    expect(mockHubTaskFindByIdAndDelete).toHaveBeenCalledWith("task-1");
  });

  it("returns 400 when taskId missing", async () => {
    const response = await deleteHubTask(mockRequest, {});
    expect(response.status).toBe(400);
  });

  it("returns 404 when task not found", async () => {
    mockHubTaskFindById.mockReturnValue(queryBuilder(null));
    const response = await deleteHubTask(mockRequest, { taskId: "nonexistent" });
    expect(response.status).toBe(404);
  });
});

describe("fetchHubData", () => {
  beforeEach(() => {
    vi.mocked(auth.api.getSession).mockResolvedValue(adminSession as any);
  });

  it("returns hub data for admin", async () => {
    mockUserFindById.mockReturnValue(queryBuilder({ _id: "admin-1", cohort: "June-2025", role: "admin" }));
    mockCohortFindOne.mockReturnValue(queryBuilder({ _id: "cohort-1", cohort: "June-2025" }));
    mockProjectFindOne.mockReturnValue(queryBuilder({ _id: "project-1" }));
    mockStageFindOne.mockReturnValue(queryBuilder({ _id: "stage-5", order: 5 }));
    mockTaskFindOne.mockReturnValue(queryBuilder({ _id: "task-5", title: "Stage 5 Task", dueDate: new Date() }));
    mockCohortFindById.mockReturnValue(queryBuilder({ _id: "cohort-1", members: ["user-1", "user-2"] }));
    mockStageFind.mockReturnValue(queryBuilder([{ _id: "s1", order: 1 }, { _id: "s4", order: 4 }]));
    mockStageProgressFind.mockReturnValue(queryBuilder([]));
    mockUserFind.mockReturnValue(queryBuilder([]));
    mockHubTeamFindOne.mockReturnValue(queryBuilder(null));
    mockHubTeamCreate.mockResolvedValue({ _id: "team-1" } as any);
    mockHubTeamFindById.mockReturnValue(
      queryBuilder({ _id: "team-1", cohort: "cohort-1", stage5: "stage-5", teamLeader: null, members: [] }),
    );
    mockHubTaskFind.mockReturnValue(queryBuilder([]));

    const response = await fetchHubData(mockRequest);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.body.isAdmin).toBe(true);
    expect(body.body.isQualified).toBe(true);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await fetchHubData(mockRequest);
    expect(response.status).toBe(401);
  });
});

describe("updateHubTask", () => {
  beforeEach(() => {
    vi.mocked(auth.api.getSession).mockResolvedValue(teamLeaderSession as any);
  });

  it("updates a hub task", async () => {
    mockHubTaskFindById.mockReturnValue(
      queryBuilder({ _id: "task-1", hubTeam: "team-1", assignedTo: ["user-2"], createdBy: "leader-1" }),
    );
    mockHubTeamFindById.mockReturnValue(
      queryBuilder({ _id: "team-1", teamLeader: "leader-1" }),
    );
    mockHubTaskFindByIdAndUpdate.mockReturnValue(
      queryBuilder({ _id: "task-1", title: "Updated", assignedTo: [{ _id: "user-2" }], createdBy: { _id: "leader-1" } }),
    );

    const response = await updateHubTask(mockRequest, { taskId: "task-1", title: "Updated" });
    expect(response.status).toBe(200);
  });

  it("returns 400 when taskId missing", async () => {
    const response = await updateHubTask(mockRequest, { title: "No ID" });
    expect(response.status).toBe(400);
  });

  it("returns 404 when task not found", async () => {
    mockHubTaskFindById.mockReturnValue(queryBuilder(null));
    const response = await updateHubTask(mockRequest, { taskId: "nonexistent", title: "Test" });
    expect(response.status).toBe(404);
  });
});

describe("updateMeetingUrl", () => {
  beforeEach(() => {
    vi.mocked(auth.api.getSession).mockResolvedValue(teamLeaderSession as any);
  });

  it("updates meeting URL", async () => {
    mockUserFindById.mockReturnValue(queryBuilder({ _id: "leader-1", cohort: "June-2025" }));
    mockCohortFindOne.mockReturnValue(queryBuilder({ _id: "cohort-1" }));
    mockHubTeamFindOne.mockReturnValue(
      queryBuilder({ _id: "team-1", teamLeader: "leader-1" }),
    );
    mockHubTeamFindByIdAndUpdate.mockResolvedValue({} as any);

    const response = await updateMeetingUrl(mockRequest, { meetingUrl: "https://zoom.us/j/123" });
    expect(response.status).toBe(200);
    expect(mockHubTeamFindByIdAndUpdate).toHaveBeenCalledWith(
      "team-1",
      { $set: { meetingUrl: "https://zoom.us/j/123" } },
    );
  });

  it("returns 403 when not team leader", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(userSession as any);
    mockUserFindById.mockReturnValue(queryBuilder({ _id: "user-1", cohort: "June-2025" }));
    mockCohortFindOne.mockReturnValue(queryBuilder({ _id: "cohort-1" }));
    mockHubTeamFindOne.mockReturnValue(
      queryBuilder({ _id: "team-1", teamLeader: "leader-1" }),
    );

    const response = await updateMeetingUrl(mockRequest, { meetingUrl: "https://zoom.us/j/123" });
    expect(response.status).toBe(403);
  });
});
