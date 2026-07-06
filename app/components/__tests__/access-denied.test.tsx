import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@remixicon/react", () => ({
  RiLockFill: () => <svg data-testid="lock-icon" />,
}));

import AccessDenied from "../ui/access-denied";

describe("AccessDenied", () => {
  it("renders the lock icon", () => {
    render(<AccessDenied />);
    expect(screen.getByTestId("lock-icon")).toBeDefined();
  });

  it("renders the permission message", () => {
    render(<AccessDenied />);
    expect(screen.getByText(/do not have permission/i)).toBeDefined();
  });

  it("renders inside a card structure", () => {
    const { container } = render(<AccessDenied />);
    const card = container.querySelector("[data-slot='card']");
    expect(card).toBeDefined();
  });
});
