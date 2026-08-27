// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.setConfig({ hookTimeout: 120000, testTimeout: 60000 });

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
  auth: { api: { getSession: vi.fn(), updateUser: vi.fn() } },
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
  fetchWithCache: vi.fn(async (_key: string, _ttl: number, fn?: any) =>
    typeof fn === "function" ? fn() : undefined,
  ),
  invalidateCache: vi.fn(),
}));

vi.mock("~/.server/utils/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("~/.server/workflows/client", () => ({
  workflowClient: { trigger: vi.fn(() => Promise.resolve()) },
}));

// Fixed identities
const ADMIN_ID = new mongoose.Types.ObjectId("aaaaaaaaaaaaaaaaaaaaaaaa");
const INTERN_A = new mongoose.Types.ObjectId("bbbbbbbbbbbbbbbbbbbbbbbb");
const INTERN_B = new mongoose.Types.ObjectId("cccccccccccccccccccccccc");
const INTERN_C = new mongoose.Types.ObjectId("dddddddddddddddddddddddd");

const adminSession = {
  user: {
    id: ADMIN_ID.toString(),
    name: "Admin",
    email: "admin@example.com",
    role: "admin",
    program: "full-stack",
  },
  session: { token: "mock-token" },
} as any;

const internSession = (id: mongoose.Types.ObjectId) =>
  ({
    user: {
      id: id.toString(),
      name: "Intern",
      email: "intern@example.com",
      role: "user",
      program: "full-stack",
    },
    session: { token: "mock-token" },
  }) as any;

const crossProgramAdminSession = {
  user: {
    id: ADMIN_ID.toString(),
    name: "Admin",
    email: "admin@example.com",
    role: "admin",
    program: "product-design",
  },
  session: { token: "mock-token" },
} as any;

const superAdminSession = {
  user: {
    id: ADMIN_ID.toString(),
    name: "Super",
    email: "super@example.com",
    role: "super_admin",
    program: "product-design",
  },
  session: { token: "mock-token" },
} as any;

let mongoServer: MongoMemoryServer;
let Cohort: any,
  Project: any,
  Stage: any,
  Task: any,
  Submission: any,
  StageProgress: any;

// action modules
let createCohort: any,
  createProject: any,
  updateProject: any,
  deleteProject: any,
  getProjectStages: any,
  getProjectTaskScoreBoard: any;
let createStage: any, updateStage: any, deleteStage: any;
let createTask: any, submitTask: any, activateStage: any, fetchTasksData: any,
  getTaskStatsForUser: any, getTaskStatsForAdmins: any;
let gradeTask: any, fetchGradeTaskData: any;
let getUserTaskSubmissions: any;
let runStatusUpdatesWorkflow: any;

const json = (res: any) => res.json();

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: { launchTimeout: 60000 },
  });
  const uri = mongoServer.getUri();
  process.env.DATABASE_URL = uri;
  await mongoose.connect(uri);

  const models = await Promise.all([
    import("~/.server/model/cohort"),
    import("~/.server/model/project"),
    import("~/.server/model/stage"),
    import("~/.server/model/task"),
    import("~/.server/model/submission"),
    import("~/.server/model/stageProgress"),
  ]);
  Cohort = models[0].default;
  Project = models[1].default;
  Stage = models[2].default;
  Task = models[3].default;
  Submission = models[4].default;
  StageProgress = models[5].default;

  const cohortMod = await import("~/.server/action/cohort");
  const projectMod = await import("~/.server/action/project");
  const stageMod = await import("~/.server/action/stage");
  const taskMod = await import("~/.server/action/task");
  const gradeMod = await import("~/.server/action/grade");
  const subMod = await import("~/.server/action/submissions");
  const wfMod = await import("~/.server/workflows/status.workflow");

  createCohort = cohortMod.createCohort;
  createProject = projectMod.createProject;
  updateProject = projectMod.updateProject;
  deleteProject = projectMod.deleteProject;
  getProjectStages = projectMod.getProjectStages;
  getProjectTaskScoreBoard = projectMod.getProjectTaskScoreBoard;

  createStage = stageMod.createStage;
  updateStage = stageMod.updateStage;
  deleteStage = stageMod.deleteStage;

  createTask = taskMod.createTask;
  submitTask = taskMod.submitTask;
  activateStage = taskMod.activateStage;
  fetchTasksData = taskMod.fetchTasksData;
  getTaskStatsForUser = taskMod.getTaskStatsForUser;
  getTaskStatsForAdmins = taskMod.getTaskStatsForAdmins;

  gradeTask = gradeMod.gradeTask;
  fetchGradeTaskData = gradeMod.fetchGradeTaskData;

  getUserTaskSubmissions = subMod.getUserTaskSubmissions;
  runStatusUpdatesWorkflow = wfMod.runStatusUpdatesWorkflow;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
});

