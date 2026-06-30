import type z from "zod";
import type {
  adminInviteSchema,
  changePasswordSchema,
  cohortSchema,
  createTicketSchema,
  forgotPasswordSchema,
  projectSchema,
  resetPasswordSchema,
  sendInviteCodeSchema,
  signInSchema,
  signUpSchema,
  stageSchema,
  taskSchema,
  updateProfileSchema,
} from "./lib/schemaValidation";

export type SignUpSchemaType = z.infer<typeof signUpSchema>;
export type SignInSchemaType = z.infer<typeof signInSchema>;
export type SendInviteCodeSchemaType = z.infer<typeof sendInviteCodeSchema>;
export type ChangePasswordSchemaType = z.infer<typeof changePasswordSchema>;
export type UpdateProfileSchemaType = z.infer<typeof updateProfileSchema>;
export type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>;
export type CohortSchemaType = z.infer<typeof cohortSchema>;
export type ProjectSchemaType = z.infer<typeof projectSchema>;
export type AdminInviteSchemaType = z.infer<typeof adminInviteSchema>;
export type TaskSchemaType = z.infer<typeof taskSchema>;
export type StageSchemaType = z.infer<typeof stageSchema>;
export type CreateTicketSchemaType = z.infer<typeof createTicketSchema>;

export type UserData = {
  _id: string;
  name: string;
  email: string;
  role: (typeof roles)[keyof typeof roles];
  isOnboarded: boolean;
  customRoleId?: string;
  emailVerified: boolean;
  image?: string;
  phone?: string;
  gender?: string;
  cohort?: string;
};

export type UsePaginateProps = {
  totalPages: number;
  hasMore: boolean;
  currentPage: number;
};

export type CohortDataType = {
  _id: string;
  cohort: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  members: UserData[];
  program: "full-stack" | "product-design" | "data-analysis" | "cyber-security";
};

export type AuditLogData = {
  _id: string;
  userId: string;
  userName: string;
  action: string;
  category: "auth" | "tasks" | "staff" | "settings" | "security";
  details: Record<string, any>;
  status: "success" | "failure";
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectData = {
  _id: string;
  title: string;
  description: string;
  cohort: CohortDataType;
  createdBy: string | { _id: string; name: string; email: string };
  status: "upcoming" | "active" | "completed" | "on-hold";
  startDate?: string;
  endDate?: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
};

export type StageData = {
  _id: string;
  project: string;
  order: number;
  title: string;
  description?: string;
  passPercentage: number;
  startDate?: string;
  endDate?: string;
  lateGraceHours?: number;
  latePenaltyPerDay?: number;
};

export type TaskData = {
  _id: string;
  stage: string;
  title: string;
  description?: string;
  instructions?: string;
  resources?: { name: string; url: string }[];
  type: "individual" | "group";
  maxScore: number;
  isBonus: boolean;
  order: number;
  dueDate?: string;
  maxAttempts: number;
  allowLate: boolean;
};

export type StageProgressData = {
  _id: string;
  stage: string;
  status: "locked" | "active" | "completed" | "failed";
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  passed: boolean;
  startedAt?: string;
  completedAt?: string;
};

export type StageWithData = {
  stage: StageData;
  tasks: TaskData[];
  progress: StageProgressData | null;
};

export type TasksPageData = {
  project: ProjectData;
  stages: StageWithData[];
};

export type CalendarEvent = {
  _id: string;
  title: string;
  type: "project" | "stage" | "task";
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  stageOrder?: number;
  projectId?: string;
  stageId?: string;
  description?: string;
  color: string;
};

export type GradeTaskData = {
  task: TaskData;
  stage: {
    _id: string;
    title: string;
    order: number;
    passPercentage: number;
  };
  submissions: {
    _id: string;
    user: UserData;
    content?: string;
    fileUrls?: { name: string; url: string }[];
    status: "submitted" | "graded" | "returned";
    score?: number;
    maxScore: number;
    percentage?: number;
    feedback?: string;
    gradedBy?: string;
    attemptNumber: number;
    submittedAt: string;
    gradedAt?: string;
    isLate: boolean;
    latePenalty: number;
  }[];
};

export type SubmissionData = {
  _id: string;
  task: string;
  user: UserData;
  content?: string;
  fileUrls: { name: string; url: string }[];
  status: "submitted" | "graded" | "returned";
  score?: number;
  maxScore: number;
  percentage?: number;
  feedback?: string;
  gradedBy?: UserData;
  attemptNumber: number;
  submittedAt: Date;
  gradedAt?: Date;
  isLate: boolean;
  latePenalty: number;
};

export type TicketData = {
  _id: string;
  userId: UserData;
  ticketId: string;
  title: string;
  description: string;
  category: "technical" | "event" | "payment" | "other";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in-progress" | "resolved" | "closed";
  assignedTo: UserData;
  createdAt: Date;
  updatedAt: Date;
};
