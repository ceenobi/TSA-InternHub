import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@remixicon/react", () => ({
  RiLoaderLine: ({ className }: { className?: string }) => (
    <svg data-testid="loader-icon" className={className} />
  ),
}));

import ActionButton from "../ui/action-button";

describe("ActionButton", () => {
  it("renders with text", () => {
    render(<ActionButton text="Submit" />);
    expect(screen.getByRole("button", { name: /submit/i })).toBeDefined();
  });

  it("shows loader when loading", () => {
    render(<ActionButton text="Saving" loading />);
    expect(screen.getByTestId("loader-icon")).toBeDefined();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("disables button when disabled prop is true", () => {
    render(<ActionButton text="Disabled" disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    render(<ActionButton text="Click" onClick={handleClick} />);
    await userEvent.click(screen.getByRole("button", { name: /click/i }));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when loading", async () => {
    const handleClick = vi.fn();
    render(<ActionButton text="Loading" loading onClick={handleClick} />);
    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies custom classname", () => {
    render(<ActionButton text="Styled" classname="my-class" />);
    expect(screen.getByRole("button").className).toContain("my-class");
  });

  it("renders as submit type", () => {
    render(<ActionButton text="Send" type="submit" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
