import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import Notification from "../nav/notification";
import { useNotifications } from "~/hooks/useNotifications";
import type { NotificationItem } from "~/hooks/useNotifications";

vi.mock("~/hooks/useNotifications", () => ({
  useNotifications: vi.fn(),
}));

vi.mock("../ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ render, children }: any) => (
    <>{render ?? children}</>
  ),
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuGroup: ({ children }: any) => <div>{children}</div>,
}));

const base = () => ({
  unreadCount: 0,
  notifications: [] as any[],
  isLoading: false,
  markAsRead: vi.fn(),
});

const notif = (id: string, title: string, read = false): NotificationItem => ({
  _id: id,
  type: "system",
  title,
  message: "msg",
  metadata: {},
  read,
  createdAt: new Date().toISOString(),
});

beforeEach(() => {
  vi.mocked(useNotifications).mockReturnValue(base());
});

afterEach(() => cleanup());

describe("Notification", () => {
  it("shows the empty state", () => {
    render(<Notification />);
    expect(screen.getByText(/no notifications yet/i)).toBeInTheDocument();
  });

  it("does not show the empty state while loading", () => {
    vi.mocked(useNotifications).mockReturnValue({ ...base(), isLoading: true });
    render(<Notification />);
    expect(
      screen.queryByText(/no notifications yet/i),
    ).not.toBeInTheDocument();
  });

  it("renders notifications and marks all as read", () => {
    const markAsRead = vi.fn();
    vi.mocked(useNotifications).mockReturnValue({
      ...base(),
      unreadCount: 2,
      notifications: [notif("1", "A"), notif("2", "B")],
      markAsRead,
    });
    render(<Notification />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /mark all read/i }),
    );
    expect(markAsRead).toHaveBeenCalledWith(undefined);
  });

  it("marks a single notification as read on click", () => {
    const markAsRead = vi.fn();
    vi.mocked(useNotifications).mockReturnValue({
      ...base(),
      notifications: [notif("1", "A", false)],
      markAsRead,
    });
    render(<Notification />);
    fireEvent.click(screen.getByText("A"));
    expect(markAsRead).toHaveBeenCalledWith("1");
  });

  it("shows an unread count badge", () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...base(),
      unreadCount: 3,
      notifications: [notif("1", "A")],
    });
    render(<Notification />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /mark all read/i }),
    ).toBeInTheDocument();
  });

  it("hides the badge and mark-all when there are no unread", () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...base(),
      unreadCount: 0,
      notifications: [notif("1", "A", false)],
    });
    render(<Notification />);
    expect(screen.queryByText("3")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /mark all read/i }),
    ).toBeNull();
  });
});
