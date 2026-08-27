import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import Drawer from "../nav/drawer";
import type { UserData } from "~/types";

vi.mock("../ui/sheet", () => ({
  Sheet: ({ children }: any) => <div>{children}</div>,
  SheetTrigger: ({ render, children }: any) => <>{render ?? children}</>,
  SheetClose: ({ render, children }: any) => <>{render ?? children}</>,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
}));

const student = { role: "student" } as unknown as UserData;
const admin = { role: "admin" } as unknown as UserData;

afterEach(() => cleanup());

const renderDrawer = (u: UserData) => {
  const router = createMemoryRouter([
    { path: "*", element: <Drawer user={u} /> },
  ]);
  return render(<RouterProvider router={router} />);
};

describe("Drawer", () => {
  it("renders the open trigger button", () => {
    renderDrawer(student);
    expect(
      screen.getByRole("button", { name: /open navigation menu/i }),
    ).toBeInTheDocument();
  });

  it("hides all Tasks links for an unprivileged (student) role", () => {
    renderDrawer(student);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryAllByText("Tasks")).toHaveLength(0);
  });

  it("shows the admin Tasks link for an admin", () => {
    renderDrawer(admin);
    expect(screen.queryAllByText("Tasks")).toHaveLength(1);
  });

  it("shows the user Tasks link for a user role", () => {
    const user = { role: "user" } as unknown as UserData;
    renderDrawer(user);
    expect(screen.queryAllByText("Tasks")).toHaveLength(1);
  });
});
