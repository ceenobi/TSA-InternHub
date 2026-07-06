// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

type AnyObj = Record<string, any>;

let mockFindByIdResult: AnyObj | null = null;
let mockFindResult: AnyObj[] = [];
let mockCountResult = 0;
let mockAggregateResult: AnyObj[] = [];

function queryBuilder(result: AnyObj | AnyObj[] | null) {
  const q = vi.fn(() => q) as any;
  q.lean = vi.fn(() => Promise.resolve(result));
  q.select = vi.fn(() => q);
  q.populate = vi.fn(() => q);
  q.sort = vi.fn(() => q);
  q.skip = vi.fn(() => q);
  q.limit = vi.fn(() => q);
  q.countDocuments = vi.fn(() => q);
  q.then = vi.fn((resolve: (v: any) => any) => resolve(result));
  return q;
}

vi.mock("~/.server/services/better-auth", () => ({
  auth: {
    api: { getSession: vi.fn() },
  },
}));

vi.mock("~/.server/config/keys", () => ({
  env: { clientUrl: "http://localhost:3700" },
}));

vi.mock("~/.server/config/logger", () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("~/.server/model/ticket", () => ({
  default: {
    create: vi.fn(),
    findById: vi.fn((id: string) => queryBuilder(mockFindByIdResult)),
    find: vi.fn(() => queryBuilder(mockFindResult)),
    findOneAndUpdate: vi.fn(() => queryBuilder(null)),
    countDocuments: vi.fn(() => Promise.resolve(mockCountResult)),
    aggregate: vi.fn(() => Promise.resolve(mockAggregateResult)),
  },
}));

vi.mock("~/.server/model/user", () => ({
  default: {
    findById: vi.fn(() => queryBuilder({ _id: "user-1", name: "John", email: "john@test.com", program: "full-stack", role: "user" })),
    find: vi.fn(() => queryBuilder([])),
  },
}));

vi.mock("~/.server/model/cohort", () => ({
  default: {
    findOne: vi.fn(() => queryBuilder({ _id: "cohort-1", program: "full-stack" })),
    findById: vi.fn(() => queryBuilder({ _id: "cohort-1" })),
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
  fetchWithCache: vi.fn(async (_key: string, _ttl: number, fn: () => any) => fn()),
  invalidateCache: vi.fn(),
}));

vi.mock("~/.server/utils/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("~/.server/workflows/client", () => ({
  workflowClient: { trigger: vi.fn() },
}));

vi.mock("~/.server/integrations/registry", () => ({
  dispatchIntegrationEvent: vi.fn(),
}));

vi.mock("~/lib/utils", () => ({
  generateTicketId: vi.fn(() => "TK-1234-567890"),
}));

import { createTicket, fetchTickets } from "../ticket";
import { auth } from "~/.server/services/better-auth";
import Ticket from "~/.server/model/ticket";
import { checkRateLimit } from "~/.server/utils/rate-limit";

const mockSession = {
  user: { id: "user-1", name: "John", email: "john@test.com", role: "user", program: "full-stack", cohort: "cohort-1" },
  session: { token: "mock-token" },
};

const mockRequest = new Request("http://localhost:3700", {
  headers: { "Content-Type": "application/json" },
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue(null as any);
  vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
  mockFindByIdResult = null;
  mockFindResult = [];
  mockCountResult = 0;
  mockAggregateResult = [];
});

describe("createTicket", () => {
  it("creates a ticket successfully", async () => {
    const mockTicket = {
      _id: "ticket-1",
      ticketId: "TK-1234-567890",
      title: "Cannot log in",
      description: "I am unable to log in. Please help me resolve this issue.",
      category: "account",
      priority: "medium",
      userId: "user-1",
    };
    vi.mocked(Ticket.create).mockResolvedValue(mockTicket as any);
    vi.mocked(Ticket.findById).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    } as any);

    const response = await createTicket(mockRequest, {
      title: "Cannot log in",
      description: "I am unable to log in. Please help me resolve this issue.",
      category: "account",
      priority: "medium",
    });

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe("Ticket created successfully");
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const response = await createTicket(mockRequest, {
      title: "Cannot log in",
      description: "I am unable to log in. Please help me resolve this issue.",
      category: "account",
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid data", async () => {
    const response = await createTicket(mockRequest, {
      title: "Hi",
      description: "Short",
      category: "invalid",
    } as any);

    expect(response.status).toBe(400);
  });
});

describe("fetchTickets", () => {
  it("fetches tickets for user's program", async () => {
    mockFindResult = [
      {
        _id: "ticket-1",
        ticketId: "TK-1234-567890",
        title: "Cannot log in",
        description: "Help",
        category: "account",
        status: "open",
        priority: "low",
        userId: { _id: "user-1", name: "John", email: "john@test.com" },
      },
    ];
    mockCountResult = 1;
    mockAggregateResult = [{
      totalTickets: 1,
      openTickets: 1,
      closedTickets: 0,
      inProgressTickets: 0,
      resolvedTickets: 0,
    }];

    const response = await fetchTickets({
      request: mockRequest,
      page: 1,
      limit: 10,
      query: undefined,
      status: undefined,
      priority: undefined,
      category: undefined,
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.body.meta.total).toBe(1);
    expect(body.body.tickets).toHaveLength(1);
  });

  it("filters tickets by status", async () => {
    mockFindResult = [];
    mockCountResult = 0;
    mockAggregateResult = [];

    const response = await fetchTickets({
      request: mockRequest,
      page: 1,
      limit: 10,
      query: undefined,
      status: "open",
      priority: undefined,
      category: undefined,
    });

    expect(response.status).toBe(200);
  });
});
