# TSA InternHub — Progress

## Project Overview
TSA InternHub is an internship management platform built with **React Router v7** (SSR, file-based routing) + **MongoDB/Mongoose**. It manages task submissions, grading, project tracking, member analytics, and AI-powered assistance.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Router v7 (SSR, file-based routing) |
| Database | MongoDB + Mongoose |
| Auth | better-auth (email/password) |
| Styling | Tailwind CSS v4 + shadcn/ui (base-ui) |
| Cache | Upstash Redis |
| Media | Cloudinary (avatars, uploads) |
| Queue | Qstash (async workflows) |
| AI | OpenCode Zen API (chatbot) |
| Monitoring | Sentry |
| Testing | Vitest + Playwright |
| CI | GitHub Actions (3 jobs) |
| Deployment | Vercel |

---

## Architecture

```
app/
├── .server/
│   ├── action/        # 16 server actions (business logic)
│   ├── config/        # Database, email, keys, logger, redis, upstash
│   ├── integrations/  # GitHub, Google Calendar, Notion, Slack, Zoom
│   ├── model/         # 16 Mongoose models
│   ├── services/      # Audit log, auth, email, notification
│   ├── utils/         # Cache, cloudinary, email-templates, rate-limit
│   └── workflows/     # Qstash async workflows
├── components/
│   ├── ui/            # 36 shadcn UI primitives
│   ├── nav/           # Drawer, header, sidebar, search, profile, notifications, theme
│   └── provider/      # Onboarding tour, RBAC, theme, toast, alert, page-wrapper
├── hooks/             # 7 custom hooks (chat, upload, mobile, notif, animation, paginate, sidebar)
├── lib/               # 9 lib modules (rbac, storage, validation, knowledge-base, etc.)
├── middleware/        # Auth middleware
├── queries/           # 12 server query modules
└── routes/            # 85 route files (layouts, auth, dashboard, API, support)
```

---

## Features Implemented

### Auth & Onboarding
- Email/password registration and login
- Email verification, password reset, account recovery
- Delete account flow
- Onboarding tour for new users

### Dashboard (3 roles: admin, staff, member)
- **Overview** — Key metrics, recent activity, scoreboard
- **Members** — Directory, profiles, role management, suspensions
- **Cohorts** — Create and manage cohorts
- **Projects** — Full lifecycle (upcoming → active → completed), stages, tasks
- **Tasks** — Stage-based task cards, submission, grading with feedback
- **Grade Pipeline** — Admin/staff grade submissions with score and feedback
- **Hub** — Capstone workspace with Kanban board, team lead assignment, standup links
- **Calendar** — Color-coded deadlines (projects, stages, tasks)
- **Announcements** — Priority-targeted, pinnable, filterable
- **Settings** — Profile avatar upload, security, integrations, cohorts, staff
- **Help Center** — Ticket system (create, filter, stats)
- **Audit Logs** — General and per-entity tracking
- **Integrations** — Slack, GitHub, Google Calendar, Zoom, Notion (OAuth + sync)

### AI Chatbot
- **Globally accessible** — rendered in `root.tsx`, available on all routes (auth, dashboard, error pages)
- **Guest mode** — unauthenticated users can chat with general knowledge base context; personalized score/summary context requires login
- **Anonymous feedback** — unauthenticated users can rate responses (userId set to null)
- Streaming responses via OpenCode Zen API
- Knowledge base RAG context (20+ support articles)
- Personalized score summaries per user
- **Feedback loop** with thumbs up/down ratings (stored in `chatFeedback` model)
- Temperature 0.7, spell-check/grammar-correction prompt
- Beta badge with usage disclaimer

### Support
- Searchable knowledge base with 20+ articles
- Support guide route

### API
- Chat, auth, notifications, cohorts, email invites, upload, media, health, workflows

---

## Testing