let authApi: any;
let checkRateLimit: any;
let NotificationService: any;
let workflowClient: any;
let dispatchIntegrationEvent: any;
let AuditLogService: any;

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

  const auth = await import("~/.server/services/better-auth");
  authApi = auth.auth.api;
  vi.mocked(authApi.getSession).mockResolvedValue(adminSession);

  const rl = await import("~/.server/utils/rate-limit");
  checkRateLimit = rl.checkRateLimit;
  vi.mocked(checkRateLimit).mockResolvedValue(null as any);

  const ns = await import("~/.server/services/notification.service");
  NotificationService = ns.NotificationService;
  const wc = await import("~/.server/workflows/client");
  workflowClient = wc.workflowClient;
  const di = await import("~/.server/integrations/registry");
  dispatchIntegrationEvent = di.dispatchIntegrationEvent;
  const al = await import("~/.server/services/auditlog.service");
  AuditLogService = al.AuditLogService;
});

// ── helpers ────────────────────────────────────────────────────────────────
const setSession = (session: any) =>
  vi.mocked(authApi.getSession).mockResolvedValue(session);

const req = (url = "http://localhost") =>
  new Request(url, { headers: { "Content-Type": "application/json" } });

const futureDate = (daysAhead: number) =>
  new Date(Date.now() + daysAhead * 86400000).toISOString().split("T")[0];

async function seedCohortAndProject(memberIds: mongoose.Types.ObjectId[]) {
  const cohortRes = await createCohort(req(), {
    cohort: "FULLSTACK",
    program: "full-stack",
  });
  expect(cohortRes.status).toBe(201);
  const cohort = (await json(cohortRes)).cohort;

  await Cohort.findByIdAndUpdate(cohort._id, { $set: { members: memberIds } });

  const projectRes = await createProject(req(), {
    title: "Capstone Project",
    description: "A sufficiently long project description.",
    cohortId: cohort._id.toString(),
    startDate: futureDate(1),
    endDate: futureDate(60),
  });
  expect(projectRes.status).toBe(201);
  const project = (await json(projectRes)).project;

  const stages = await Stage.find({ project: project._id }).sort({ order: 1 }).lean();
  expect(stages.length).toBe(5); // auto-created stages
  return { cohort, project, stages };
}

async function createTaskInStage(
  stageId: string,
  i: number,
  overrides: any = {},
) {
  const res = await createTask(req(), {
    stage: stageId,
    title: `Task ${i}`,
    description: "A sufficiently long task description.",
    type: "individual",
    maxScore: 100,
    order: i,
    dueDate: futureDate(30),
    maxAttempts: 3,
    allowLate: true,
    latePenaltyPercent: 5,
    ...overrides,
  });
  expect(res.status).toBe(201);
  return (await json(res)).task;
}

// Drives one user through every stage: activate stage 1, then for each stage
// submit its tasks and grade them. Grading a stage to pass auto-activates the
// next stage for that user.
async function fulfill(userId: mongoose.Types.ObjectId, stages: any[], tasksByStage: any[][], score = 100) {
  setSession(internSession(userId));
  const activateRes = await activateStage(req(), {
    stageId: stages[0]._id.toString(),
  });
  expect(activateRes.status).toBe(200);

  for (const stage of stages) {
    const tasks = tasksByStage.find(
      (t) => t[0].stage.toString() === stage._id.toString(),
    )!;
    setSession(internSession(userId));
    for (const task of tasks) {
      const subRes = await submitTask(req(), {
        taskId: task._id.toString(),
        content: "My solution",
      });
      expect(subRes.status).toBe(200);
    }
    setSession(adminSession);
    for (const task of tasks) {
      const submission = await Submission.findOne({
        task: task._id,
        user: userId,
      }).lean();
      const gradeRes = await gradeTask(req(), {
        submissionId: submission!._id.toString(),
        score,
      });
      expect(gradeRes.status).toBe(200);
    }
  }
}

