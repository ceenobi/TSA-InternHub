import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

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

  it("shows the logo image by default", () => {
    render(
      <MemoryRouter>
        <Logo />
      </MemoryRouter>,
    );

    expect(screen.getByRole("img", { name: "Logo" })).toBeDefined();
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
