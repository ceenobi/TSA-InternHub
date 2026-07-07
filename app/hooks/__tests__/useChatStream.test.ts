import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useChatStream } from "../useChatStream";

const STORAGE_KEY = "chat:messages";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useChatStream", () => {
  it("starts with empty messages and not pending", () => {
    const { result } = renderHook(() => useChatStream());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("loads persisted messages from localStorage", () => {
    const stored = {
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ],
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useChatStream());
    expect(result.current.messages).toEqual(stored.messages);
  });

  it("discards messages older than 24 hours and returns empty", () => {
    const old = Date.now() - 25 * 60 * 60 * 1000;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        messages: [{ role: "user", content: "Old" }],
        updatedAt: old,
      }),
    );

    const { result } = renderHook(() => useChatStream());
    expect(result.current.messages).toEqual([]);
  });

  it("handles corrupted localStorage data", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");

    const { result } = renderHook(() => useChatStream());
    expect(result.current.messages).toEqual([]);
  });

  it("saves messages to localStorage on change", async () => {
    const { result } = renderHook(() => useChatStream());

    act(() => {
      result.current.setMessages([{ role: "user", content: "New message" }]);
    });

    await waitFor(
      () => {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
        expect(saved.messages).toHaveLength(1);
        expect(saved.messages[0].content).toBe("New message");
      },
      { timeout: 2000 },
    );
  });

  describe("send", () => {
    it("sets error on non-ok response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 503,
          json: vi.fn().mockResolvedValue({ message: "Service unavailable" }),
        }),
      );

      const { result } = renderHook(() => useChatStream());

      await act(async () => {
        await result.current.send([{ role: "user", content: "Hi" }]);
      });

      expect(result.current.error).toBe("Service unavailable");
      expect(result.current.isPending).toBe(false);
      vi.unstubAllGlobals();
    });

    it("handles JSON response (non-stream)", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          headers: new Headers({ "Content-Type": "application/json" }),
          json: vi.fn().mockResolvedValue({
            success: true,
            reply: "Hello!",
          }),
          body: null,
        }),
      );

      const { result } = renderHook(() => useChatStream());

      await act(async () => {
        await result.current.send([{ role: "user", content: "Hi" }]);
      });

      expect(
        result.current.messages[result.current.messages.length - 1].content,
      ).toBe("Hello!");
      vi.unstubAllGlobals();
    });

    it("handles SSE streaming response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          headers: new Headers({ "Content-Type": "text/event-stream" }),
          body: {
            getReader: () => {
              const encoder = new TextEncoder();
              const buffers = [
                encoder.encode('data: {"content":"Hello"}\n\n'),
                encoder.encode('data: {"content":" world"}\n\n'),
                encoder.encode("data: [DONE]\n\n"),
              ];
              let idx = 0;
              return {
                read: () => {
                  if (idx < buffers.length) {
                    return Promise.resolve({ done: false, value: buffers[idx++] });
                  }
                  return Promise.resolve({ done: true, value: undefined });
                },
              };
            },
          },
          json: vi.fn(),
        }),
      );

      const { result } = renderHook(() => useChatStream());

      await act(async () => {
        await result.current.send([{ role: "user", content: "Hi" }]);
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.messages.length).toBeGreaterThanOrEqual(2);
      const last = result.current.messages[result.current.messages.length - 1];
      expect(last.role).toBe("assistant");
      expect(last.content).toBe("Hello world");
      vi.unstubAllGlobals();
    });

    it("removes empty assistant message on abort", async () => {
      const controller = new AbortController();
      const origFetch = globalThis.fetch;

      vi.stubGlobal(
        "fetch",
        vi.fn(
          () =>
            new Promise((_, reject) => {
              const onAbort = () => {
                controller.signal.removeEventListener("abort", onAbort);
                reject(new DOMException("Aborted", "AbortError"));
              };
              controller.signal.addEventListener("abort", onAbort);
            }),
        ),
      );

      const { result } = renderHook(() => useChatStream());
      result.current.setMessages([{ role: "user", content: "Hi" }]);

      const sendPromise = act(async () => {
        await result.current.send([{ role: "user", content: "Hi" }]);
      });

      act(() => {
        controller.abort();
      });

      await sendPromise;

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe("user");
      vi.unstubAllGlobals();
    });
  });
});
