// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAuthApi, mockInvalidateCache } = vi.hoisted(() => ({
  mockAuthApi: {
    getSession: vi.fn(),
  },
  mockInvalidateCache: vi.fn(),
}));

vi.mock("~/.server/services/better-auth", () => ({
  auth: { api: mockAuthApi },
}));

vi.mock("~/.server/config/keys", () => ({
  env: { clientUrl: "http://localhost:3700", openCodeZenApiKey: "test-key" },
}));

vi.mock("~/.server/config/logger", () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("~/.server/utils/cache", () => ({
  invalidateCache: mockInvalidateCache,
  fetchWithCache: vi.fn(),
}));

vi.mock("~/.server/model/ticket", () => ({
  default: { create: vi.fn() },
}));

vi.mock("~/.server/services/auditlog.service", () => ({
  AuditLogService: { record: vi.fn() },
}));

vi.mock("~/.server/workflows/client", () => ({
  workflowClient: { trigger: vi.fn() },
}));

vi.mock("~/.server/services/notification.service", () => ({
  NotificationService: { send: vi.fn() },
}));

const mockTaskStatsResponse = vi.fn();
vi.mock("~/.server/action/task", () => ({
  getTaskStatsForUser: (...args: any[]) => mockTaskStatsResponse(...args),
}));

import {
  handleChat,
  handleTicketChat,
  handleChatStream,
} from "../chat.server";

const mockSession = {
  user: {
    id: "user-1",
    name: "John Doe",
    email: "john@example.com",
    role: "intern",
    program: "full-stack",
  },
  session: { token: "mock-token" },
};

const mockRequest = new Request("http://localhost:3700", {
  headers: { "Content-Type": "application/json" },
});

const basicMessages = [{ role: "user" as const, content: "hello" }];

function mockFetchResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    body: null,
    headers: new Headers(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(mockAuthApi.getSession).mockResolvedValue(mockSession as any);
});

describe("handleChat", () => {
  async function exec(...args: Parameters<typeof handleChat>) {
    return (await handleChat(...args)) as Response;
  }

  it("allows unauthenticated users (guest mode)", async () => {
    vi.mocked(mockAuthApi.getSession).mockResolvedValue(null);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      mockFetchResponse({
        choices: [{ message: { content: "Welcome! I can help with general questions." } }],
      }),
    ));

    const response = await exec(mockRequest, basicMessages);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.reply).toContain("general");

    vi.unstubAllGlobals();
  });

  it("returns reply on successful Zen API call", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      mockFetchResponse({
        choices: [{ message: { content: "Hello! How can I help?" } }],
      }),
    ));

    const response = await exec(mockRequest, basicMessages);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.reply).toBe("Hello! How can I help?");

    vi.unstubAllGlobals();
  });

  it("returns 502 on Zen API error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      mockFetchResponse({}, 503),
    ));

    const response = await exec(mockRequest, basicMessages);
    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data.success).toBe(false);

    vi.unstubAllGlobals();
  });

  it("returns 500 on unexpected error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const response = await exec(mockRequest, basicMessages);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);

    vi.unstubAllGlobals();
  });

  it("includes score context when query needs it", async () => {
    const scoreMessages = [{ role: "user" as const, content: "what is my score" }];
    mockTaskStatsResponse.mockResolvedValue(
      new Response(JSON.stringify({
        success: true,
        body: {
          summary: { tasksCompleted: 5, totalTasks: 10, averageScore: 72, onTimeRate: 80, stageProgress: 50 },
          stageBreakdown: [{ order: 1, stageTitle: "HTML", percentage: 85, passPercentage: 70, passed: true, status: "completed" }],
          submissionSummary: [{ name: "Submitted", value: 5 }],
        },
      })),
    );

    let capturedBody: string | undefined;
    vi.stubGlobal("fetch", vi.fn(async (_url: string, opts: any) => {
      capturedBody = opts.body;
      return mockFetchResponse({
        choices: [{ message: { content: "Here are your scores" } }],
      });
    }));

    const response = await exec(mockRequest, scoreMessages);
    expect(response.status).toBe(200);
    expect(capturedBody).toBeDefined();
    const parsed = JSON.parse(capturedBody!);
    expect(parsed.messages[0].content).toContain("Current Performance");
    expect(parsed.messages[0].content).toContain("Average score");

    vi.unstubAllGlobals();
  });
});

describe("handleChatStream", () => {
  async function exec(...args: Parameters<typeof handleChatStream>) {
    return (await handleChatStream(...args)) as Response;
  }

  it("allows unauthenticated users (guest mode)", async () => {
    vi.mocked(mockAuthApi.getSession).mockResolvedValue(null);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode("data: {\"choices\":[{\"delta\":{\"content\":\"Hello guest\"}}]}\n\n"));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, status: 200, body: stream, headers: new Headers(),
    }));

    const response = await exec(mockRequest, basicMessages);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");

    vi.unstubAllGlobals();
  });

  it("returns SSE response on success", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode("data: {\"choices\":[{\"delta\":{\"content\":\"Hello\"}}]}\n\n"));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: stream,
      headers: new Headers(),
    }));

    const response = await exec(mockRequest, basicMessages);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const chunks: string[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(decoder.decode(value, { stream: true }));
    }
    expect(chunks.join("")).toContain("Hello");

    vi.unstubAllGlobals();
  });

  it("returns 502 on Zen API error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      mockFetchResponse({}, 503),
    ));

    const response = await exec(mockRequest, basicMessages);
    expect(response.status).toBe(502);

    vi.unstubAllGlobals();
  });
});

describe("handleTicketChat", () => {
  async function exec(...args: Parameters<typeof handleTicketChat>) {
    return (await handleTicketChat(...args)) as Response;
  }

  const ticketMessages = [
    { role: "user" as const, content: "I can't log into my account" },
  ];

  it("returns 502 on Zen API error (guest)", async () => {
    vi.mocked(mockAuthApi.getSession).mockResolvedValue(null);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      mockFetchResponse({}, 503),
    ));
    const response = await exec(mockRequest, ticketMessages);
    expect(response.status).toBe(502);
    vi.unstubAllGlobals();
  });

  it("creates ticket when Zen API returns a tool call", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      mockFetchResponse({
        choices: [{
          message: {
            tool_calls: [{
              id: "call-1",
              function: {
                name: "create_ticket",
                arguments: JSON.stringify({
                  title: "Login issue",
                  description: "I cannot log into my account for 2 days now",
                  category: "account",
                  priority: "high",
                }),
              },
            }],
          },
        }],
      }),
    ));

    const Ticket = (await import("~/.server/model/ticket")).default;
    vi.mocked(Ticket.create).mockResolvedValue({
      ticketId: "TKT-123",
      title: "Login issue",
    } as any);

    const response = await exec(mockRequest, ticketMessages);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ticketCreated).toBe(true);
    expect(data.ticketId).toBe("TKT-123");

    vi.unstubAllGlobals();
  });

  it("returns plain reply when Zen API returns no tool call", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      mockFetchResponse({
        choices: [{
          message: { content: "Let me help you with that. Try resetting your password." },
        }],
      }),
    ));

    const response = await exec(mockRequest, ticketMessages);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.reply).toContain("reset");

    vi.unstubAllGlobals();
  });

  it("returns 502 on Zen API error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      mockFetchResponse({}, 503),
    ));

    const response = await exec(mockRequest, ticketMessages);
    expect(response.status).toBe(502);

    vi.unstubAllGlobals();
  });
});
