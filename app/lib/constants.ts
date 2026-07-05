import {
  RiBookFill,
  RiBookletFill,
  RiCalendar2Fill,
  RiCheckLine,
  RiCloseLine,
  RiDashboardFill,
  RiErrorWarningLine,
  RiFileTextFill,
  RiFolder5Fill,
  RiQuestionLine,
  RiSettings5Fill,
  RiTeamFill,
  RiTicketFill,
  RiTimeLine,
  RiTodoFill,
  RiBuilding3Fill,
  RiMegaphoneFill
} from "@remixicon/react";
import type { CohortDataType, ProjectData, UserData } from "~/types";

export const formFields = [
  {
    name: "name",
    label: "Full Name",
    type: "text",
    placeholder: "Enter full name",
  },
  {
    name: "email",
    label: "Email Address",
    type: "email",
    placeholder: "Enter email address",
  },
  {
    name: "newEmail",
    label: "New Email",
    type: "email",
    placeholder: "Your new email",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Enter password",
  },
  {
    name: "phone",
    label: "Phone",
    type: "tel",
    placeholder: "+234(phone-number)",
  },
  {
    name: "inviteCode",
    label: "Invite Code",
    type: "text",
    placeholder: "Enter invite code",
  },
  {
    name: "currentPassword",
    label: "Current Password",
    type: "password",
    placeholder: "Your current password",
  },
  {
    name: "newPassword",
    label: "New Password",
    type: "password",
    placeholder: "Enter your new password",
  },
  {
    name: "confirmPassword",
    label: "Confirm New Password",
    type: "password",
    placeholder: "Confirm your new password",
  },
  {
    name: "location",
    label: "Location",
    type: "text",
    placeholder: "Enter location",
  },
  {
    name: "title",
    label: "Project Title",
    type: "text",
    placeholder: "Enter project title",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Give a brief description",
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    placeholder: "Select status",
    options: [
      { id: "upcoming", name: "Upcoming" },
      { id: "active", name: "Active" },
      { id: "completed", name: "Completed" },
      { id: "on-hold", name: "On Hold" },
    ],
  },
  {
    name: "cohortId",
    label: "Cohort",
    type: "text",
    placeholder: "Cohort ID",
    disabled: true,
  },
  {
    name: "startDate",
    label: "Start Date",
    type: "date",
    placeholder: "Select start date",
  },
  {
    name: "endDate",
    label: "End Date",
    type: "date",
    placeholder: "Select end date",
  },
  {
    name: "gender",
    label: "Gender",
    type: "select",
    placeholder: "Select gender",
    options: [
      { id: "male", name: "Male" },
      { id: "female", name: "Female" },
      { id: "other", name: "Other" },
    ],
  },
  {
    name: "cohort",
    label: "Cohort",
    type: "text",
    placeholder: "Enter cohort name - (e.g. June-2025-cohort)",
  },
  {
    name: "cohortName",
    label: "Cohort",
    type: "text",
    placeholder: "Enter cohort name",
  },
  {
    name: "program",
    label: "Program",
    type: "select",
    placeholder: "Select program",
    options: [
      { id: "full-stack", name: "Full Stack" },
      { id: "product-design", name: "Product Design" },
      { id: "data-analysis", name: "Data Analysis" },
      { id: "cyber-security", name: "Cyber Security" },
    ],
  },
];

export const sidebarLinks = [
  {
    name: "Dashboard",
    href: "/",
    icon: RiDashboardFill,
  },
  {
    name: "Tasks",
    href: "/tasks",
    icon: RiTodoFill,
  },
  {
    name: "Tasks",
    href: "/admin-tasks",
    icon: RiTodoFill,
  },
  {
    name: "Hub",
    href: "/hub",
    icon: RiBuilding3Fill,
  },
  {
    title: "General",
    children: [
      {
        name: "Projects",
        href: "/projects",
        icon: RiFolder5Fill,
      },
      {
        name: "members",
        href: "/members",
        icon: RiTeamFill,
      },
      {
        name: "Calendar",
        href: "/calendar",
        icon: RiCalendar2Fill,
      },
    ],
  },
  {
    title: "Account",
    children: [
      {
        name: "announcements",
        href: "/announcements",
        icon: RiMegaphoneFill,
      },
      {
        name: "Audit Logs",
        href: "/audit-logs",
        icon: RiFileTextFill,
      },
      {
        name: "settings",
        href: "/settings",
        icon: RiSettings5Fill,
      },
    ],
  },
  {
    title: "Support",
    children: [
      {
        name: "Knowledge Base",
        href: "/support/guide",
        icon: RiBookletFill,
      },
      {
        name: "Help Center",
        href: "/help-center",
        icon: RiTicketFill,
      },
    ],
  },
];

