// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.setConfig({ hookTimeout: 120000 });
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

vi.hoisted(() => {
  process.env.DATABASE_URL = "mongodb://localhost:27017/test";
  process.env.DATABASE_NAME = "test";
  process.env.EMAIL_HOST = "localhost";
  process.env.EMAIL_PORT = "1025";
  process.env.EMAIL_USER = "";
  process.env.EMAIL_PASSWORD = "";
  process.env.BETTER_AUTH_URL = "http://localhost:3700";
  process.env.BETTER_AUTH_SECRET = "test-secret";
  process.env.CLIENT_URL = "http://localhost:3700";
  process.env.CLOUDINARY_CLOUD_NAME = "test";
  process.env.CLOUDINARY_API_KEY = "test";
  process.env.CLOUDINARY_SECRET_KEY = "test";
  process.env.CLOUDINARY_UPLOAD_PRESET = "test";
  process.env.UPSTASH_REDIS_REST_URL = "http://localhost:6379";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test";
  process.env.QSTASH_TOKEN = "test";
  process.env.QSTASH_URL = "http://localhost:8080";
  process.env.OPENCODE_ZEN_API_KEY = "test";
  process.env.NODE_ENV = "test";
});

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

vi.mock("~/.server/integrations/registry", () => ({
  dispatchIntegrationEvent: vi.fn(),
}));

vi.mock("~/.server/utils/cache", () => ({
  fetchWithCache: vi.fn(),
  invalidateCache: vi.fn(),
}));

vi.mock("~/.server/utils/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("~/.server/workflows/client", () => ({
  workflowClient: { trigger: vi.fn(() => Promise.resolve()) },
}));

const ADMIN_ID = new mongoose.Types.ObjectId("aaaaaaaaaaaaaaaaaaaaaaaa");
const USER_ID = new mongoose.Types.ObjectId("bbbbbbbbbbbbbbbbbbbbbbbb");

const mockSession = {
  user: { id: ADMIN_ID.toString(), name: "Admin", email: "admin@example.com", role: "admin", program: "full-stack" } as any,
  session: { token: "mock-token" } as any,
};

let mongoServer: MongoMemoryServer;
let gradeTask: any;
let Submission: any, Task: any, Stage: any, StageProgress: any, Project: any, Cohort: any;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      launchTimeout: 60000,
    },
  });
  const uri = mongoServer.getUri();
  process.env.DATABASE_URL = uri;
  await mongoose.connect(uri);

  const submissionMod = await import("~/.server/model/submission");
  const taskMod = await import("~/.server/model/task");
  const stageMod = await import("~/.server/model/stage");
  const stageProgressMod = await import("~/.server/model/stageProgress");
  const projectMod = await import("~/.server/model/project");
  const cohortMod = await import("~/.server/model/cohort");

  Submission = submissionMod.default;
  Task = taskMod.default;
  Stage = stageMod.default;
  StageProgress = stageProgressMod.default;
  Project = projectMod.default;
  Cohort = cohortMod.default;

  const gradeModule = await import("../grade");
  gradeTask = gradeModule.gradeTask;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
});

beforeEach(async () => {
  await Promise.all([
    Submission.deleteMany({}),
    Task.deleteMany({}),
    Stage.deleteMany({}),
    StageProgress.deleteMany({}),
    Project.deleteMany({}),
    Cohort.deleteMany({}),
  ]);
  vi.clearAllMocks();
  const { auth } = await import("~/.server/services/better-auth");
  vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
  const { checkRateLimit } = await import("~/.server/utils/rate-limit");
  vi.mocked(checkRateLimit).mockResolvedValue(null as any);
});

async function seedData(overrides: {
  passPercentage?: number;
  numTasks?: number;
  numStages?: number;
} = {}) {
  const passPct = overrides.passPercentage ?? 70;
  const numTasks = overrides.numTasks ?? 2;
  const numStages = overrides.numStages ?? 2;

  const cohort = await Cohort.create({
    cohort: "June-2025",
    status: "active",
    program: "full-stack",
    members: [USER_ID],
  });

  const project = await Project.create({
    title: "Capstone",
    description: "Final project",
    cohort: cohort._id,
    createdBy: ADMIN_ID,
    status: "active",
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000 * 30),
    progress: 0,
  });

  const stages = [];
  for (let i = 1; i <= numStages; i++) {
    const stage = await Stage.create({
      project: project._id,
      order: i,
      title: `Stage ${i}`,
      description: `Description ${i}`,
      passPercentage: passPct,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 7),
    });
    stages.push(stage);
  }

  const tasks = [];
  for (let i = 1; i <= numTasks; i++) {
    const task = await Task.create({
      stage: stages[0]._id,
      title: `Task ${i}`,
      description: `Description ${i}`,
      type: "individual",
      maxScore: 100,
      isBonus: false,
      order: i,
      dueDate: new Date(Date.now() + 86400000 * 7),
      maxAttempts: 3,
      allowLate: false,
    });
    tasks.push(task);
  }

  await StageProgress.create({
    user: USER_ID,
    stage: stages[0]._id,
    status: "active",
    startedAt: new Date(),
  });

  return { cohort, project, stages, tasks };
}

