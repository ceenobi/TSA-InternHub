import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Chatbot from "../chatbot";
import { useChatStream } from "~/hooks/useChatStream";
import type { Message } from "~/hooks/useChatStream";

vi.mock("~/hooks/useChatStream", () => ({
  useChatStream: vi.fn(),
}));

const baseReturn = () => ({
  messages: [] as any[],
  setMessages: vi.fn(),
  send: vi.fn(),
  isPending: false,
  error: null,
  abort: vi.fn(),
  submitFeedback: vi.fn(),
});

beforeEach(() => {
  vi.mocked(useChatStream).mockReturnValue(baseReturn());
  // jsdom does not implement scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => cleanup());

describe("Chatbot", () => {
  it("renders a closed launcher by default", () => {
    render(<Chatbot />);
    expect(
      screen.getByRole("button", { name: /open chat assistant/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/hi! i'm your ai assistant/i),
    ).not.toBeInTheDocument();
  });

  it("opens the panel and shows suggested questions", async () => {
    const user = userEvent.setup();
    render(<Chatbot />);
    await user.click(
      screen.getByRole("button", { name: /open chat assistant/i }),
    );
    expect(
      screen.getByText(/hi! i'm your ai assistant/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /how do i update my profile\?/i,
      }),
    ).toBeInTheDocument();
  });

  it("keeps send disabled while input is empty and enables after typing", async () => {
    const user = userEvent.setup();
    render(<Chatbot />);
    await user.click(
      screen.getByRole("button", { name: /open chat assistant/i }),
    );
    const send = screen.getByRole("button", { name: /send message/i });
    expect(send).toBeDisabled();
    await user.type(screen.getByPlaceholderText(/ask anything/i), "Hello");
    expect(send).not.toBeDisabled();
  });

  it("sends the typed message on submit", async () => {
    const user = userEvent.setup();
    const chat = baseReturn();
    vi.mocked(useChatStream).mockReturnValue(chat);
    render(<Chatbot />);
    await user.click(
      screen.getByRole("button", { name: /open chat assistant/i }),
    );
    await user.type(
      screen.getByPlaceholderText(/ask anything/i),
      "Hello there",
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));
    expect(chat.send).toHaveBeenCalledWith([
      { role: "user", content: "Hello there" },
    ]);
  });

  it("sends a suggested question", async () => {
    const user = userEvent.setup();
    const chat = baseReturn();
    vi.mocked(useChatStream).mockReturnValue(chat);
    render(<Chatbot />);
    await user.click(
      screen.getByRole("button", { name: /open chat assistant/i }),
    );
    await user.click(
      screen.getByRole("button", {
        name: /how do i update my profile\?/i,
      }),
    );
    expect(chat.send).toHaveBeenCalledWith([
      { role: "user", content: "How do I update my profile?" },
    ]);
  });

  it("shows a stop button and aborts while pending", async () => {
    const user = userEvent.setup();
    const chat = { ...baseReturn(), isPending: true };
    vi.mocked(useChatStream).mockReturnValue(chat);
    render(<Chatbot />);
    await user.click(
      screen.getByRole("button", { name: /open chat assistant/i }),
    );
    const stop = screen.getByRole("button", { name: /stop generating/i });
    expect(stop).toBeInTheDocument();
    await user.click(stop);
    expect(chat.abort).toHaveBeenCalled();
  });

  it("displays errors", () => {
    vi.mocked(useChatStream).mockReturnValue({
      ...baseReturn(),
      error: "Something went wrong",
    });
    render(<Chatbot />);
    fireEvent.click(
      screen.getByRole("button", { name: /open chat assistant/i }),
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("submits feedback for an assistant message", async () => {
    const user = userEvent.setup();
    const messages: Message[] = [
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
    ];
    const chat = { ...baseReturn(), messages };
    vi.mocked(useChatStream).mockReturnValue(chat);
    render(<Chatbot />);
    await user.click(
      screen.getByRole("button", { name: /open chat assistant/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /rate as helpful/i }),
    );
    expect(chat.submitFeedback).toHaveBeenCalledWith(1, "hi", "hello");
  });

  it("clears history via the clear button", async () => {
    const user = userEvent.setup();
    const messages: Message[] = [{ role: "user", content: "hi" }];
    const chat = { ...baseReturn(), messages };
    vi.mocked(useChatStream).mockReturnValue(chat);
    render(<Chatbot />);
    await user.click(
      screen.getByRole("button", { name: /open chat assistant/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /clear chat history/i }),
    );
    expect(chat.setMessages).toHaveBeenCalledWith([]);
  });
});
