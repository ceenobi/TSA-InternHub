export type KnowledgeBaseArticle = {
  id: string;
  title: string;
  category: string;
  icon: string;
  content: string;
  keywords: string[];
};

export const helpdeskKnowledgeBase: KnowledgeBaseArticle[] = [
  {
    id: "getting-started",
    title: "Getting Started with TSA InternHub",
    category: "Getting Started",
    icon: "rocket_launch",
    content: `TSA InternHub is your central platform for managing internship tasks, submitting work, tracking your progress, and receiving grades and feedback.

## Your Dashboard

When you first log in, you'll land on the **Dashboard** — your home base. Here you'll find:
- A **greeting** personalized with your name
- Quick links to your **current tasks**, **projects**, and **calendar**
- Key **metrics** like tasks completed and average score

## Navigating the Platform

Use the **sidebar** on the left to move between sections:
- **Tasks** — View and submit your stage tasks
- **Projects** — See project details and timelines
- **Members** — Find other members in your cohort
- **Calendar** — Track deadlines and stage dates
- **Settings** — Manage your profile and account

## First Steps

1. **Complete your profile** — Go to Settings to add your phone number and other details
2. **Explore your Tasks** — Click on "Tasks" in the sidebar to see your active project stages
3. **Start your first stage** — When you're ready, click "Start Stage" to begin working on tasks
4. **Submit your work** — Upload files or enter content for each task
5. **Check your grades** — After an admin grades your submission, you'll see your score and feedback`,
    keywords: [
      "welcome",
      "onboarding",
      "first steps",
      "dashboard",
      "navigation",
      "sidebar",
      "getting started",
      "guide",
    ],
  },
  {
    id: "account-registration",
    title: "Account Registration & Login",
    category: "Getting Started",
    icon: "person_add",
    content: `## Creating Your Account

To join TSA InternHub, you'll need an **invite code** sent to your email by your program administrator.

### Step-by-Step Registration

1. **Check your email**
2. **Click the registration link**
3. **Fill in your details**
4. **Enter your invite code**
5. **Submit**

### Password Requirements

Your password must include at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.

### Logging In

1. Go to the login page
2. Enter your registered email and password
3. Click "Sign In"

### Email Verification

After registration, check your email for a verification link. If you don't see it, check your spam folder or request a new verification email from the login page.`,
    keywords: [
      "register",
      "signup",
      "login",
      "signin",
      "invite code",
      "password",
      "verification",
      "email",
      "account",
    ],
  },
  {
    id: "profile-setup",
    title: "Setting Up Your Profile",
    category: "Getting Started",
    icon: "badge",
    content: `## Complete Your Profile

### Editing Your Profile

1. Click on **Settings** in the sidebar
2. Navigate to the **Profile** section
3. Update your name, phone number, and gender

### What Others See

Other members can see your name, email address, and role.

### Updating Your Information

Changes to your profile are saved immediately after clicking "Update".`,
    keywords: [
      "profile",
      "settings",
      "name",
      "phone",
      "avatar",
      "personal info",
      "update profile",
    ],
  },
  {
    id: "password-management",
    title: "Password & Security",
    category: "Getting Started",
    icon: "lock",
    content: `## Managing Your Password

### Changing Your Password

1. Go to **Settings > Security**
2. Click on **Change Password**
3. Enter your current and new password
4. Submit the change

### Forgotten Password

Click **"Forgot Password?"** on the login page, enter your email, and follow the reset link sent to your inbox.

### Account Security

- Your session lasts for **7 days**
- After **5 failed login attempts**, your account will be temporarily locked
- You can **view active sessions** in Settings > Security and revoke suspicious ones

### Deleting Your Account

Go to Settings > Security and click "Delete Account". You'll receive a confirmation email.`,
    keywords: [
      "password",
      "security",
      "change password",
      "reset",
      "forgot",
      "session",
      "delete account",
      "lock",
      "failed login",
    ],
  },
  {
    id: "tasks-overview",
    title: "Understanding Tasks & Stages",
    category: "Tasks & Submissions",
    icon: "task_alt",
    content: `## How Tasks Work

Tasks are organized into **stages**, and stages are part of a **project**.

### Stage Structure

Each project has up to **5 stages**, arranged sequentially. You must complete each stage before advancing to the next.

### Task Types

- **Individual** — Work done by you alone
- **Group** — Collaborative tasks

### Task Properties

Each task has a title, description, instructions, resources, max score, due date, max attempts, and bonus indicator.

### Viewing Your Tasks

Go to **Tasks** in the sidebar. Use the Stage Navigation bar to switch between stages.`,
    keywords: [
      "tasks",
      "stages",
      "overview",
      "structure",
      "types",
      "individual",
      "group",
      "bonus",
      "due date",
    ],
  },
  {
    id: "submitting-work",
    title: "Submitting Your Work",
    category: "Tasks & Submissions",
    icon: "upload_file",
    content: `## How to Submit Tasks

### Submitting a Task

1. Click on a task card to open the **submission modal**
2. Provide your work via text **content** or **file URLs**
3. Click **Submit**

### Submission Rules

- You have a limited number of **attempts** (usually 2)
- **Late submissions** incur a late penalty
- Make sure file URLs are accessible

### After Submitting

Your submission status shows as **"Submitted"** — pending admin review. The admin will grade it and provide a **score** and **feedback**. If returned, you can revise and resubmit.`,
    keywords: [
      "submit",
      "submission",
      "upload",
      "file",
      "content",
      "attempts",
      "resubmit",
      "late",
      "penalty",
    ],
  },
  {
    id: "stage-progression",
    title: "Stage Progression & Unlocking",
    category: "Tasks & Submissions",
    icon: "stairs",
    content: `## How Stage Progression Works

### Starting a Stage

When a stage is unlocked, click **"Start Stage"** to activate it. Its status changes to **"In Progress"**.

### Completing a Stage

A stage is **completed** when all tasks are submitted and graded, and your aggregate score meets the pass percentage.

### Automatic Unlocking

When you complete a stage, the next stage is **automatically unlocked** — no need to manually start it.

### Stage Statuses

- **Locked** — Previous stage not completed
- **Not Started** — Unlocked but not activated
- **In Progress** — Currently active
- **Completed** — Passed
- **Failed** — Did not meet pass mark`,
    keywords: [
      "progression",
      "unlock",
      "stage",
      "complete",
      "pass",
      "fail",
      "start",
      "activate",
      "auto-fail",
    ],
  },
  {
    id: "submissions-tab",
    title: "Tracking Your Submissions",
    category: "Tasks & Submissions",
    icon: "history",
    content: `## Submissions Tab

The **Submissions** tab shows a complete history of everything you've submitted.

### Status Meanings

- **Submitted** — Pending review
- **Graded** — Reviewed and scored
- **Returned** — Sent back for revisions

### Returned Submissions

Read the feedback, make improvements, and re-submit using one of your remaining attempts.`,
    keywords: [
      "submissions",
      "history",
      "tracking",
      "status",
      "feedback",
      "returned",
      "graded",
      "pending",
    ],
  },
  {
    id: "grading-system",
    title: "How Grading Works",
    category: "Grading & Scores",
    icon: "grading",
    content: `## Grading Overview

### The Grading Process

1. You **submit** your work
2. Status changes to **"Submitted"**
3. An admin assigns a **score** and **feedback**
4. The submission is marked **Graded** or **Returned**

### Score Calculation

Your score is a percentage of the max score. Your stage score is the total of all task scores divided by the total max scores.

### Pass/Fail

You **pass** when your aggregate percentage meets or exceeds the stage's **pass percentage** (typically 70%).`,
    keywords: [
      "grading",
      "score",
      "grade",
      "percentage",
      "pass",
      "fail",
      "feedback",
      "evaluation",
      "marking",
    ],
  },
  {
    id: "understanding-scores",
    title: "Understanding Your Scores",
    category: "Grading & Scores",
    icon: "bar_chart",
    content: `## Your Performance Metrics

### Stats Dashboard

The **Stats** tab shows:
- **Tasks Completed** — Number of graded tasks
- **Average Score** — Mean across graded submissions
- **On-Time Rate** — Percentage submitted before deadline
- **Stage Progress** — Percentage of stages completed
- **Score Trend** — Line chart of scores over time
- **Stage Breakdown** — Bar chart per stage
- **Submission Overview** — Donut chart of graded vs pending vs returned`,
    keywords: [
      "scores",
      "performance",
      "metrics",
      "average",
      "trend",
      "stats",
      "analytics",
      "chart",
      "progress",
    ],
  },
  {
    id: "projects-overview",
    title: "Understanding Projects",
    category: "Projects & Calendar",
    icon: "folder",
    content: `## Projects

A **project** is the container for all stages and tasks. Each cohort has one active project at a time.

### Project Statuses

- **Upcoming** — Defined but not started
- **Active** — Live with stages and tasks
- **Completed** — All stages done
- **On Hold** — Temporarily paused

### Viewing Projects

Go to **Projects** in the sidebar.`,
    keywords: [
      "project",
      "overview",
      "status",
      "timeline",
      "progress",
      "active",
      "upcoming",
      "completed",
    ],
  },
  {
    id: "calendar-feature",
    title: "Using the Calendar",
    category: "Projects & Calendar",
    icon: "calendar_month",
    content: `## Calendar View

The **Calendar** shows all important dates and deadlines.

- **Project** date ranges in blue
- **Stage** date ranges color-coded by order
- **Task due dates** in red

Go to **Calendar** in the sidebar to view.`,
    keywords: [
      "calendar",
      "dates",
      "deadlines",
      "timeline",
      "schedule",
      "events",
      "due dates",
      "color coded",
    ],
  },
  {
    id: "cohort-system",
    title: "Understanding Cohorts",
    category: "Cohort & Members",
    icon: "diversity_3",
    content: `## What is a Cohort?

A **cohort** is a group of interns who go through the program together. Each cohort belongs to a specific program.

### Active Cohort

There is one **active cohort** per program at a time.

### Viewing Members

Go to **Members** in the sidebar to see all members in your program.

### For Admins

Admins can create cohorts, activate/deactivate them, and view statistics.`,
    keywords: [
      "cohort",
      "group",
      "program",
      "members",
      "active",
      "inactive",
      "full stack",
      "product design",
      "data analysis",
      "cyber security",
    ],
  },
  {
    id: "members-directory",
    title: "Members Directory",
    category: "Cohort & Members",
    icon: "group",
    content: `## Members Page

Shows everyone in your program with their name, email, role, and status.

### For Admins

Admins can update roles and suspend users.`,
    keywords: [
      "members",
      "directory",
      "users",
      "colleagues",
      "peers",
      "contact",
      "role",
      "suspended",
      "active",
    ],
  },
  {
    id: "admin-tasks",
    title: "Managing Tasks (Admin)",
    category: "Administration",
    icon: "manage_accounts",
    content: `## Task Management for Admins

### Creating Tasks

1. Go to **Admin Tasks**
2. Select the stage and click **"Add Task"**
3. Fill in title, description, instructions, resources, type, max score, due date, and other settings

### Editing Tasks

Click **"Edit"** on any task to modify its details.

### Grading Submissions

Click **"Grade"** on any task, review the submission, enter a score and feedback, then choose **Grade** or **Return**.

### Task Stats

The **Stats** tab shows program-wide submission statistics, score distribution, and top performers.`,
    keywords: [
      "admin",
      "manage tasks",
      "create task",
      "edit task",
      "grade",
      "submissions",
      "admin tasks",
      "staff",
    ],
  },
  {
    id: "admin-cohorts",
    title: "Managing Cohorts (Admin)",
    category: "Administration",
    icon: "settings",
    content: `## Cohort Management for Admins

### Creating a Cohort

Go to **Settings > Cohorts** and click **"Add New Cohort"**. Enter a name and select the program.

### Activating a Cohort

Only one cohort per program can be active at a time.

### Sending Invitations

Go to **Settings > Staff**, click **"Send Invite Code"**, and enter the recipient's details.

### Managing Staff

View all admins, update roles, and add new admin accounts directly.`,
    keywords: [
      "admin",
      "cohorts",
      "settings",
      "create cohort",
      "activate",
      "invite",
      "staff",
      "roles",
      "manage",
    ],
  },
  {
    id: "audit-logs",
    title: "Audit Logs",
    category: "Administration",
    icon: "receipt_long",
    content: `## Audit Logs

Tracks important actions on the platform including auth events, task changes, settings updates, and security events.

### Viewing Logs

Go to **Audit Logs** in the sidebar. Use the category filter to narrow by type.

Users see their own logs. Admins see all logs across the platform.`,
    keywords: [
      "audit",
      "logs",
      "history",
      "activity",
      "tracking",
      "security",
      "events",
      "admin",
      "monitoring",
    ],
  },
];
