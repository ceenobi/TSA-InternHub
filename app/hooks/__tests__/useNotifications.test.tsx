import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { useNotifications } from "../useNotifications";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns default unread count of 0 when fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(0);
    });
  });

  it("fetches unread count from API", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ count: 5 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ notifications: [], meta: {} }) });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(5);
    });
  });

  it("fetches notifications list from API", async () => {
    const mockNotifications = [
      { _id: "n1", type: "info", title: "Test", message: "Hello", metadata: {}, read: false, createdAt: "2025-01-01" },
    ];

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ count: 1 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ notifications: mockNotifications, meta: { total: 1 } }) });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].title).toBe("Test");
    });
  });

  it("returns typed notification data", async () => {
    const mockNotifications = [
      { _id: "n1", type: "announcement", title: "Welcome", message: "New announcement", metadata: { announcementId: "a1" }, read: false, createdAt: "2025-01-01" },
    ];

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ count: 1 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ notifications: mockNotifications, meta: {} }) });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.notifications[0].type).toBe("announcement");
      expect(result.current.notifications[0].metadata.announcementId).toBe("a1");
    });
  });
});
