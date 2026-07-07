import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import { useChatStream, type Message } from "~/hooks/useChatStream";

const SUGGESTED_QUESTIONS = [
  "How do I update my profile?",
  "What's my current score?",
  "How does grading work?",
  "Can you create a ticket? I can't log in",
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { messages, setMessages, send, isPending, error, abort } = useChatStream();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isPending) return;

    const newMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setInput("");
    send(newMessages);
  }

  function handleSuggested(q: string) {
    if (isPending) return;
    setOpen(true);
    send([{ role: "user", content: q }]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[calc(100vw-2rem)] sm:w-100 h-130 max-h-[70vh] bg-white dark:bg-neutral-900 border rounded-2xl shadow-2xl flex flex-col overflow-hidden origin-bottom-right animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
            <span className="material-symbols-outlined text-mainBlue dark:text-darkBlue text-[24px]">
              smart_toy
            </span>
            <span className="text-sm font-semibold">AI Assistant</span>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <span className="material-symbols-outlined text-[48px] mb-2">
                  chatbot
                </span>
                <p className="text-sm font-medium">Hi! I'm your AI assistant</p>
                <p className="text-xs mt-1">
                  Ask me anything about TSA InternHub
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2 max-w-[85%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "",
                )}
              >
                {msg.role === "assistant" && (
                  <div className="size-7 rounded-full bg-mainBlue/10 dark:bg-darkBlue/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px] text-mainBlue dark:text-darkBlue">
                      smart_toy
                    </span>
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-mainBlue dark:bg-darkBlue text-white rounded-tr-sm"
                      : "bg-muted/50 dark:bg-muted/20 border rounded-tl-sm",
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded-lg [&_pre]:text-xs [&_code]:text-xs">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content || "▊"}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {isPending && messages[messages.length - 1]?.content !== "" && (
              <div className="flex gap-2 max-w-[85%]">
                <div className="size-7 rounded-full bg-mainBlue/10 dark:bg-darkBlue/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[16px] text-mainBlue dark:text-darkBlue">
                    smart_toy
                  </span>
                </div>
                <div className="rounded-2xl px-3.5 py-3 bg-muted/50 dark:bg-muted/20 border rounded-tl-sm">
                  <div className="flex gap-1">
                    <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce" />
                    <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0.15s]" />
                    <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs text-destructive text-center px-4">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length === 0 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggested(q)}
                  className="px-2.5 py-1 text-xs rounded-full border bg-card text-muted-foreground hover:border-mainBlue/30 dark:hover:border-darkBlue/40 hover:text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="border-t p-3 shrink-0">
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                className="min-h-10 resize-none text-sm"
                rows={1}
                disabled={isPending}
              />
              {isPending ? (
                <Button
                  size="icon"
                  onClick={abort}
                  className="shrink-0 bg-destructive hover:bg-destructive/90 text-white mb-0.5"
                >
                  <span className="material-symbols-outlined text-[20px]">stop</span>
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="shrink-0 bg-mainBlue dark:bg-darkBlue hover:bg-mainBlue/90 dark:hover:bg-darkBlue/90 text-white mb-0.5"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <Button
        size="icon-lg"
        onClick={() => setOpen((v) => !v)}
        className="size-14 rounded-full shadow-xl bg-mainBlue dark:bg-darkBlue hover:bg-mainBlue/90 dark:hover:bg-darkBlue/90 text-white"
      >
        <span className={cn(
          "material-symbols-outlined text-[28px] transition-transform duration-200",
          open && "rotate-90",
        )}>
          {open ? "close" : "forum"}
        </span>
      </Button>
    </div>
  );
}
