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

### Profile Picture

You can upload a profile picture from the **Profile Picture** card on the Settings page. The image is uploaded automatically to our CDN once you select it. See the "Uploading a Profile Picture" guide for details.

### What Others See

Other members can see your name, email address, role, and profile picture.

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

Go to **Members** in the sidebar to see all members in your program. Click on any member to view their full profile, including their contact info, account status, progress, and program details.

### For Admins

Admins can:
- **Create cohorts** — Go to Settings > Cohorts and click "Add New Cohort"
- **Activate/deactivate cohorts** — Manage which cohort is active per program
- **View statistics** — The Members > Stats page shows cohort analytics, program comparisons, and registration trends
- **Manage staff** — Settings > Staff lets you invite coordinators and manage roles`,
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
  {
    id: "profile-picture",
    title: "Uploading a Profile Picture",
    category: "Getting Started",
    icon: "account_circle",
    content: `## Profile Picture

You can upload a profile picture from the **Settings** page to personalize your account.

### How to Upload

1. Go to **Settings** in the sidebar
2. Find the **Profile Picture** card
3. Click **"Upload Photo"** and select an image (JPG, PNG, or WebP, max 2 MB)
4. A preview of your selected image will appear
5. The image uploads automatically to our CDN — no manual save needed
6. To remove your current picture, click **"Remove"** below the avatar

### What Others See

