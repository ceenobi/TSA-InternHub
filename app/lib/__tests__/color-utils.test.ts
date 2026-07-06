import { describe, it, expect } from "vitest";
import {
  cohortStatusColor,
  getProjectStatusColor,
  getProgressColor,
  getTicketStatusColor,
} from "../constants";

describe("cohortStatusColor", () => {
  it("returns green styles for active status", () => {
    const result = cohortStatusColor("active");
    expect(result).toContain("green");
    expect(result).toContain("border-green-600");
  });

  it("returns red styles for inactive status", () => {
    const result = cohortStatusColor("inactive");
    expect(result).toContain("red");
    expect(result).toContain("border-red-600");
  });

  it("returns muted styles for unknown status", () => {
    const result = cohortStatusColor("pending" as "active");
    expect(result).toContain("muted");
  });
});

describe("getProjectStatusColor", () => {
  it("returns blue styles for upcoming status", () => {
    const result = getProjectStatusColor("upcoming");
    expect(result).toContain("blue");
  });

  it("returns green styles for completed status", () => {
    const result = getProjectStatusColor("completed");
    expect(result).toContain("green");
  });

  it("returns yellow styles for active status", () => {
    const result = getProjectStatusColor("active");
    expect(result).toContain("yellow");
  });

  it("returns gray styles for on-hold status", () => {
    const result = getProjectStatusColor("on-hold");
    expect(result).toContain("gray");
  });

  it("returns muted styles for unknown status", () => {
    const result = getProjectStatusColor("unknown" as "upcoming");
    expect(result).toContain("muted");
  });
});

describe("getProgressColor", () => {
  it("returns blue for 0 progress", () => {
    expect(getProgressColor(0)).toBe("bg-blue-500");
  });

  it("returns yellow for 25 progress", () => {
    expect(getProgressColor(25)).toBe("bg-yellow-500");
  });

  it("returns amber for 50 progress", () => {
    expect(getProgressColor(50)).toBe("bg-amber-500");
  });

  it("returns orange for 75 progress", () => {
    expect(getProgressColor(75)).toBe("bg-orange-500");
  });

  it("returns green for 100 progress", () => {
    expect(getProgressColor(100)).toBe("bg-green-500");
  });

  it("returns gray for unknown progress", () => {
    expect(getProgressColor(33)).toBe("bg-gray-500");
  });
});

describe("getTicketStatusColor", () => {
  it("returns blue styles for open status", () => {
    const result = getTicketStatusColor("open");
    expect(result).toContain("blue");
  });

  it("returns yellow styles for in-progress status", () => {
    const result = getTicketStatusColor("in-progress");
    expect(result).toContain("yellow");
  });

  it("returns green styles for resolved status", () => {
    const result = getTicketStatusColor("resolved");
    expect(result).toContain("green");
  });

  it("returns gray styles for closed status", () => {
    const result = getTicketStatusColor("closed");
    expect(result).toContain("gray");
  });

  it("returns gray styles for unknown status", () => {
    const result = getTicketStatusColor("unknown");
    expect(result).toContain("gray");
  });
});
