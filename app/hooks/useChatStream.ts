import { useCallback, useEffect, useRef, useState } from "react";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

const STORAGE_KEY = "chat:messages";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function loadMessages(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (typeof parsed.updatedAt === "number" && Date.now() - parsed.updatedAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return Array.isArray(parsed.messages) ? parsed.messages : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: Message[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ messages, updatedAt: Date.now() }),
    );
  } catch {
    // storage full or unavailable — silently ignore
  }
}

export function useChatStream() {
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const send = useCallback(async (newMessages: Message[]) => {
    setIsPending(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    setMessages(newMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, stream: true }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Request failed" }));
        setError(errorData.message || `Error ${response.status}`);
        setIsPending(false);
        return;
      }

      const contentType = response.headers.get("Content-Type") || "";
      if (!contentType.includes("text/event-stream")) {
        const data = await response.json();
        if (data.success && data.reply) {
          setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        } else {
          setError(data.message || "Unexpected response");
        }
        setIsPending(false);
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const events = text.split("\n").filter((l) => l.startsWith("data: "));

        for (const event of events) {
          try {
            const data = JSON.parse(event.slice(6));
            if (data.content) {
              accumulated += data.content;
              setMessages((prev) => [
                ...prev.slice(0, -1),
                { role: "assistant", content: accumulated },
              ]);
            }
          } catch {
            // skip malformed events
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && !last.content) {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } else {
        setError(err.message || "Connection failed");
      }
    }

    setIsPending(false);
    abortRef.current = null;
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const submitFeedback = useCallback(
    async (rating: 1 | -1, message: string, response: string, topics?: string[]) => {
      try {
        await fetch("/api/chat/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, message, response, topics }),
        });
      } catch {
        // silently ignore — feedback is non-critical
      }
    },
    [],
  );

  return { messages, setMessages, send, isPending, error, abort, submitFeedback };
}
