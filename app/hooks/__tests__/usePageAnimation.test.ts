import { describe, it, expect } from "vitest";
import { useWaveAnimation } from "../usePageAnimation";
import { renderHook } from "@testing-library/react";

vi.stubGlobal("IntersectionObserver", vi.fn(function MockIntersectionObserver() {
  this.observe = vi.fn();
  this.disconnect = vi.fn();
  this.unobserve = vi.fn();
}));

describe("useWaveAnimation", () => {
  it("returns default visibility as false", () => {
    const { result } = renderHook(() => useWaveAnimation());

    expect(result.current.isVisible).toBe(false);
  });

  it("returns containerRef", () => {
    const { result } = renderHook(() => useWaveAnimation());

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.containerRef.current).toBeNull();
  });

  describe("getItemStyle", () => {
    it("returns correct transition delay for index 0", () => {
      const { result } = renderHook(() => useWaveAnimation());
      const style = result.current.getItemStyle(0);

      expect(style.transitionDelay).toBe("0ms");
    });

    it("returns staggered delay for index 2", () => {
      const { result } = renderHook(() => useWaveAnimation({ staggerDelay: 100 }));
      const style = result.current.getItemStyle(2);

      expect(style.transitionDelay).toBe("200ms");
    });

    it("uses custom duration", () => {
      const { result } = renderHook(() => useWaveAnimation({ duration: 1000 }));
      const style = result.current.getItemStyle(0);

      expect(style.transitionDuration).toBe("1000ms");
    });
  });

  describe("getItemClassName", () => {
    it("adds invisible classes when not visible", () => {
      const { result } = renderHook(() => useWaveAnimation());
      const classes = result.current.getItemClassName("base-class");

      expect(classes).toContain("base-class");
      expect(classes).toContain("opacity-0");
      expect(classes).toContain("translate-y-8");
      expect(classes).toContain("scale-95");
      expect(classes).not.toContain("opacity-100");
    });

    it("returns empty base when no classes provided", () => {
      const { result } = renderHook(() => useWaveAnimation());
      const classes = result.current.getItemClassName();

      expect(classes).toContain("opacity-0");
    });
  });
});