Your profile picture appears next to your name across the platform — in the header, on the members page, on scoreboards, and on task submissions. If you don't upload a picture, your initial will be shown as a placeholder.`,
    keywords: [
      "avatar",
      "profile picture",
      "photo",
      "upload",
      "image",
      "settings",
      "picture",
    ],
  },
  {
    id: "dark-mode",
    title: "Dark Mode & Theme",
    category: "Getting Started",
    icon: "dark_mode",
    content: `## Theme Customization

TSA InternHub supports **Light**, **Dark**, and **System** themes.

### Changing Your Theme

- Click the **sun/moon icon** in the top header bar to toggle between light and dark mode instantly
- For more options, open your **profile dropdown** (top-right avatar) and use the **Light / Dark / System** selectors
- **System** mode follows your operating system's preference automatically

### Persistence

Your theme choice is saved and will persist across sessions and devices.`,
    keywords: [
      "dark mode",
      "theme",
      "light mode",
      "system theme",
      "appearance",
      "toggle",
      "night mode",
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    category: "Getting Started",
    icon: "notifications",
    content: `## Notifications

Stay informed with real-time notifications about your activity on the platform.

### Accessing Notifications

Click the **bell icon** in the top header bar to open your notification panel.

### Types of Notifications

You'll receive notifications for:
- **Task graded** — An admin has scored your submission
- **Task returned** — Your submission was sent back for revisions
- **Stage completed** — You've passed a stage
- **Stage unlocked** — A new stage is available
- **Project updates** — Changes to project timelines or status
- **Announcements** — Important platform-wide messages

### Managing Notifications

- Unread notifications show a **blue dot** and a count badge on the bell icon (caps at 99+)
- Click **"Mark all read"** at the top of the panel to clear all unread indicators
- Click any notification to mark it as read individually
- The notification list updates automatically every 30 seconds`,
    keywords: [
      "notifications",
      "alerts",
      "bell",
      "unread",
      "mark read",
      "graded",
      "returned",
      "stage unlocked",
    ],
  },
  {
    id: "scoreboard",
    title: "Scoreboard & Rankings",
    category: "Grading & Scores",
    icon: "leaderboard",
    content: `## Scoreboard

The **Scoreboard** shows a ranked leaderboard of top performers across all cohorts.

### Viewing the Scoreboard

The scoreboard appears on the **Dashboard** page. It displays the **top 8 members** ranked by average score.

### What You'll See

- **Rank position** — 1st, 2nd, and 3rd places are highlighted with gold, silver, and bronze styling
- **User avatar and name** — with "(you)" label if it's you
- **Score percentage** — your average across all graded tasks
- **Cohort name** — visible to admins

### Full Rankings

Click **"Full rankings"** at the bottom of the scoreboard to view the complete ranking list on the **Projects > Records** page.`,
    keywords: [
      "scoreboard",
      "leaderboard",
      "rankings",
      "top performers",
      "scores",
      "average",
      "rank",
    ],
  },
  {
    id: "announcements-feature",
    title: "Announcements",
    category: "Cohort & Members",
    icon: "campaign",
    content: `## Announcements

Admins can post announcements to share important updates with members.

### Viewing Announcements

Go to **Announcements** in the sidebar. Announcements are shown in a feed sorted by most recent.

### Filters

Use the filters to narrow down announcements:
- **Priority** — Low, Normal, High, or Urgent
- **Target** — Everyone, your specific Cohort, or your Program

### Understanding Announcements

Each announcement shows:
- **Author** — name and avatar of the person who posted it
- **Priority badge** — color-coded by importance
- **Target badge** — who the announcement is for
- **Pin indicator** — pinned announcements stay at the top
- **Content** — expand long posts by clicking "Read more"
- **Timestamp** — how long ago it was posted

### For Admins

Admins can **create**, **pin/unpin**, and **delete** announcements from the Announcements page.`,
    keywords: [
      "announcements",
      "announcement",
      "news",
      "updates",
      "priority",
      "pin",
      "filter",
      "campaign",
    ],
  },
  {
    id: "hub-capstone",
    title: "The Hub (Capstone Workspace)",
    category: "Projects & Calendar",
    icon: "workspaces",
    content: `## The Hub

The **Hub** is a collaborative workspace for Stage 5 (Capstone) interns who have qualified by reaching Stage 4 with a 70%+ average score.

### If You Haven't Qualified

You'll see a **locked page** listing which members have qualified for the Capstone stage.

### If You Have Qualified

You'll have access to a full project management workspace:

- **Banner** — Shows the current Stage 5 task title and description
- **Team Leader** — An admin-assigned leader who can approve completed work
- **Qualified Members** — Count and avatars of all qualified participants
- **Stage Deadline** — The due date for the capstone

### Kanban Board

The workspace includes a **Kanban board** with four columns:
- **To Do** — Tasks not yet started
- **In Progress** — Tasks being worked on
- **In Review** — Tasks awaiting approval
- **Done** — Completed tasks

Each task card shows the title, description, priority badge, due date, and assigned members. The **Team Leader** can move tasks from "In Review" to "Done".

### Standup Meetings

If configured, click **"Join Standup"** to join a video call (Google Meet or Zoom) for team standups.`,
    keywords: [
      "hub",
      "capstone",
      "stage 5",
      "kanban",
      "workspace",
      "team",
      "leader",
      "standup",
      "board",
      "collaboration",
    ],
  },
  {
    id: "managing-staff",
    title: "Managing Staff & Roles (Admin)",
    category: "Administration",
    icon: "admin_panel_settings",
    content: `## Staff Management

Admins can manage program coordinators and their roles from the **Settings > Staff** page.

### Viewing Staff

Each staff member is displayed as a card showing:
- Avatar and name
- Verified email badge
- Role badge (Super Admin / Admin)
- Email and phone number
- Assigned program

### Inviting New Staff

1. Go to **Settings > Staff**
2. Click **"Send Invite Code"**
3. Enter the new staff member's name, email, and program
4. An invite email is sent and the account is created

### Managing Roles

- Use the role dropdown on any staff card to promote or demote between **Admin** and **Super Admin**
- Permissions control who can modify roles

### Sending Invitations to Members

Go to **Settings > Staff**, click **"Send Invite Code"**, and enter the recipient's details.`,
    keywords: [
      "staff",
      "admin",
      "roles",
      "manage",
      "invite",
      "coordinator",
      "super admin",
      "permissions",
    ],
  },
  {
    id: "integrations",
    title: "Integrations (Admin)",
    category: "Administration",
    icon: "extension",
    content: `## Integrations

Admins can connect external tools to TSA InternHub from the **Settings > Integrations** page. Each integration has a toggle to enable/disable and configurable fields.

### Available Integrations

- **Slack** — Posts notifications when tasks are graded, stages complete, or projects update (requires a webhook URL and channel name)
- **Google Calendar** — Auto-creates calendar events for project start and end dates (requires a service account key JSON and calendar ID)
- **GitHub** — Links student repos to tasks and updates commit statuses on grading (requires an access token and optional organization name)
- **Google Docs** — Enables inline commenting on submitted documents for richer feedback (requires an API key)
- **Notion** — Pushes stage instructions, resources, and project docs to a shared Notion workspace (requires an integration token and database ID)
- **Zoom / Google Meet** — Auto-generates meeting links for group tasks and stage kickoffs (configure your preferred provider and provider-specific credentials)

### Managing Integrations

1. Go to **Settings > Integrations**
2. Find the integration you want to configure
3. Toggle it on and fill in the required fields
4. Click **Save** to apply changes
5. Use **Delete** to remove the configuration entirely`,
    keywords: [
      "integrations",
      "slack",
      "google calendar",
      "github",
      "google docs",
      "notion",
      "zoom",
      "google meet",
      "webhook",
      "api",
      "settings",
    ],
  },
  {
    id: "member-analytics",
    title: "Member Analytics (Admin)",
    category: "Administration",
    icon: "analytics",
    content: `## Member Statistics

Admins can view cohort-wide analytics from the **Members > Stats** page.

### What You'll See

- **Active Cohort** — The name of the currently active cohort
- **Total Invites** — Number of invitation codes sent
- **Suspended Users** — Count of currently suspended accounts

### Program Comparison Chart

Toggles between two views:
- **All-Time** — Shows total cohorts vs active cohorts created for each program
- **Active** — Shows the active cohort count per program

### Registration Trends

An area chart showing new user registrations over the **last 30 days** to track growth trends.`,
    keywords: [
      "analytics",
      "stats",
      "statistics",
      "members",
      "cohort",
      "chart",
      "program comparison",
      "registration",
      "trends",
    ],
  },
  {
    id: "creating-support-tickets",
    title: "Creating Support Tickets",
    category: "Getting Started",
    icon: "support_ticket",
    content: `If you encounter an issue, bug, or need help while using TSA InternHub, you can create a support ticket.

## How to Create a Ticket

1. Navigate to **Help Center** in the sidebar
2. Click the **"Create Ticket"** button
3. Fill in the following details:
   - **Title** — A short summary of your issue (at least 3 characters)
   - **Description** — A detailed explanation of what's happening (at least 10 characters, max 1000)
   - **Category** — Choose the most relevant category: Account, Security, Task, or Other
   - **Priority** — How urgent is the issue? Low, Medium, High, or Critical
4. Click **Submit** to create your ticket

## What Happens After You Submit

- You'll receive an **in-app notification** confirming your ticket was created
- A **confirmation email** will be sent to your registered email address
- An **admin or support team member** will review and respond to your ticket
- You can track the status of your ticket in the **Help Center**

## Ticket Statuses

- **Open** — Your ticket has been submitted and is awaiting review
- **In Progress** — A support team member is working on your issue
- **Resolved** — Your issue has been addressed
- **Closed** — The ticket is no longer active

## Using the AI Assistant

You can also ask the AI assistant (bottom-right corner) to create a ticket for you. Just describe your issue and the assistant will help create it right from the chat.`,
    keywords: [
      "ticket",
      "support",
      "help",
      "issue",
      "bug",
      "problem",
      "contact support",
      "create ticket",
      "submit ticket",
      "help center",
    ],
  },
];