### Unit Tests (Vitest) — 39 files, 415 tests
| Category | Files | Focus |
|----------|-------|-------|
| Components | 5 | Badge, Button, AccessDenied, ActionButton, Logo |
| Hooks | 7 | useChatStream, useFileUpload, useMobile, useNotifications, usePageAnimation, usePaginate, useSidebar |
| Lib | 7 | RBAC, storage, validation, color-utils, try-catch, utils, can-modify-role |
| Server Actions | 17 | All 16 actions + grade integration with `mongodb-memory-server` |
| Server Services | 3 | Audit log, email, notification |

### E2E Tests (Playwright) — 6 spec files
- Login, dashboard, hub, settings, tasks, support guide

### Coverage
- 44 hook tests across 7 hooks
- 12 chat server tests (streaming, feedback, error handling)
- MongoDB-memory-server integration tests for grade pipeline

---

## CI/CD

### GitHub Actions (`.github/workflows/ci.yml`)
| Job | Command | Details |
|-----|---------|---------|
| `typecheck` | `react-router typegen && tsc` | Node 22 |
| `test` | `vitest run` | JUnit reporting, Node 22 |
| `lint` | `npx eslint app/` | Zero-warnings (allowed to fail) |

Triggers: pushes to `main`/`testing`, PRs to `main`.

### Deployment (Vercel)
- `vercel.json` at root
- `npm run build` = `react-router build`
- `npm run start` = `react-router-serve ./build/server/index.js`

---

## Git Workflow
- **`main`** — Production branch, protected
- **`testing`** — Active development branch, merged to `main` via PR
- All CI checks must pass before merge

---

## Recent Accomplishments (This Session)

- [x] Improved chat response quality (temperature 0.5, spell-check, completeness prompt)
- [x] Added chat feedback loop — thumbs up/down UI, feedback API endpoint, Mongoose model
- [x] Standardized all 17 Route type imports to `"./+types/route"`
- [x] Resized email SVG icon to 18×18 with `vertical-align: middle`
- [x] Updated CI to Node 22 (fix kysely@0.29.3 requirement)
- [x] Merged PR #4 (`testing` → `main`) after resolving flaky CI test
- [x] Created this `progress.md`
- [x] Deployed to Vercel at **https://tsa-internhub.vercel.app** (project: `tsa-internhub`, team: `cobis-projects`)
- [x] Fixed Sentry Vite plugin for Vercel build — `defineConfig(async (env) => {...})` with dynamic import
- [x] Fixed typecheck: `tailwindcss()`/`reactRouter()` return `Plugin[]`, not `Plugin`
- [x] Set production env vars on Vercel: `BETTER_AUTH_URL`, `CLIENT_URL`, `QSTASH_URL`, `QSTASH_TOKEN`
- [x] Dashboard workflow now caches global summary in Redis (`dashboard:global-summary`, 300s TTL)
- [x] Dashboard reads cached global summary, preferring it for `totalUsers`/`pendingCount`/`totalSubmissions`
- [x] QStash cron job set up for `run-dashboard-refresh` (every 5 min)
- [x] Moved Chatbot from `_dashboard` layout to `root.tsx` — now globally accessible
- [x] Made chat API allow guest users (no session → guest system prompt, no user-specific context)
- [x] Made feedback API allow anonymous submissions (userId optional in model and route)
- [x] Fixed onboarding redirect bug — forwarded `Set-Cookie` header from `auth.api.updateUser` response
- [x] PR #14 merged — fix for onboarding redirect loop

---

## Known Issues / Blockers

- **Flaky test on CI** — Non-reproducible test failure on merge commit; re-running CI resolves it
- **Node 20 deprecation warning** — `actions/checkout@v4`, `actions/setup-node@v4`, `dorny/test-reporter@v2` target Node 20 (will need v5 upgrades)
- **No E2E in CI** — Playwright tests run locally only; no `npx playwright install` step in CI
- **CLIENT_URL env var** — Set to `https://tsa-internhub.vercel.app`; verify redirects/links work with production origin
