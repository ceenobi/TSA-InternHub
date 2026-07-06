import { describe, it, expect, vi, afterEach } from "vitest";
import { cn, generateInviteCode, getInitials, generateTicketId } from "../utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves tailwind conflicts", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });

  it("handles undefined values", () => {
    expect(cn("px-4", undefined, "py-2")).toBe("px-4 py-2");
  });
});

describe("generateInviteCode", () => {
  it("starts with INV", () => {
    const code = generateInviteCode();
    expect(code.startsWith("INV")).toBe(true);
  });

  it("has total length of 8", () => {
    const code = generateInviteCode();
    expect(code.length).toBe(8);
  });

  it("generates unique codes", () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateInviteCode()));
    expect(codes.size).toBe(100);
  });
});

describe("getInitials", () => {
  it("returns initials from full name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("handles single name", () => {
    expect(getInitials("John")).toBe("J");
  });

  it("handles triple names", () => {
    expect(getInitials("John Michael Doe")).toBe("JM");
  });

  it("handles empty string", () => {
    expect(getInitials("")).toBe("");
  });

  it("uppercases initials", () => {
    expect(getInitials("john doe")).toBe("JD");
  });

  it("handles names with extra spaces", () => {
    expect(getInitials("  John   Doe  ")).toBe("JD");
  });
});

describe("generateTicketId", () => {
  it("starts with TK-", () => {
    const id = generateTicketId();
    expect(id.startsWith("TK-")).toBe(true);
  });

  it("has the correct format TK-XXXX-XXXXXX", () => {
    const id = generateTicketId();
    const parts = id.split("-");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe("TK");
    expect(parts[1]).toHaveLength(4);
    expect(parts[2]).toHaveLength(6);
  });

  it("generates mostly unique IDs (no more than 2 collisions in 100)", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateTicketId()));
    // Allow up to 2 collisions due to random overlap
    expect(ids.size).toBeGreaterThanOrEqual(98);
  });
});
