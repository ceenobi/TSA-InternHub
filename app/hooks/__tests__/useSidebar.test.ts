import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("~/lib/storage", () => ({
  safeGetItem: vi.fn(),
  safeSetItem: vi.fn(),
}));

import useSidebar from "../useSidebar";
import { safeGetItem, safeSetItem } from "~/lib/storage";

describe("useSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with sidebar closed by default", () => {
    vi.mocked(safeGetItem).mockReturnValue(null);

    const { result } = renderHook(() => useSidebar());

    expect(result.current.isOpenSidebar).toBe(false);
  });

  it("restores saved state from storage", () => {
    vi.mocked(safeGetItem).mockReturnValue("true");

    const { result } = renderHook(() => useSidebar());

    expect(result.current.isOpenSidebar).toBe(true);
  });

  it("persists state changes to storage", () => {
    vi.mocked(safeGetItem).mockReturnValue(null);

    const { result } = renderHook(() => useSidebar());

    act(() => {
      result.current.setIsOpenSidebar(true);
    });

    expect(safeSetItem).toHaveBeenCalledWith("sbarTsaInterHub", "true");
  });

  it("allows closing the sidebar", () => {
    vi.mocked(safeGetItem).mockReturnValue("true");

    const { result } = renderHook(() => useSidebar());

    act(() => {
      result.current.setIsOpenSidebar(false);
    });

    expect(safeSetItem).toHaveBeenCalledWith("sbarTsaInterHub", "false");
  });
});
