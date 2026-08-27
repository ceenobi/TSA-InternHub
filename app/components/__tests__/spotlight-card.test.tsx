import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import SpotlightCard from "../ui/spotlight-card";

afterEach(() => cleanup());

const root = (c: HTMLElement) => c.firstChild as HTMLElement;
const spotlight = (c: HTMLElement) =>
  (c.firstChild as HTMLElement).firstElementChild as HTMLElement;

describe("SpotlightCard", () => {
  it("renders its children", () => {
    render(<SpotlightCard>Hello</SpotlightCard>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("increases opacity on mouse enter", () => {
    const { container } = render(<SpotlightCard>Hi</SpotlightCard>);
    expect(spotlight(container).style.opacity).toBe("0");
    fireEvent.mouseOver(root(container));
    expect(spotlight(container).style.opacity).toBe("0.6");
  });

  it("resets opacity on mouse leave", () => {
    const { container } = render(<SpotlightCard>Hi</SpotlightCard>);
    fireEvent.mouseOver(root(container));
    fireEvent.mouseOut(root(container));
    expect(spotlight(container).style.opacity).toBe("0");
  });

  it("updates the spotlight position on mouse move", () => {
    const { container } = render(<SpotlightCard>Hi</SpotlightCard>);
    fireEvent.mouseOver(root(container));
    fireEvent.mouseMove(root(container), { clientX: 10, clientY: 20 });
    expect(spotlight(container).style.background).toContain("10px 20px");
  });
});
