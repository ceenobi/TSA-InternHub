import { describe, it, expect } from "vitest";
import { hasPermission, hasRole } from "../rbac";

describe("hasPermission", () => {
  it("returns false when userRole is undefined", () => {
    expect(hasPermission(undefined, "MANAGE_MEMBERS")).toBe(false);
  });

  it("returns false when userRole is empty string", () => {
    expect(hasPermission("", "MANAGE_MEMBERS")).toBe(false);
  });

  it("allows admin to MANAGE_MEMBERS", () => {
    expect(hasPermission("admin", "MANAGE_MEMBERS")).toBe(true);
  });

  it("allows super_admin to MANAGE_MEMBERS", () => {
    expect(hasPermission("super_admin", "MANAGE_MEMBERS")).toBe(true);
  });

  it("denies user from MANAGE_MEMBERS", () => {
    expect(hasPermission("user", "MANAGE_MEMBERS")).toBe(false);
  });

  it("allows super_admin to MANAGE_SESSIONS", () => {
    expect(hasPermission("super_admin", "MANAGE_SESSIONS")).toBe(true);
  });

  it("denies admin from MANAGE_SESSIONS", () => {
    expect(hasPermission("admin", "MANAGE_SESSIONS")).toBe(false);
  });

  it("allows user to MANAGE_TASK", () => {
    expect(hasPermission("user", "MANAGE_TASK")).toBe(true);
  });

  it("allows user to CREATE_TICKET", () => {
    expect(hasPermission("user", "CREATE_TICKET")).toBe(true);
  });

  it("denies user from MANAGE_TICKETS", () => {
    expect(hasPermission("user", "MANAGE_TICKETS")).toBe(false);
  });

  it("allows admin and super_admin to MANAGE_TICKETS", () => {
    expect(hasPermission("admin", "MANAGE_TICKETS")).toBe(true);
    expect(hasPermission("super_admin", "MANAGE_TICKETS")).toBe(true);
  });

  it("allows all roles to VIEW_HUB", () => {
    expect(hasPermission("user", "VIEW_HUB")).toBe(true);
    expect(hasPermission("admin", "VIEW_HUB")).toBe(true);
    expect(hasPermission("super_admin", "VIEW_HUB")).toBe(true);
  });

  it("denies unknown role", () => {
    expect(hasPermission("guest", "MANAGE_MEMBERS")).toBe(false);
  });
});

describe("hasRole", () => {
  it("returns false when userRole is undefined", () => {
    expect(hasRole(undefined, ["user", "admin"])).toBe(false);
  });

  it("returns true when role matches", () => {
    expect(hasRole("admin", ["admin", "super_admin"])).toBe(true);
  });

  it("returns false when role does not match", () => {
    expect(hasRole("user", ["admin", "super_admin"])).toBe(false);
  });

  it("returns true for single role match", () => {
    expect(hasRole("super_admin", ["super_admin"])).toBe(true);
  });
});