// ── tests ───────────────────────────────────────────────────────────────────
describe("Cohort & program setup", () => {
  it("creates an active cohort and blocks a second active one for the program", async () => {
    const r1 = await createCohort(req(), { cohort: "FS-1", program: "full-stack" });
    expect(r1.status).toBe(201);
    const r2 = await createCohort(req(), { cohort: "FS-2", program: "full-stack" });
    expect(r2.status).toBe(400);
    const body = await json(r2);
    expect(body.success).toBe(false);
  });
});

describe("Project lifecycle", () => {
  it("creates a project with 5 auto-stages and rejects when cohort is inactive", async () => {
    const cohortRes = await createCohort(req(), {
      cohort: "FS-COHORT",
      program: "full-stack",
    });
    const cohort = (await json(cohortRes)).cohort;
    await Cohort.findByIdAndUpdate(cohort._id, { $set: { status: "inactive" } });

    const projectRes = await createProject(req(), {
      title: "Capstone",
      description: "A sufficiently long project description.",
      cohortId: cohort._id.toString(),
      startDate: futureDate(1),
      endDate: futureDate(60),
    });
    expect(projectRes.status).toBe(400);

    // reactivate and create successfully
    await Cohort.findByIdAndUpdate(cohort._id, { $set: { status: "active" } });
    const ok = await createProject(req(), {
      title: "Capstone",
      description: "A sufficiently long project description.",
      cohortId: cohort._id.toString(),
      startDate: futureDate(1),
      endDate: futureDate(60),
    });
    expect(ok.status).toBe(201);
    const stages = await Stage.find({ project: (await json(ok)).project._id });
    expect(stages.length).toBe(5);
  });

  it("rejects a second active/upcoming project for the same cohort", async () => {
    const { cohort } = await seedCohortAndProject([INTERN_A]);
    const dup = await createProject(req(), {
      title: "Second",
      description: "A sufficiently long project description.",
      cohortId: cohort._id.toString(),
      startDate: futureDate(2),
      endDate: futureDate(70),
    });
    expect(dup.status).toBe(400);
  });

  it("updates project status (manual completion) and deletes a project", async () => {
    const { project } = await seedCohortAndProject([INTERN_A]);
    const upd = await updateProject(req(`http://localhost/?id=${project._id}`), {
      title: project.title,
      description: "A sufficiently long project description.",
      cohortId: project.cohort.toString(),
      startDate: futureDate(1),
      endDate: futureDate(60),
      status: "completed",
    });
    expect(upd.status).toBe(200);
    const updated = await Project.findById(project._id).lean();
    expect(updated!.status).toBe("completed");

    const del = await deleteProject(req(), { id: project._id.toString() });
    expect(del.status).toBe(200);
    expect(await Project.findById(project._id)).toBeNull();
  });

  it("completes a project via the status workflow when endDate has passed", async () => {
    const { project } = await seedCohortAndProject([INTERN_A]);
    await Project.findByIdAndUpdate(project._id, {
      $set: { status: "active", endDate: new Date(Date.now() - 86400000) },
    });

    const fakeContext = { run: async (_label: string, fn: any) => fn() };
    await runStatusUpdatesWorkflow(fakeContext as any);

    const updated = await Project.findById(project._id).lean();
    expect(updated!.status).toBe("completed");
    expect(
      vi.mocked(dispatchIntegrationEvent).mock.calls.some(
        (c) => c[0] === "project_completed",
      ),
    ).toBe(true);
  });
});

describe("Stage CRUD", () => {
  it("creates, updates, deletes stages and enforces the 5-stage cap", async () => {
    const { project } = await seedCohortAndProject([INTERN_A]);
    // remove the 5 auto stages to start fresh
    await Stage.deleteMany({ project: project._id });

    for (let i = 1; i <= 5; i++) {
      const r = await createStage(req(), {
        projectId: project._id.toString(),
        title: `Stage ${i}`,
        description: "desc",
        passPercentage: 70,
      });
      expect(r.status).toBe(201);
    }
    const sixth = await createStage(req(), {
      projectId: project._id.toString(),
      title: "Stage 6",
      passPercentage: 70,
    });
    expect(sixth.status).toBe(400); // capped at 5

    const created = await Stage.find({ project: project._id }).lean();
    const upd = await updateStage(req(), {
      projectId: project._id.toString(),
      stageId: created[0]._id.toString(),
      title: "Renamed",
      passPercentage: 80,
    });
    expect(upd.status).toBe(200);

    const del = await deleteStage(req(), {
      projectId: project._id.toString(),
      stageId: created[0]._id.toString(),
    });
    expect(del.status).toBe(200);
    expect(await Stage.findById(created[0]._id)).toBeNull();
  });
});

