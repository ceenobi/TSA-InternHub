import z from "zod";

export const signUpSchema = z.object({
  name: z
    .string({
      message: "Complete this field to continue",
    })
    .min(3, {
      message: "Full name must be at least 3 characters long",
    }),
  email: z.email({ message: "Complete this field to continue" }),
  password: z
    .string({
      message: "Complete this field to continue",
    })
    .min(8, {
      message: "Password must be at least 8 characters long",
    })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: "Password must contain at least one special character",
    })
    .regex(/\d/, {
      message: "Password must contain at least one number",
    }),
  inviteCode: z
    .string({
      message: "Invite code is required",
    })
    .max(8, {
      message: "Invite code must be at most 8 characters long",
    }),
});

export const signInSchema = z.object({
  email: z.email({ message: "Complete this field to continue" }),
  password: z
    .string({
      message: "Complete this field to continue",
    })
    .min(8, {
      message: "Password must be at least 8 characters long",
    })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: "Password must contain at least one special character",
    })
    .regex(/\d/, {
      message: "Password must contain at least one number",
    }),
});

export const sendInviteCodeSchema = z.object({
  name: z
    .string({
      message: "Complete this field to continue",
    })
    .min(3, {
      message: "Full name must be at least 3 characters long",
    }),
  email: z.email({ message: "Complete this field to continue" }),
  cohortName: z.string({ message: "Complete this field to continue" }),
  program: z.enum([
    "full-stack",
    "product-design",
    "data-analysis",
    "cyber-security",
  ]),
});

export const adminInviteSchema = z.object({
  name: z
    .string({
      message: "Complete this field to continue",
    })
    .min(3, {
      message: "Full name must be at least 3 characters long",
    }),
  email: z.email({ message: "Complete this field to continue" }),
  program: z.enum([
    "full-stack",
    "product-design",
    "data-analysis",
    "cyber-security",
  ]),
});

export const updateProfileSchema = z.object({
  name: z
    .string({
      message: "Full name is required",
    })
    .min(3, {
      message: "Full name must be at least 3 characters long",
    })
    .optional(),
  phone: z
    .string({
      message: "Phone is required",
    })
    .refine((num) => /^\+\d{10,15}$/.test(num), {
      message: "Phone number must start with a + and contain 10-15 digits",
    }),
  gender: z.enum(["male", "female", "other"]),
});

export const onboardingSchema = z.object({
  name: z
    .string({ message: "Full name is required" })
    .min(3, { message: "Full name must be at least 3 characters long" }),
  phone: z
    .string({ message: "Phone is required" })
    .refine((num) => /^\+\d{10,15}$/.test(num), {
      message: "Phone number must start with a + and contain 10-15 digits",
    })
    .optional()
    .or(z.literal("")),
  gender: z.enum(["male", "female", "other"]).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.email({ message: "Complete this field to continue" }),
});