export const roles = {
  user: "user",
  admin: "admin",
  super_admin: "super_admin",
} as const;

export type Role = (typeof roles)[keyof typeof roles];

export const permissions = {
  MANAGE_MEMBERS: [roles.admin, roles.super_admin],
  MANAGE_COHORTS: [roles.admin, roles.super_admin],
  VIEW_REPORTS: [roles.admin, roles.super_admin],
  MANAGE_SETTINGS: [roles.super_admin, roles.admin, roles.user],
  MANAGE_SESSIONS: [roles.super_admin],
  MANAGE_ROLES: [roles.super_admin],
  MANAGE_TASKS: [roles.admin, roles.super_admin],
  MANAGE_TASK: [roles.user],
  CREATE_TICKET: [roles.user],
  MANAGE_TICKETS: [roles.super_admin, roles.admin],
  ASSIGN_TICKET: [roles.super_admin],
  MANAGE_INTEGRATIONS: [roles.admin, roles.super_admin],
  HUB_CREATE_TASK: [roles.user, roles.admin, roles.super_admin],
  HUB_ASSIGN_TASK: [roles.admin, roles.super_admin],
  HUB_MANAGE_TASKS: [roles.admin, roles.super_admin],
  ASSIGN_TEAM_LEADER: [roles.admin, roles.super_admin],
  VIEW_HUB: [roles.user, roles.admin, roles.super_admin],
} as const;

export type Permission = keyof typeof permissions;

export const cohortStatusColor = (status: CohortDataType["status"]) => {
  switch (status) {
    case "active":
      return "border-green-600 bg-green-50 text-green-700 dark:border-green-300 dark:bg-green-100 dark:text-green-800";
    case "inactive":
      return "border-red-600 bg-red-50 text-red-700 dark:border-red-300 dark:bg-red-100 dark:text-red-800";
    default:
      return "border-muted-foreground/20 bg-muted text-muted-foreground";
  }
};

export const canModifyRole = (
  sessionUser: UserData,
  targetRole: string,
  targetUser: { _id: string; role: "admin" | "user" | "super_admin" },
) => {
  // No one can modify super_admin users (except for specific cases handled below)
  if (targetUser.role === "super_admin") {
    // Super admins can modify other super admins (for demotion), but not themselves
    return (
      sessionUser.role === "super_admin" && sessionUser._id !== targetUser._id
    );
  }
  // Regular users can't modify any roles
  if (sessionUser.role === "user") {
    return false;
  }
  // Admins can modify user and admin roles (but not super_admin, handled above)
  if (sessionUser.role === "admin") {
    return ["user", "admin"].includes(targetRole);
  }

  // Super admins can modify any role (except downgrading themselves)
  if (sessionUser.role === "super_admin") {
    return true;
  }
  return false;
};

export const getProjectStatusColor = (status: ProjectData["status"]) => {
  switch (status) {
    case "upcoming":
      return "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-300 dark:bg-blue-100 dark:text-blue-800";
    case "completed":
      return "border-green-600 bg-green-50 text-green-700 dark:border-green-300 dark:bg-green-100 dark:text-green-800";
    case "active":
      return "border-yellow-600 bg-yellow-50 text-yellow-700 dark:border-yellow-300 dark:bg-yellow-100 dark:text-yellow-800";
    case "on-hold":
      return "border-gray-600 bg-gray-50 text-gray-700 dark:border-gray-300 dark:bg-gray-100 dark:text-gray-800";
    default:
      return "border-muted-foreground/20 bg-muted text-muted-foreground";
  }
};

