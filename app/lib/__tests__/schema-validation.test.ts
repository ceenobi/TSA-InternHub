import { describe, it, expect } from "vitest";
import {
  signUpSchema,
  signInSchema,
  projectSchema,
  createTicketSchema,
  cohortSchema,
  stageSchema,
  taskSchema,
  updateProfileSchema,
  createAnnouncementSchema,
  hubTaskSchema,
} from "../schemaValidation";

describe("signUpSchema", () => {
  it("accepts valid sign-up data", () => {
    const result = signUpSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "Password1!",
      inviteCode: "ABC123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short name", () => {
    const result = signUpSchema.safeParse({
      name: "Jo",
      email: "john@example.com",
      password: "Password1!",
      inviteCode: "ABC123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  it("rejects invalid email", () => {
    const result = signUpSchema.safeParse({
      name: "John Doe",
      email: "not-an-email",
      password: "Password1!",
      inviteCode: "ABC123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak password (no uppercase)", () => {
    const result = signUpSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "password1!",
      inviteCode: "ABC123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak password (no special char)", () => {
    const result = signUpSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "Password1",
      inviteCode: "ABC123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak password (no number)", () => {
    const result = signUpSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "Password!",
      inviteCode: "ABC123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invite code over 8 chars", () => {
    const result = signUpSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "Password1!",
      inviteCode: "ABCDEFGHI",
    });
    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("accepts valid sign-in data", () => {
    const result = signInSchema.safeParse({
      email: "john@example.com",
      password: "Password1!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing password", () => {
    const result = signInSchema.safeParse({
      email: "john@example.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("projectSchema", () => {
  const validProject = {
    title: "My Awesome Project",
    description: "A detailed description of the project that is at least 10 characters long.",
    cohortId: "cohort123",
    startDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    endDate: new Date(Date.now() + 86400000 * 30).toISOString().split("T")[0],
  };

  it("accepts valid project data", () => {
    const result = projectSchema.safeParse(validProject);
    expect(result.success).toBe(true);
  });

  it("rejects short title", () => {
    const result = projectSchema.safeParse({
      ...validProject,
      title: "AB",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short description", () => {
    const result = projectSchema.safeParse({
      ...validProject,
      description: "Short",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional status field", () => {
    const result = projectSchema.safeParse({
      ...validProject,
      status: "active",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = projectSchema.safeParse({
      ...validProject,
      status: "invalid-status",
    });
    expect(result.success).toBe(false);
  });

  it("rejects past start date", () => {
    const result = projectSchema.safeParse({
      ...validProject,
      startDate: "2020-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects end date before start date", () => {
    const result = projectSchema.safeParse({
      ...validProject,
      startDate: "2026-06-01",
      endDate: "2026-05-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("createTicketSchema", () => {
  const validTicket = {
    title: "Cannot log in",
    description: "I am unable to log in to my account with the correct credentials. Please help.",
    category: "account",
  };

  it("accepts valid ticket data", () => {
    const result = createTicketSchema.safeParse(validTicket);
    expect(result.success).toBe(true);
  });

  it("accepts ticket with priority", () => {
    const result = createTicketSchema.safeParse({
      ...validTicket,
      priority: "high",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short title", () => {
    const result = createTicketSchema.safeParse({
      ...validTicket,
      title: "Hi",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short description", () => {
    const result = createTicketSchema.safeParse({
      ...validTicket,
      description: "Short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = createTicketSchema.safeParse({
      ...validTicket,
      category: "billing",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority", () => {
    const result = createTicketSchema.safeParse({
      ...validTicket,
      priority: "urgent",
    });
    expect(result.success).toBe(false);
  });
});

describe("cohortSchema", () => {
  it("accepts valid cohort data", () => {
    const result = cohortSchema.safeParse({
      cohort: "June-2025-cohort",
      program: "full-stack",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid programs", () => {
    for (const program of ["full-stack", "product-design", "data-analysis", "cyber-security"]) {
      const result = cohortSchema.safeParse({ cohort: "Test Cohort", program });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid program", () => {
    const result = cohortSchema.safeParse({
      cohort: "Test Cohort",
      program: "invalid-program",
    });
    expect(result.success).toBe(false);
  });
});

describe("stageSchema", () => {
  const validStage = {
    title: "Foundation Stage",
    description: "Building the basics",
    passPercentage: 70,
  };

  it("accepts valid stage data", () => {
    const result = stageSchema.safeParse(validStage);
    expect(result.success).toBe(true);
  });

  it("rejects pass percentage over 100", () => {
    const result = stageSchema.safeParse({
      ...validStage,
      passPercentage: 101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects pass percentage under 0", () => {
    const result = stageSchema.safeParse({
      ...validStage,
      passPercentage: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("accepts valid profile update", () => {
    const result = updateProfileSchema.safeParse({
      name: "John Doe",
      phone: "+12345678901",
      gender: "male",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid phone number", () => {
    const result = updateProfileSchema.safeParse({
      name: "John Doe",
      phone: "12345",
      gender: "male",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid gender", () => {
    const result = updateProfileSchema.safeParse({
      name: "John Doe",
      phone: "+12345678901",
      gender: "unknown",
    });
    expect(result.success).toBe(false);
  });
});

describe("createAnnouncementSchema", () => {
  it("accepts valid announcement", () => {
    const result = createAnnouncementSchema.safeParse({
      title: "Important Announcement",
      content: "This is an important announcement for all members.",
      target: "all",
      priority: "high",
    });
    expect(result.success).toBe(true);
  });

  it("accepts cohort-targeted announcement", () => {
    const result = createAnnouncementSchema.safeParse({
      title: "Cohort Update",
      content: "Updates for the June cohort.",
      target: "cohort",
      targetCohort: "cohort123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short title", () => {
    const result = createAnnouncementSchema.safeParse({
      title: "AB",
      content: "Some content here.",
      target: "all",
    });
    expect(result.success).toBe(false);
  });
});

describe("hubTaskSchema", () => {
  it("accepts valid hub task", () => {
    const result = hubTaskSchema.safeParse({
      title: "Setup CI/CD pipeline",
      description: "Configure GitHub Actions",
      priority: "high",
      assignedTo: ["user1", "user2"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal hub task", () => {
    const result = hubTaskSchema.safeParse({
      title: "Fix bug",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short title", () => {
    const result = hubTaskSchema.safeParse({
      title: "AB",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority", () => {
    const result = hubTaskSchema.safeParse({
      title: "Setup CI/CD",
      priority: "critical",
    });
    expect(result.success).toBe(false);
  });
});