describe("Task lifecycle", () => {
  it("creates individual and group tasks and validates input", async () => {
    const { stages } = await seedCohortAndProject([INTERN_A]);
    const individual = await createTaskInStage(stages[0]._id.toString(), 1, {
      type: "individual",
    });
    expect(individual.type).toBe("individual");
    const group = await createTaskInStage(stages[0]._id.toString(), 2, {
      type: "group",
    });
    expect(group.type).toBe("group");

    // past dueDate rejected
    const past = await createTask(req(), {
      stage: stages[0]._id.toString(),
      title: "Late task",
      description: "A sufficiently long task description.",
      type: "individual",
      maxScore: 100,
      order: 3,
      dueDate: futureDate(-1),
    });
    expect(past.status).toBe(400);

    // maxScore < 1 rejected
    const bad = await createTask(req(), {
      stage: stages[0]._id.toString(),
      title: "Bad score",
      description: "A sufficiently long task description.",
      type: "individual",
      maxScore: 0,
      order: 4,
      dueDate: futureDate(30),
    });
    expect(bad.status).toBe(400);
  });

  it("blocks submission after due date when allowLate is false", async () => {
    const { stages } = await seedCohortAndProject([INTERN_A]);
    const task = await createTaskInStage(stages[0]._id.toString(), 1, {
      allowLate: false,
    });
    await Task.findByIdAndUpdate(task._id, {
      $set: { dueDate: new Date(Date.now() - 86400000) },
    });
    setSession(internSession(INTERN_A));
    const res = await submitTask(req(), { taskId: task._id.toString() });
    expect(res.status).toBe(400);
  });

  it("returns 400 when activating an already-active stage", async () => {
    const { stages } = await seedCohortAndProject([INTERN_A]);
    setSession(internSession(INTERN_A));
    const first = await activateStage(req(), {
      stageId: stages[0]._id.toString(),
    });
    expect(first.status).toBe(200);
    const second = await activateStage(req(), {
      stageId: stages[0]._id.toString(),
    });
    expect(second.status).toBe(400);
  });
});

describe("Full intern fulfillment flow (single member → project 100%)", () => {
  it("activates stages, submits & grades every task across all 5 stages to completion", async () => {
    const { stages } = await seedCohortAndProject([INTERN_A]);

    // one extra group task in stage 1 to exercise group typing
    const groupTask = await createTaskInStage(stages[0]._id.toString(), 99, {
      type: "group",
    });

    const tasksByStage = await Promise.all(
      stages.map(async (stage: any, idx: number) => {
        const tasks = [await createTaskInStage(stage._id.toString(), 1)];
        if (idx === 0) tasks.push(groupTask);
        return tasks;
      }),
    );

    await fulfill(INTERN_A, stages, tasksByStage);

    // all stage progresses for the intern are completed
    const progresses = await StageProgress.find({ user: INTERN_A }).lean();
    expect(progresses.length).toBe(5);
    expect(progresses.every((p) => p.status === "completed")).toBe(true);

    // recompute completion state from DB
    const project = await Project.findOne({}).lean();
    expect(project!.progress).toBe(100);
  });
});