export const changePasswordSchema = z
  .object({
    newPassword: z
      .string({
        message: "New password is required",
      })
      .min(8, {
        message: "New password must be at least 8 characters long",
      })
      .regex(/[A-Z]/, {
        message: "New password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "New password must contain at least one lowercase letter",
      })
      .regex(/[!@#$%^&*(),.?":{}|<>]/, {
        message: "New password must contain at least one special character",
      })
      .regex(/\d/, {
        message: "New password must contain at least one number",
      }),
    confirmPassword: z
      .string({
        message: "Confirm password is required",
      })
      .min(8, {
        message: "Confirm password must be at least 8 characters long",
      })
      .regex(/[A-Z]/, {
        message: "Confirm password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Confirm password must contain at least one lowercase letter",
      })
      .regex(/[!@#$%^&*(),.?":{}|<>]/, {
        message: "Confirm password must contain at least one special character",
      })
      .regex(/\d/, {
        message: "Confirm password must contain at least one number",
      }),
    currentPassword: z
      .string({
        message: "Current password is required",
      })
      .min(8, {
        message: "Current password must be at least 8 characters long",
      })
      .regex(/[A-Z]/, {
        message: "Current password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Current password must contain at least one lowercase letter",
      })
      .regex(/[!@#$%^&*(),.?":{}|<>]/, {
        message: "Current password must contain at least one special character",
      })
      .regex(/\d/, {
        message: "Current password must contain at least one number",
      }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Confirm password must match new password",
    path: ["confirmPassword"],
  });

export const cohortSchema = z.object({
  cohort: z
    .string({
      message: "Complete this field to continue",
    })
    .min(3, { message: "Cohort name must be at least 3 characters long" }),
  program: z.enum([
    "full-stack",
    "product-design",
    "data-analysis",
    "cyber-security",
  ]),
});

export const resetPasswordSchema = z.object({
  newPassword: z
    .string({
      message: "New password is required",
    })
    .min(8, {
      message: "New password must be at least 8 characters long",
    })
    .regex(/[A-Z]/, {
      message: "New password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "New password must contain at least one lowercase letter",
    })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: "New password must contain at least one special character",
    })
    .regex(/\d/, {
      message: "New password must contain at least one number",
    }),
});

export const projectSchema = z
  .object({
    status: z.enum(["upcoming", "active", "completed", "on-hold"]).optional(),
    title: z
      .string({
        message: "Project title is required",
      })
      .min(3, {
        message: "Project title must be at least 3 characters long",
      })
      .max(100, {
        message: "Project title must be at most 100 characters long",
      }),
    description: z
      .string()
      .min(10, {
        message: "Description must be at least 10 characters long",
      })
      .max(1000, {
        message: "Description must be at most 1000 characters long",
      }),
    cohortId: z.string({
      message: "Cohort Id is required",
    }),
    startDate: z.string({
      message: "Start date is required",
    }),
    endDate: z.string({
      message: "End date is required",
    }),
  })
  .refine(
    (data) =>
      new Date(data.startDate) >=
      new Date(new Date().toISOString().split("T")[0]),
    {
      message: "Start date cannot be in the past",
      path: ["startDate"],
    },
  )
  .refine(
    (data) =>
      new Date(data.endDate) >=
      new Date(new Date().toISOString().split("T")[0]),
    {
      message: "End date cannot be in the past",
      path: ["endDate"],
    },
  )
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const stageSchema = z
  .object({
    title: z
      .string({
        message: "Stage title is required",
      })
      .min(3, {
        message: "Stage title must be at least 3 characters long",
      })
      .max(100, {
        message: "Stage title must be at most 100 characters long",
      }),
    description: z
      .string()
      .max(1000, {
        message: "Description must be at most 1000 characters long",
      })
      .optional(),
    passPercentage: z.coerce
      .number({
        message: "Pass percentage is required",
      })
      .min(0, {
        message: "Pass percentage must be at least 0",
      })
      .max(100, {
        message: "Pass percentage cannot exceed 100",
      }),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    lateGraceHours: z.coerce
      .number()
      .min(0, {
        message: "Late grace hours must be at least 0",
      })
      .default(24),
    latePenaltyPerDay: z.coerce
      .number()
      .min(0, {
        message: "Late penalty must be at least 0",
      })
      .max(100, {
        message: "Late penalty cannot exceed 100",
      })
      .default(20),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.startDate) <= new Date(data.endDate);
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  );

