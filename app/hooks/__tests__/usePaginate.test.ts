import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import usePaginate from "../usePaginate";

const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams("page=1&limit=10");

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams, vi.fn()],
  useMemo: (fn: () => any) => fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSearchParams = new URLSearchParams("page=1&limit=10");
  Object.defineProperty(window, "location", {
    value: { pathname: "/tasks" },
    writable: true,
  });
});

describe("usePaginate", () => {
  const defaultProps = {
    totalPages: 10,
    hasMore: true,
    currentPage: 1,
  };

  it("returns pagination state from props", () => {
    const { result } = renderHook(() => usePaginate(defaultProps));
    expect(result.current.totalPages).toBe(10);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.currentPage).toBe(1);
  });

  it("reads page and limit from search params", () => {
    mockSearchParams = new URLSearchParams("page=3&limit=25");
    const { result } = renderHook(() => usePaginate(defaultProps));
    expect(result.current.page).toBe(3);
    expect(result.current.limit).toBe(25);
  });

  it("defaults page to 1 and limit to 10 when params are missing", () => {
    mockSearchParams = new URLSearchParams("");
    const { result } = renderHook(() => usePaginate(defaultProps));
    expect(result.current.page).toBe(1);
    expect(result.current.limit).toBe(10);
  });

  it("handlePageChange navigates to first page", () => {
    const { result } = renderHook(() => usePaginate(defaultProps));
    act(() => result.current.handlePageChange("first"));
    expect(mockNavigate).toHaveBeenCalledWith("/tasks?page=1&limit=10");
  });

  it("handlePageChange navigates to last page", () => {
    const { result } = renderHook(() => usePaginate(defaultProps));
    act(() => result.current.handlePageChange("last"));
    expect(mockNavigate).toHaveBeenCalledWith("/tasks?page=10&limit=10");
  });

  it("handlePageChange navigates to prev page from page 5", () => {
    mockSearchParams = new URLSearchParams("page=5&limit=10");
    const { result } = renderHook(() => usePaginate(defaultProps));
    act(() => result.current.handlePageChange("prev"));
    expect(mockNavigate).toHaveBeenCalledWith("/tasks?page=4&limit=10");
  });

  it("handlePageChange does not go below page 1", () => {
    const { result } = renderHook(() => usePaginate(defaultProps));
    act(() => result.current.handlePageChange("prev"));
    expect(mockNavigate).toHaveBeenCalledWith("/tasks?page=1&limit=10");
  });

  it("handlePageChange navigates to next page from page 5", () => {
    mockSearchParams = new URLSearchParams("page=5&limit=10");
    const { result } = renderHook(() => usePaginate(defaultProps));
    act(() => result.current.handlePageChange("next"));
    expect(mockNavigate).toHaveBeenCalledWith("/tasks?page=6&limit=10");
  });

  it("handlePageChange does not exceed total pages", () => {
    mockSearchParams = new URLSearchParams("page=10&limit=10");
    const { result } = renderHook(() => usePaginate(defaultProps));
    act(() => result.current.handlePageChange("next"));
    expect(mockNavigate).toHaveBeenCalledWith("/tasks?page=10&limit=10");
  });

  it("handleLimitChange sets limit and resets to page 1", () => {
    mockSearchParams = new URLSearchParams("page=5&limit=10");
    const { result } = renderHook(() => usePaginate(defaultProps));
    act(() => result.current.handleLimitChange("25"));
    expect(mockNavigate).toHaveBeenCalledWith("/tasks?page=1&limit=25");
  });
});