describe("Late penalty, returned, and resubmission", () => {
  it("applies a late penalty, supports returned→resubmit within maxAttempts", async () => {
    const { stages } = await seedCohortAndProject([INTERN_A]);

    // late task
    const lateTask = await createTaskInStage(stages[0]._id.toString(), 1, {
      latePenaltyPercent: 10,
    });
    await Task.findByIdAndUpdate(lateTask._id, {
      $set: { dueDate: new Date(Date.now() - 10 * 86400000) },
    });

    setSession(internSession(INTERN_A));
    const lateSub = await submitTask(req(), {
      taskId: lateTask._id.toString(),
      content: "late",
    });
    expect(lateSub.status).toBe(200);
    const lateSubmission = await Submission.findOne({
      task: lateTask._id,
      user: INTERN_A,
    }).lean();
    expect(lateSubmission!.isLate).toBe(true);
    expect(lateSubmission!.latePenalty).toBe(10);

    setSession(adminSession);
    await gradeTask(req(), {
      submissionId: lateSubmission!._id.toString(),
      score: 100,
    });
    const graded = await Submission.findById(lateSubmission!._id).lean();
    expect(graded!.latePenalty).toBeGreaterThan(0);
    expect(graded!.score).toBeLessThan(100);
    expect(graded!.score).toBe(
      Math.round(graded!.maxScore * (1 - graded!.latePenalty / 100)),
    );

    // returned → resubmit cycle on a separate task
    const task2 = await createTaskInStage(stages[0]._id.toString(), 2, {
      maxAttempts: 2,
    });
    setSession(internSession(INTERN_A));
    await submitTask(req(), { taskId: task2._id.toString(), content: "v1" });
    let sub2 = await Submission.findOne({ task: task2._id, user: INTERN_A }).lean();

    const notifyBefore = vi.mocked(NotificationService.send).mock.calls.length;
    setSession(adminSession);
    await gradeTask(req(), {
      submissionId: sub2!._id.toString(),
      score: 50,
      status: "returned",
    });
    const returned = await Submission.findById(sub2!._id).lean();
    expect(returned!.status).toBe("returned");

    // returned grading must NOT fire the submission_graded notification
    const gradedNotifyCalls = vi.mocked(NotificationService.send).mock.calls.filter(
      (c) => c[0].type === "submission_graded",
    );
    expect(gradedNotifyCalls.length).toBe(notifyBefore);
    expect(
      vi.mocked(AuditLogService.record).mock.calls.some(
        (c) => c[1].action === "RETURN_SUBMISSION",
      ),
    ).toBe(true);

    // resubmit (attempt 2) and grade successfully
    setSession(internSession(INTERN_A));
    const resub = await submitTask(req(), {
      taskId: task2._id.toString(),
      content: "v2",
    });
    expect(resub.status).toBe(200);
    sub2 = await Submission.findOne({ task: task2._id, user: INTERN_A })
      .sort({ attemptNumber: -1 })
      .lean();
    expect(sub2!.attemptNumber).toBe(2);

    setSession(adminSession);
    const gradeRes = await gradeTask(req(), {
      submissionId: sub2!._id.toString(),
      score: 90,
    });
    expect(gradeRes.status).toBe(200);
    const finalSub = await Submission.findById(sub2!._id).lean();
    expect(finalSub!.status).toBe("graded");
    expect(finalSub!.score).toBe(90);
  });
});

describe("Multi-member progress aggregation", () => {
  it("reaches 50% when one of two members completes, 100% when both do", async () => {
    const { stages } = await seedCohortAndProject([INTERN_A, INTERN_B]);

    const tasksByStage = await Promise.all(
      stages.map(async (stage: any) => [
        await createTaskInStage(stage._id.toString(), 1),
      ]),
    );

    await fulfill(INTERN_A, stages, tasksByStage);
    let project = await Project.findOne({}).lean();
    expect(project!.progress).toBe(50);

    await fulfill(INTERN_B, stages, tasksByStage);
    project = await Project.findOne({}).lean();
    expect(project!.progress).toBe(100);
  });
});

describe("Stage auto-fail (status workflow)", () => {
  it("fails an active stage progress past its endDate with no submissions", async () => {
    const { stages } = await seedCohortAndProject([INTERN_C]);
    const task = await createTaskInStage(stages[0]._id.toString(), 1);

    // stage 1 past its endDate; intern activated it but never submitted
    await Stage.findByIdAndUpdate(stages[0]._id, {
      $set: { endDate: new Date(Date.now() - 86400000) },
    });
    setSession(internSession(INTERN_C));
    const activate = await activateStage(req(), {
      stageId: stages[0]._id.toString(),
    });
    expect(activate.status).toBe(200);

    const fakeContext = { run: async (_l: string, fn: any) => fn() };
    await runStatusUpdatesWorkflow(fakeContext as any);

    const progress = await StageProgress.findOne({
      user: INTERN_C,
      stage: stages[0]._id,
    }).lean();
    expect(progress!.status).toBe("failed");
    expect(progress!.passed).toBe(false);
    expect(
      vi.mocked(dispatchIntegrationEvent).mock.calls.some(
        (c) => c[0] === "project_completed",
      ),
    ).toBe(false);
  });
});