const mockRequest = new Request("http://localhost:3700", {
  headers: { "Content-Type": "application/json" },
});

describe("gradeTask (integration)", () => {
  it("grades a submission and updates the database", async () => {
    const { tasks } = await seedData();
    const submission = await Submission.create({
      task: tasks[0]._id,
      user: USER_ID,
      content: "My solution",
      status: "submitted",
      maxScore: 100,
      attemptNumber: 1,
      submittedAt: new Date(),
      isLate: false,
      latePenalty: 0,
    });

    const response = await gradeTask(mockRequest, {
      submissionId: submission._id.toString(),
      score: 85,
      feedback: "Good work!",
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    const updated = await Submission.findById(submission._id).lean();
    expect(updated?.score).toBe(85);
    expect(updated?.percentage).toBe(85);
    expect(updated?.gradedBy?.toString()).toBe(ADMIN_ID.toString());
    expect(updated?.status).toBe("graded");
  });

  it("marks stage as completed and activates next stage when score meets pass percentage", async () => {
    const { stages } = await seedData({ passPercentage: 70, numTasks: 1, numStages: 2 });

    const submission = await Submission.create({
      task: (await Task.findOne({ stage: stages[0]._id }).lean())!._id,
      user: USER_ID,
      content: "My solution",
      status: "submitted",
      maxScore: 100,
      attemptNumber: 1,
      submittedAt: new Date(),
      isLate: false,
      latePenalty: 0,
    });

    await gradeTask(mockRequest, {
      submissionId: submission._id.toString(),
      score: 85,
    });

    const stageProgress = await StageProgress.findOne({
      user: USER_ID,
      stage: stages[0]._id,
    }).lean();

    expect(stageProgress?.status).toBe("completed");
    expect(stageProgress?.passed).toBe(true);

    const nextStageProgress = await StageProgress.findOne({
      user: USER_ID,
      stage: stages[1]._id,
    }).lean();
    expect(nextStageProgress?.status).toBe("active");
  });

  it("does not complete stage when score is below pass percentage", async () => {
    const { stages } = await seedData({ passPercentage: 90, numTasks: 1, numStages: 1 });

    const submission = await Submission.create({
      task: (await Task.findOne({ stage: stages[0]._id }).lean())!._id,
      user: USER_ID,
      content: "My solution",
      status: "submitted",
      maxScore: 100,
      attemptNumber: 1,
      submittedAt: new Date(),
      isLate: false,
      latePenalty: 0,
    });

    await gradeTask(mockRequest, {
      submissionId: submission._id.toString(),
      score: 50,
    });

    const stageProgress = await StageProgress.findOne({
      user: USER_ID,
      stage: stages[0]._id,
    }).lean();

    expect(stageProgress?.status).not.toBe("completed");
    expect(stageProgress?.passed).toBe(false);
    expect(stageProgress?.percentage).toBe(50);
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("~/.server/services/better-auth");
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const response = await gradeTask(mockRequest, {
      submissionId: "any",
      score: 85,
    });
    expect(response.status).toBe(401);
  });

  it("returns 400 when score exceeds maxScore", async () => {
    const { tasks } = await seedData({ numTasks: 1, numStages: 1 });
    const submission = await Submission.create({
      task: tasks[0]._id,
      user: USER_ID,
      content: "My solution",
      status: "submitted",
      maxScore: 100,
      attemptNumber: 1,
      submittedAt: new Date(),
      isLate: false,
      latePenalty: 0,
    });

    const response = await gradeTask(mockRequest, {
      submissionId: submission._id.toString(),
      score: 150,
    });
    expect(response.status).toBe(400);
  });

  it("returns 404 when submission does not exist", async () => {
    const response = await gradeTask(mockRequest, {
      submissionId: new mongoose.Types.ObjectId().toString(),
      score: 85,
    });
    expect(response.status).toBe(404);
  });

  it("returns 400 when submissionId or score is missing", async () => {
    const response = await gradeTask(mockRequest, {});
    expect(response.status).toBe(400);
  });

  it("updates project progress after grading", async () => {
    const { project, stages } = await seedData({ numStages: 2, numTasks: 1 });

    const submission = await Submission.create({
      task: (await Task.findOne({ stage: stages[0]._id }).lean())!._id,
      user: USER_ID,
      content: "My solution",
      status: "submitted",
      maxScore: 100,
      attemptNumber: 1,
      submittedAt: new Date(),
      isLate: false,
      latePenalty: 0,
    });

    await gradeTask(mockRequest, {
      submissionId: submission._id.toString(),
      score: 85,
    });

    const updatedProject = await Project.findById(project._id).lean();
    expect(updatedProject?.progress).toBeGreaterThan(0);
  });
});
