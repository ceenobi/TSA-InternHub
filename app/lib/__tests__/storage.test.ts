import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

import { safeGetItem, safeSetItem, safeRemoveItem } from "../storage";

describe("safeGetItem", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("returns stored value when key exists", () => {
    localStorageMock.setItem("test-key", "test-value");
    expect(safeGetItem("test-key")).toBe("test-value");
  });

  it("returns null when key does not exist", () => {
    expect(safeGetItem("nonexistent")).toBeNull();
  });

  it("returns null on localStorage error", () => {
    localStorageMock.getItem.mockImplementationOnce(() => { throw new Error("access denied"); });
    expect(safeGetItem("fail-key")).toBeNull();
  });
});

describe("safeSetItem", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("sets a value and returns true", () => {
    const result = safeSetItem("test-key", "test-value");
    expect(result).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith("test-key", "test-value");
  });

  it("returns false on localStorage error", () => {
    localStorageMock.setItem.mockImplementationOnce(() => { throw new Error("full"); });
    const result = safeSetItem("fail-key", "value");
    expect(result).toBe(false);
  });
});

describe("safeRemoveItem", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("removes a value and returns true", () => {
    localStorageMock.setItem("test-key", "test-value");
    const result = safeRemoveItem("test-key");
    expect(result).toBe(true);
    expect(safeGetItem("test-key")).toBeNull();
  });

  it("returns false on localStorage error", () => {
    localStorageMock.removeItem.mockImplementationOnce(() => { throw new Error("denied"); });
    const result = safeRemoveItem("fail-key");
    expect(result).toBe(false);
  });
});
