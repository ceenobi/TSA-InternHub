# TSA InternHub

Internship management platform for TSA — task submissions, grading, project tracking, and member analytics.

## Tech Stack

- **Framework** — React Router v7 (SSR, file-based routing)
- **Database** — MongoDB with Mongoose
- **Auth** — better-auth (email/password)
- **Styling** — Tailwind CSS v4 + shadcn/ui (base-ui)
- **Cache** — Upstash Redis
- **Media** — Cloudinary (avatars, uploads)
- **Queue** — Qstash (async workflows)
- **AI** — OpenCode Zen API (chatbot)

## Features

- **Tasks & Stages** — Projects organized into sequential stages with individual/group tasks, submissions, grading, and feedback
- **Scoreboard** — Live leaderboard of top performers with average scores and stage breakdowns
- **Projects** — Full project lifecycle (upcoming → active → completed)
- **Members** — Directory with profiles, role management, suspension controls
- **Hub** — Capstone workspace with Kanban board, team leader assignments, and standup meeting links
- **Calendar** — Color-coded project, stage, and task deadlines
- **Announcements** — Priority-targeted posts with pinning and filters
- **Admin Tools** — Cohort management, staff invites, audit logs, member analytics, integrations (Slack, GitHub, Google Calendar, Zoom, Notion)
- **Knowledge Base** — Searchable support guide with 20+ articles
- **AI Chatbot** — Streamed responses with knowledge base context and personalized score summaries

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB instance
- Upstash Redis account
- Cloudinary account
- OpenCode Zen API key (for chatbot)

### Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | MongoDB connection string |
| `DATABASE_NAME` | MongoDB database name |
| `BETTER_AUTH_SECRET` | Auth secret |
| `BETTER_AUTH_URL` | App URL (e.g. `http://localhost:3700`) |
| `CLIENT_URL` | Client URL |
| `CLOUDINARY_*` | Cloudinary credentials |
| `UPSTASH_*` | Upstash Redis credentials |
| `QSTASH_*` | Qstash credentials |
| `EMAIL_*` | SMTP/Brevo email settings |
| `OPENCODE_ZEN_API_KEY` | OpenCode Zen API key |

### Install & Run

```bash
npm install
npm run dev
```

Open `http://localhost:3700`.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
app/
├── .server/          # Server-only code (actions, models, services)
│   ├── action/       # Route action handlers
│   ├── config/       # Env vars, DB, Redis, logger
│   ├── model/        # Mongoose models
│   ├── services/     # Auth, email, notifications
│   └── utils/        # Rate limiting, caching
├── components/       # Shared UI components
│   └── ui/           # shadcn/ui primitives
├── hooks/            # Custom React hooks
├── lib/              # Constants, schemas, utilities
├── middleware/       # Route middleware (auth)
├── queries/          # React Query definitions
└── routes/           # File-based routes
```

## License

Private — TSA InternHub