describe("RBAC", () => {
  it("forbids grading by an intern and by a cross-program admin; allows super_admin", async () => {
    const { stages } = await seedCohortAndProject([INTERN_A]);
    const task = await createTaskInStage(stages[0]._id.toString(), 1);
    setSession(internSession(INTERN_A));
    await submitTask(req(), { taskId: task._id.toString(), content: "x" });
    const submission = await Submission.findOne({
      task: task._id,
      user: INTERN_A,
    }).lean();

    setSession(internSession(INTERN_A));
    const asIntern = await gradeTask(req(), {
      submissionId: submission!._id.toString(),
      score: 100,
    });
    expect(asIntern.status).toBe(403);

    setSession(crossProgramAdminSession);
    const asCross = await gradeTask(req(), {
      submissionId: submission!._id.toString(),
      score: 100,
    });
    expect(asCross.status).toBe(403);

    setSession(superAdminSession);
    const asSuper = await gradeTask(req(), {
      submissionId: submission!._id.toString(),
      score: 100,
    });
    expect(asSuper.status).toBe(200);
  });

  it("restricts admin-only task stats to admins", async () => {
    await seedCohortAndProject([INTERN_A]);
    setSession(internSession(INTERN_A));
    const asUser = await getTaskStatsForAdmins(req());
    expect(asUser.status).toBe(403);

    setSession(adminSession);
    const asAdmin = await getTaskStatsForAdmins(req());
    expect(asAdmin.status).toBe(200);
  });
});

describe("Side-effects on grade & completion", () => {
  it("fires notifications/workflow/integration on a successful grade", async () => {
    const { stages } = await seedCohortAndProject([INTERN_A]);
    const task = await createTaskInStage(stages[0]._id.toString(), 1);
    setSession(internSession(INTERN_A));
    await submitTask(req(), { taskId: task._id.toString(), content: "x" });
    const submission = await Submission.findOne({
      task: task._id,
      user: INTERN_A,
    }).lean();

    setSession(adminSession);
    await gradeTask(req(), {
      submissionId: submission!._id.toString(),
      score: 100,
    });

    expect(
      vi.mocked(NotificationService.send).mock.calls.some(
        (c) => c[0].type === "submission_graded",
      ),
    ).toBe(true);
    expect(
      vi.mocked(workflowClient.trigger).mock.calls.some((c) =>
        c[0].url.includes("/api/v1/workflow/submission-graded"),
      ),
    ).toBe(true);
    expect(
      vi.mocked(dispatchIntegrationEvent).mock.calls.some(
        (c) => c[0] === "submission_graded",
      ),
    ).toBe(true);
    expect(
      vi.mocked(AuditLogService.record).mock.calls.some(
        (c) => c[1].action === "GRADE_TASK",
      ),
    ).toBe(true);
  });
});

describe("User-facing data reads", () => {
  it("fetches tasks, submissions, and stats for the intern and admins", async () => {
    const { stages } = await seedCohortAndProject([INTERN_A]);
    const task = await createTaskInStage(stages[0]._id.toString(), 1);
    setSession(internSession(INTERN_A));
    await activateStage(req(), { stageId: stages[0]._id.toString() });
    await submitTask(req(), { taskId: task._id.toString(), content: "x" });

    const tasksData = await fetchTasksData(req());
    expect(tasksData.status).toBe(200);
    const td = await json(tasksData);
    expect(td.body.project).not.toBeNull();
    expect(td.body.stages.length).toBe(5);

    const subs = await getUserTaskSubmissions({ request: req() });
    expect(subs.status).toBe(200);
    expect((await json(subs)).body.submissions.length).toBe(1);

    const userStats = await getTaskStatsForUser(req());
    expect(userStats.status).toBe(200);

    setSession(adminSession);
    const adminStats = await getTaskStatsForAdmins(req());
    expect(adminStats.status).toBe(200);

    const board = await getProjectTaskScoreBoard(req());
    expect(board.status).toBe(200);
  });
});
