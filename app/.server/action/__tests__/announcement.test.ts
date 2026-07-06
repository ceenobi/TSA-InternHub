// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

type AnyObj = Record<string, any>;

let mockFindByIdResult: AnyObj | null = null;
let mockFindResult: AnyObj[] = [];
let mockCountResult = 0;

function queryBuilder(result: AnyObj | AnyObj[] | null) {
  const q = vi.fn(() => q) as any;
  q.lean = vi.fn(() => Promise.resolve(result));
  q.select = vi.fn(() => q);
  q.populate = vi.fn(() => q);
  q.sort = vi.fn(() => q);
  q.skip = vi.fn(() => q);
  q.limit = vi.fn(() => q);
  return q;
}

vi.mock("~/.server/services/better-auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("~/.server/config/logger", () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("~/.server/model/announcement", () => ({
  default: {
    create: vi.fn(),
    findById: vi.fn((id: string) => queryBuilder(mockFindByIdResult)),
    find: vi.fn(() => queryBuilder(mockFindResult)),
    findByIdAndDelete: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    countDocuments: vi.fn(() => Promise.resolve(mockCountResult)),
  },
}));

vi.mock("~/.server/model/user", () => ({
  default: {
    findById: vi.fn(() => queryBuilder({ _id: "user-1", cohort: "cohort-1", role: "user" })),
    find: vi.fn(() => queryBuilder([])),
  },
}));

vi.mock("~/.server/model/cohort", () => ({
  default: {
    findOne: vi.fn(() => queryBuilder({ _id: "cohort-1", cohort: "cohort-1", program: "full-stack" })),
    findById: vi.fn(() => queryBuilder({ _id: "cohort-1", members: [] })),
    find: vi.fn(() => queryBuilder([])),
  },
}));

vi.mock("~/.server/services/auditlog.service", () => ({
  AuditLogService: { record: vi.fn() },
}));

vi.mock("~/.server/services/notification.service", () => ({
  NotificationService: { send: vi.fn() },
}));

vi.mock("~/.server/utils/cache", () => ({
  fetchWithCache: vi.fn(),
  invalidateCache: vi.fn(),
}));

vi.mock("~/.server/utils/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

import { createAnnouncement, deleteAnnouncement, togglePinAnnouncement } from "../announcement";
import { auth } from "~/.server/services/better-auth";
import Announcement from "~/.server/model/announcement";
import { invalidateCache } from "~/.server/utils/cache";
import { checkRateLimit } from "~/.server/utils/rate-limit";
import { AuditLogService } from "~/.server/services/auditlog.service";

const mockSession = {
  user: { id: "admin-1", name: "Admin User", email: "admin@example.com", role: "admin" },
  session: { token: "mock-token" },
};

const mockRequest = new Request("http://localhost:3700", {
  headers: { "Content-Type": "application/json" },
});

const makeAnnouncement = (overrides = {}) => ({
  _id: "ann-1",
  title: "Test Announcement",
  content: "This is a test announcement with enough content.",
  createdBy: { _id: "admin-1", name: "Admin", email: "admin@example.com" },
  target: "all",
  priority: "normal",
  pinned: false,
  expiresAt: null,
  createdAt: new Date(),
  toString() { return this._id; },
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue(null as any);
  vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
  mockFindByIdResult = null;
  mockFindResult = [];
  mockCountResult = 0;
});

describe("createAnnouncement", () => {
  it("creates an announcement successfully", async () => {
    const announcement = makeAnnouncement();
    vi.mocked(Announcement.create).mockResolvedValue(announcement as any);
    mockFindByIdResult = announcement;

    const response = await createAnnouncement(mockRequest, {
      title: "Test Announcement",
      content: "This is a test announcement with enough content.",
      target: "all",
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe("Announcement created");
    expect(Announcement.create).toHaveBeenCalledOnce();
    expect(invalidateCache).toHaveBeenCalledWith("announcements:*");
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const response = await createAnnouncement(mockRequest, {
      title: "Test", content: "Content here", target: "all",
    });
    expect(response.status).toBe(401);
  });

  it("returns 403 when user is not admin", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user-1", name: "User", email: "u@example.com", role: "user" },
      session: { token: "mock-token" },
    });

    const response = await createAnnouncement(mockRequest, {
      title: "Test", content: "Content here", target: "all",
    });
    expect(response.status).toBe(403);
  });

  it("returns 400 for invalid data", async () => {
    const response = await createAnnouncement(mockRequest, {
      title: "AB", content: "Short", target: "invalid",
    });
    expect(response.status).toBe(400);
  });
});

describe("deleteAnnouncement", () => {
  it("deletes an announcement successfully", async () => {
    mockFindByIdResult = makeAnnouncement();

    const response = await deleteAnnouncement(mockRequest, { announcementId: "ann-1" });

    expect(response.status).toBe(200);
    expect(Announcement.findByIdAndDelete).toHaveBeenCalledWith("ann-1");
    expect(invalidateCache).toHaveBeenCalledWith("announcements:*");
    expect(AuditLogService.record).toHaveBeenCalledOnce();
  });

  it("returns 404 when announcement not found", async () => {
    const response = await deleteAnnouncement(mockRequest, { announcementId: "nonexistent" });
    expect(response.status).toBe(404);
  });
});

describe("togglePinAnnouncement", () => {
  it("pins an unpinned announcement", async () => {
    mockFindByIdResult = makeAnnouncement({ pinned: false });

    const response = await togglePinAnnouncement(mockRequest, { announcementId: "ann-1" });

    expect(response.status).toBe(200);
    expect(Announcement.findByIdAndUpdate).toHaveBeenCalledWith("ann-1", { $set: { pinned: true } });
  });

  it("unpins a pinned announcement", async () => {
    mockFindByIdResult = makeAnnouncement({ pinned: true });

    const response = await togglePinAnnouncement(mockRequest, { announcementId: "ann-1" });

    expect(response.status).toBe(200);
    expect(Announcement.findByIdAndUpdate).toHaveBeenCalledWith("ann-1", { $set: { pinned: false } });
  });
});
