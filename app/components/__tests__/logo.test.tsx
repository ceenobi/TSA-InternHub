import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

vi.mock("@remixicon/react", () => ({
  RiUserCommunityFill: () => <svg data-testid="mock-icon" />,
}));

import Logo from "../ui/logo";

describe("Logo", () => {
  it("renders a link to home", () => {
    render(
      <MemoryRouter>
        <Logo />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/");
  });

  it("shows icon by default", () => {
    render(
      <MemoryRouter>
        <Logo />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("mock-icon")).toBeDefined();
  });

  it("hides text when showLogoText is false", () => {
    render(
      <MemoryRouter>
        <Logo />
      </MemoryRouter>,
    );

    expect(screen.queryByText("TSA Intern Hub")).toBeNull();
  });

  it("shows text when showLogoText is true", () => {
    render(
      <MemoryRouter>
        <Logo showLogoText />
      </MemoryRouter>,
    );

    expect(screen.getByText("TSA Intern Hub")).toBeDefined();
  });
});
