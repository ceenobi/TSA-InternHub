import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFileUpload } from "../useFileUpload";

vi.mock("react-router", () => ({
  useLocation: vi.fn(() => ({ pathname: "/test" })),
}));

const mockToastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (...args: any[]) => mockToastError(...args) },
}));

function createFile(name: string, type: string, sizeMB: number): File {
  return new File([new ArrayBuffer(sizeMB * 1024 * 1024)], name, { type });
}

describe("useFileUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with empty selected files", () => {
    const { result } = renderHook(() => useFileUpload({}));
    expect(result.current.selectedFiles).toEqual([]);
  });

  it("uses default limit of 5 and size of 2MB", () => {
    const { result } = renderHook(() => useFileUpload({}));
    const file = createFile("test.png", "image/png", 1);
    const changeEvent = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFiles(changeEvent);
    });

    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("shows error when file count exceeds limit", () => {
    const { result } = renderHook(() => useFileUpload({ limit: 2 }));
    const files = [
      createFile("a.png", "image/png", 1),
      createFile("b.png", "image/png", 1),
      createFile("c.png", "image/png", 1),
    ];
    const changeEvent = {
      target: { files: files as unknown as FileList },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFiles(changeEvent);
    });

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining("2"),
    );
  });

  it("rejects non-image files", () => {
    const { result } = renderHook(() => useFileUpload({}));
    const file = createFile("doc.pdf", "application/pdf", 1);
    const changeEvent = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFiles(changeEvent);
    });

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining("image"),
    );
    expect(result.current.selectedFiles).toEqual([]);
  });

  it("rejects files exceeding size limit", () => {
    const { result } = renderHook(() => useFileUpload({ size: 1 }));
    const file = createFile("large.png", "image/png", 3);
    const changeEvent = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFiles(changeEvent);
    });

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining("1MB"),
    );
  });

  it("does nothing when files is null", () => {
    const { result } = renderHook(() => useFileUpload({}));
    const changeEvent = {
      target: { files: null },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFiles(changeEvent);
    });

    expect(mockToastError).not.toHaveBeenCalled();
    expect(result.current.selectedFiles).toEqual([]);
  });

  it("clears previous files before adding new ones", () => {
    const { result } = renderHook(() => useFileUpload({}));
    const firstFile = createFile("first.png", "image/png", 1);
    const firstEvent = {
      target: { files: [firstFile] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFiles(firstEvent);
    });

    const { result: result2 } = renderHook(() => useFileUpload({}));
    const secondFile = createFile("second.png", "image/png", 1);
    const secondEvent = {
      target: { files: [secondFile] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result2.current.handleFiles(secondEvent);
    });
  });
});
