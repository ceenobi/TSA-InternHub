import { describe, it, expect } from "vitest";
import { canModifyRole } from "../constants";

const superAdminUser = {
  _id: "super-1",
  role: "super_admin" as const,
  name: "Super Admin",
  email: "super@example.com",
  isOnboarded: true,
  emailVerified: true,
};

const adminUser = {
  _id: "admin-1",
  role: "admin" as const,
  name: "Admin User",
  email: "admin@example.com",
  isOnboarded: true,
  emailVerified: true,
};

const regularUser = {
  _id: "user-1",
  role: "user" as const,
  name: "Regular User",
  email: "user@example.com",
  isOnboarded: true,
  emailVerified: true,
};

describe("canModifyRole", () => {
  it("prevents super_admin from modifying themselves", () => {
    expect(
      canModifyRole(superAdminUser, "admin", {
        _id: "super-1",
        role: "super_admin",
      }),
    ).toBe(false);
  });

  it("allows super_admin to modify another super_admin", () => {
    expect(
      canModifyRole(superAdminUser, "admin", {
        _id: "super-2",
        role: "super_admin",
      }),
    ).toBe(true);
  });

  it("allows super_admin to modify an admin", () => {
    expect(canModifyRole(superAdminUser, "user", adminUser)).toBe(true);
  });

  it("allows super_admin to modify a user", () => {
    expect(canModifyRole(superAdminUser, "admin", regularUser)).toBe(true);
  });

  it("prevents admin from modifying a super_admin", () => {
    expect(canModifyRole(adminUser, "admin", superAdminUser)).toBe(false);
  });

  it("allows admin to modify a user", () => {
    expect(canModifyRole(adminUser, "user", regularUser)).toBe(true);
  });

  it("allows admin to modify an admin (different user)", () => {
    expect(
      canModifyRole(adminUser, "user", {
        _id: "admin-2",
        role: "admin",
      }),
    ).toBe(true);
  });

  it("prevents user from modifying anyone", () => {
    expect(canModifyRole(regularUser, "admin", adminUser)).toBe(false);
    expect(canModifyRole(regularUser, "super_admin", superAdminUser)).toBe(false);
  });

  it("prevents admin from promoting a user to super_admin", () => {
    expect(canModifyRole(adminUser, "super_admin", regularUser)).toBe(false);
  });
});
