import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import useSidebar from "../useSidebar";

describe("useSidebar", () => {
  beforeEach(() => {
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "",
    });
  });

  it("initializes with sidebar closed by default", () => {
    const { result } = renderHook(() => useSidebar());

    expect(result.current.isOpenSidebar).toBe(false);
  });

  it("accepts initial open state from loader", () => {
    const { result } = renderHook(() => useSidebar(true));

    expect(result.current.isOpenSidebar).toBe(true);
  });

  it("persists state changes to cookie", () => {
    const { result } = renderHook(() => useSidebar());

    act(() => {
      result.current.setIsOpenSidebar(true);
    });

    expect(document.cookie).toContain("sbarTsaInterHub=true");
  });

  it("allows closing the sidebar", () => {
    const { result } = renderHook(() => useSidebar(true));

    act(() => {
      result.current.setIsOpenSidebar(false);
    });

    expect(document.cookie).toContain("sbarTsaInterHub=false");
  });

  it("toggles sidebar state", () => {
    const { result } = renderHook(() => useSidebar(true));

    act(() => {
      result.current.setIsOpenSidebar(false);
    });

    expect(result.current.isOpenSidebar).toBe(false);

    act(() => {
      result.current.setIsOpenSidebar(true);
    });

    expect(result.current.isOpenSidebar).toBe(true);
  });
});
