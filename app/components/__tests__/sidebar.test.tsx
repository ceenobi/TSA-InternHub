import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Sidebar from "../nav/sidebar";
import type { UserData } from "~/types";

vi.mock("../ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <>{children}</>,
}));

const user = { role: "student" } as unknown as UserData;

afterEach(() => cleanup());

const renderSidebar = (isOpenSidebar: boolean, setIsOpenSidebar = vi.fn()) =>
  render(
    <MemoryRouter>
      <Sidebar
        isOpenSidebar={isOpenSidebar}
        setIsOpenSidebar={setIsOpenSidebar}
        user={user}
      />
    </MemoryRouter>,
  );

describe("Sidebar", () => {
  it("shows the footer and section titles when expanded", () => {
    renderSidebar(true);
    expect(screen.getByText(/tsa labs/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /terms/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /collapse sidebar/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
  });

  it("hides the footer and section titles when collapsed", () => {
    renderSidebar(false);
    expect(screen.queryByText(/tsa labs/i)).not.toBeInTheDocument();
    expect(screen.queryByText("General")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /expand sidebar/i }),
    ).toBeInTheDocument();
  });

  it("toggles the sidebar via the toggle button", () => {
    const setIsOpenSidebar = vi.fn();
    renderSidebar(false, setIsOpenSidebar);
    fireEvent.click(
      screen.getByRole("button", { name: /expand sidebar/i }),
    );
    expect(setIsOpenSidebar).toHaveBeenCalledWith(true);
  });
});
