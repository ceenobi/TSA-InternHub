import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "../useMobile";

describe("useIsMobile", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.matchMedia = vi.fn();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("returns true when viewport is below breakpoint", () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 500,
    });

    const { result } = renderHook(() => useIsMobile({ MOBILE_BREAKPOINT: 769 }));
    expect(result.current).toBe(true);
  });

  it("returns false when viewport is above breakpoint", () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile({ MOBILE_BREAKPOINT: 769 }));
    expect(result.current).toBe(false);
  });

  it("registers and cleans up event listener", () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();

    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      addEventListener,
      removeEventListener,
    } as unknown as MediaQueryList);

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1024,
    });

    const { unmount } = renderHook(() => useIsMobile({ MOBILE_BREAKPOINT: 769 }));

    expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
