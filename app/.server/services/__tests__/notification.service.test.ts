// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRedisPublish = vi.fn();
const mockRedis = { publish: mockRedisPublish };

vi.mock("~/.server/config/logger", () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("~/.server/config/redis", () => ({
  default: vi.fn(() => mockRedis),
}));

vi.mock("~/.server/model/notification", () => ({
  default: {
    create: vi.fn(),
    countDocuments: vi.fn(),
    find: vi.fn(),
    updateMany: vi.fn(),
  },
}));

import Notification from "~/.server/model/notification";
import { NotificationService } from "../notification.service";

const mockNotification = {
  _id: "notif-1",
  userId: "user-1",
  type: "submission_graded",
  title: "Test Notification",
  message: "Test message",
  metadata: {},
  read: false,
  createdAt: new Date("2026-01-01"),
  toISOString: function () {
    return this.createdAt.toISOString();
  },
};

function queryBuilder(result: any) {
  const q = vi.fn(() => q) as any;
  q.lean = vi.fn(() => q);
  q.select = vi.fn(() => q);
  q.sort = vi.fn(() => q);
  q.skip = vi.fn(() => q);
  q.limit = vi.fn(() => q);
  q.then = (onfulfilled: any) => Promise.resolve(result).then(onfulfilled);
  q.exec = () => Promise.resolve(result);
  return q;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NotificationService.send", () => {
  const options = {
    userId: "user-1",
    type: "submission_graded" as const,
    title: "Submission Graded",
    message: "Your submission has been graded",
    metadata: { score: 85 },
  };

  it("creates notification in database", async () => {
    vi.mocked(Notification.create).mockResolvedValue(mockNotification as any);

    await NotificationService.send(options);

    expect(Notification.create).toHaveBeenCalledWith({
      userId: "user-1",
      type: "submission_graded",
      title: "Submission Graded",
      message: "Your submission has been graded",
      metadata: { score: 85 },
    });
  });

  it("publishes to Redis when client is available", async () => {
    vi.mocked(Notification.create).mockResolvedValue(mockNotification as any);

    await NotificationService.send(options);

    expect(mockRedisPublish).toHaveBeenCalledWith(
      "notif:user-1",
      expect.stringContaining("submission_graded"),
    );
  });

  it("publishes correct JSON payload to Redis", async () => {
    vi.mocked(Notification.create).mockResolvedValue(mockNotification as any);

    await NotificationService.send(options);

    const callArg = mockRedisPublish.mock.calls[0][1];
    const parsed = JSON.parse(callArg);
    expect(parsed).toMatchObject({
      _id: "notif-1",
      type: "submission_graded",
      title: "Submission Graded",
      message: "Your submission has been graded",
      metadata: { score: 85 },
      read: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("does not publish if Redis client is null", async () => {
    vi.mocked(Notification.create).mockResolvedValue(mockNotification as any);
    const getRedisClient = (await import("~/.server/config/redis")).default;
    vi.mocked(getRedisClient).mockReturnValue(null as any);

    await NotificationService.send(options);

    expect(mockRedisPublish).not.toHaveBeenCalled();
  });

  it("handles Redis publish error gracefully", async () => {
    vi.mocked(Notification.create).mockResolvedValue(mockNotification as any);
    mockRedisPublish.mockRejectedValue(new Error("Redis connection lost"));

    await expect(NotificationService.send(options)).resolves.toBeUndefined();
  });

  it("handles Notification.create error gracefully", async () => {
    vi.mocked(Notification.create).mockRejectedValue(new Error("DB error"));

    await expect(NotificationService.send(options)).resolves.toBeUndefined();
  });

  it("defaults metadata to empty object when not provided", async () => {
    vi.mocked(Notification.create).mockResolvedValue(mockNotification as any);

    await NotificationService.send({
      userId: "user-2",
      type: "announcement",
      title: "Announcement",
      message: "Test",
    });

    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: {} }),
    );
  });
});

describe("NotificationService.getUnreadCount", () => {
  it("returns count from database", async () => {
    vi.mocked(Notification.countDocuments).mockResolvedValue(3);

    const count = await NotificationService.getUnreadCount("user-1");

    expect(count).toBe(3);
    expect(Notification.countDocuments).toHaveBeenCalledWith({
      userId: "user-1",
      read: false,
    });
  });

  it("returns 0 on error", async () => {
    vi.mocked(Notification.countDocuments).mockRejectedValue(new Error("DB error"));

    const count = await NotificationService.getUnreadCount("user-1");

    expect(count).toBe(0);
  });
});

describe("NotificationService.getNotifications", () => {
  const mockNotifs = [
    { _id: "n1", title: "First", type: "submission_graded" },
    { _id: "n2", title: "Second", type: "announcement" },
  ];

  it("returns paginated notifications", async () => {
    vi.mocked(Notification.countDocuments).mockResolvedValue(10);
    vi.mocked(Notification.find).mockReturnValue(queryBuilder(mockNotifs) as any);

    const result = await NotificationService.getNotifications("user-1", 1, 5);

    expect(result.notifications).toEqual(mockNotifs);
    expect(result.meta).toMatchObject({
      currentPage: 1,
      limit: 5,
      total: 10,
      totalPages: 2,
      hasMore: true,
    });
  });

  it("returns hasMore false on last page", async () => {
    const fiveNotifs = Array.from({ length: 5 }, (_, i) => ({
      _id: `n${i}`,
      title: `Notif ${i}`,
      type: "submission_graded",
    }));
    vi.mocked(Notification.countDocuments).mockResolvedValue(5);
    vi.mocked(Notification.find).mockReturnValue(queryBuilder(fiveNotifs) as any);

    const result = await NotificationService.getNotifications("user-1", 1, 5);

    expect(result.meta.hasMore).toBe(false);
  });

  it("uses default page and limit values", async () => {
    vi.mocked(Notification.countDocuments).mockResolvedValue(0);
    vi.mocked(Notification.find).mockReturnValue(queryBuilder([]) as any);

    const result = await NotificationService.getNotifications("user-1");

    expect(result.meta).toMatchObject({ currentPage: 1, limit: 20 });
  });

  it("returns empty result on error", async () => {
    vi.mocked(Notification.countDocuments).mockRejectedValue(new Error("DB error"));

    const result = await NotificationService.getNotifications("user-1");

    expect(result.notifications).toEqual([]);
    expect(result.meta).toMatchObject({ total: 0, totalPages: 0, hasMore: false });
  });
});

describe("NotificationService.markAsRead", () => {
  it("marks all user notifications as read when no id given", async () => {
    await NotificationService.markAsRead("user-1");

    expect(Notification.updateMany).toHaveBeenCalledWith(
      { userId: "user-1" },
      { $set: { read: true } },
    );
  });

  it("marks specific notification as read", async () => {
    await NotificationService.markAsRead("user-1", "notif-1");

    expect(Notification.updateMany).toHaveBeenCalledWith(
      { userId: "user-1", _id: "notif-1" },
      { $set: { read: true } },
    );
  });

  it("handles error gracefully", async () => {
    vi.mocked(Notification.updateMany).mockRejectedValue(new Error("DB error"));

    await expect(
      NotificationService.markAsRead("user-1"),
    ).resolves.toBeUndefined();
  });
});
