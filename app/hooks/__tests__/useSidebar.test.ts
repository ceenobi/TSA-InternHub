import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import useSidebar from "../useSidebar";

function setDocumentCookie(value: string) {
  Object.defineProperty(document, "cookie", {
    writable: true,
    value,
  });
}

describe("useSidebar", () => {
  beforeEach(() => {
    setDocumentCookie("");
  });

  it("initializes with sidebar closed by default", () => {
    const { result } = renderHook(() => useSidebar());

    expect(result.current.isOpenSidebar).toBe(false);
  });

  it("restores saved state from cookie", () => {
    setDocumentCookie("sbarTsaInterHub=true");

    const { result } = renderHook(() => useSidebar());

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
    setDocumentCookie("sbarTsaInterHub=true");

    const { result } = renderHook(() => useSidebar());

    act(() => {
      result.current.setIsOpenSidebar(false);
    });

    expect(document.cookie).toContain("sbarTsaInterHub=false");
  });
});