export const getProgressColor = (progress: ProjectData["progress"]) => {
  switch (progress) {
    case 0:
      return "bg-blue-500";
    case 25:
      return "bg-yellow-500";
    case 50:
      return "bg-amber-500";
    case 75:
      return "bg-orange-500";
    case 100:
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

export const taskFields = [
  {
    name: "title",
    label: "Title",
    type: "text",
    placeholder: "Enter task title",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Give a brief description",
  },
  {
    name: "instructions",
    label: "Instructions (optional)",
    type: "textarea",
    placeholder: "Provide detailed instructions for this task",
  },
  {
    name: "type",
    label: "Type",
    type: "select",
    placeholder: "Select task type",
    options: [
      { id: "individual", name: "Individual" },
      { id: "group", name: "Group" },
    ],
  },
  {
    name: "maxScore",
    label: "Max Score",
    type: "number",
    placeholder: "e.g. 100",
  },
  {
    name: "isBonus",
    label: "Bonus Task",
    type: "switch",
  },
  {
    name: "order",
    label: "Order",
    type: "number",
    placeholder: "e.g. 1",
  },
  {
    name: "dueDate",
    label: "Due Date",
    type: "date",
    placeholder: "Select due date",
  },
  {
    name: "maxAttempts",
    label: "Max Attempts",
    type: "number",
    placeholder: "e.g. 2",
  },
  {
    name: "allowLate",
    label: "Allow Late Submission",
    type: "switch",
  },
  {
    name: "latePenaltyPercent",
    label: "Late Penalty (%)",
    type: "number",
    placeholder: "e.g. 5",
  },
];

export const stageFields: Array<{
  name: string;
  label: string;
  type: string;
  placeholder: string;
  options?: Array<{ id: string; name: string }>;
}> = [
  {
    name: "title",
    label: "Title",
    type: "text",
    placeholder: "Enter stage title",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Give a brief description",
  },
  {
    name: "passPercentage",
    label: "Pass Percentage",
    type: "number",
    placeholder: "e.g. 70",
  },
  {
    name: "startDate",
    label: "Start Date",
    type: "date",
    placeholder: "Select start date",
  },
  {
    name: "endDate",
    label: "End Date",
    type: "date",
    placeholder: "Select end date",
  },
  {
    name: "lateGraceHours",
    label: "Late Grace Hours",
    type: "number",
    placeholder: "e.g. 24",
  },
  {
    name: "latePenaltyPerDay",
    label: "Late Penalty Per Day (%)",
    type: "number",
    placeholder: "e.g. 20",
  },
];

export const ticketPriority = [
  { id: "low", name: "low" },
  { id: "medium", name: "medium" },
  { id: "high", name: "high" },
  { id: "critical", name: "critical" },
];

export const ticketCategory = [
  { id: "auth", name: "Auth" },
  { id: "task", name: "task" },
  { id: "security", name: "security" },
  { id: "other", name: "other" },
];

export const ticketFields = [
  {
    name: "title",
    label: "Title",
    type: "text",
    placeholder: "Title (Keep it simple and short)",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Description (Detail the issue)",
  },
  {
    name: "category",
    label: "Category",
    type: "select",
    placeholder: "Category",
    options: ticketCategory,
  },
  {
    name: "priority",
    label: "Priority",
    type: "select",
    placeholder: "Priority",
    options: ticketPriority,
  },
];

export const getTicketStatusColor = (status: string) => {
  switch (status) {
    case "open":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "in-progress":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "resolved":
      return "bg-green-100 text-green-700 border-green-200";
    case "closed":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export const getTicketStatusIcon = (status: string) => {
  switch (status) {
    case "open":
      return RiErrorWarningLine;
    case "in-progress":
      return RiTimeLine;
    case "resolved":
      return RiCheckLine;
    case "closed":
      return RiCloseLine;
    default:
      return RiQuestionLine;
  }
};



export const programLabel: Record<string, string> = {
  "full-stack": "Full Stack",
  "product-design": "Product Design",
  "data-analysis": "Data Analysis",
  "cyber-security": "Cyber Security",
};