const taskSchemaFields = {
  stage: z.string({
    message: "Stage is required",
  }),
  title: z
    .string({
      message: "Task title is required",
    })
    .min(3, {
      message: "Task title must be at least 3 characters long",
    })
    .max(100, {
      message: "Task title must be at most 100 characters long",
    }),
  description: z
    .string()
    .min(10, {
      message: "Description must be at least 10 characters long",
    })
    .max(1000, {
      message: "Description must be at most 1000 characters long",
    })
    .optional(),
  instructions: z.string().optional(),
  resources: z
    .array(
      z.object({
        name: z.string().min(1, "Resource name is required"),
        url: z.string().min(1, "Resource URL is required"),
      }),
    )
    .optional()
    .default([]),
  type: z.enum(["individual", "group"], {
    message: "Task type is required",
  }),
  maxScore: z.coerce
    .number({
      message: "Max score is required",
    })
    .min(1, {
      message: "Max score must be at least 1",
    }),
  isBonus: z.boolean().optional().default(false),
  order: z.coerce
    .number({
      message: "Order is required",
    })
    .min(1, {
      message: "Order must be at least 1",
    }),
  dueDate: z
    .string({
      message: "Due date is required",
    })
    .min(1, {
      message: "Due date is required",
    }),
  maxAttempts: z.coerce
    .number()
    .min(1, {
      message: "Max attempts must be at least 1",
    })
    .optional()
    .default(2),
  allowLate: z.boolean().optional().default(true),
  latePenaltyPercent: z.coerce
    .number()
    .min(0, {
      message: "Late penalty must be at least 0",
    })
    .max(100, {
      message: "Late penalty cannot exceed 100",
    })
    .optional()
    .default(5),
} as const;

export const taskSchema = z.object(taskSchemaFields).refine(
  (data) => {
    if (!data.dueDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(data.dueDate);
    due.setHours(0, 0, 0, 0);
    return due > today;
  },
  {
    message: "Due date must be tomorrow or later",
    path: ["dueDate"],
  },
);

export const createTicketSchema = z.object({
  title: z.string().min(3, {
    message: "Ticket title must be at least 3 characters long",
  }),
  description: z
    .string()
    .min(10, {
      message: "Description must be at least 10 characters long",
    })
    .max(1000, {
      message: "Description must be at most 1000 characters long",
    }),
  category: z.enum(["account", "security", "task", "other"]),
  priority: z
    .enum(["low", "medium", "high", "critical"])
    .optional()
    .default("low"),
});

export const hubTaskSchema = z.object({
  title: z
    .string({ message: "Task title is required" })
    .min(3, { message: "Title must be at least 3 characters" })
    .max(100, { message: "Title cannot exceed 100 characters" }),
  description: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .optional(),
  priority: z.enum(["low", "medium", "high"]).default("low"),
  dueDate: z.string().optional(),
  assignedTo: z.array(z.string()).optional().default([]),
});

export const assignTeamLeaderSchema = z.object({
  userId: z.string({ message: "User ID is required" }),
  cohortId: z.string({ message: "Cohort ID is required" }),
});

export const updateHubTaskStatusSchema = z.object({
  taskId: z.string({ message: "Task ID is required" }),
  status: z.enum(["todo", "in-progress", "in-review", "done"]),
});

export const updateMeetingUrlSchema = z.object({
  meetingUrl: z
    .string()
    .url({ message: "Must be a valid URL" })
    .or(z.literal(""))
    .optional(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150),
  content: z.string().min(1, "Content is required").max(5000),
  target: z.enum(["all", "cohort", "program"]),
  targetCohort: z.string().optional(),
  targetProgram: z
    .enum(["full-stack", "product-design", "data-analysis", "cyber-security"])
    .optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  pinned: z.boolean().default(false),
  expiresAt: z.string().optional(),
});

export const UploadSignatureSchema = z.object({
  folder: z.string().min(2, {
    message: "Folder name is required and should be at least 2 characters long",
  }),
});

export const uploadSchema = z.object({
  files: z.array(z.string()).min(1, {
    message: "At least one file is required",
  }),
  folder: z.string().min(1, {
    message: "Folder is required",
  }),
});

export const deleteMediaSchema = z.object({
  publicIds: z.array(z.string()).min(1, {
    message: "At least one public ID is required",
  }),
});

export const updateUserAvatarSchema = z.object({
  image: z.string().optional(),
  imagePublicId: z.string().optional(),
});
