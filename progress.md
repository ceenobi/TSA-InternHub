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

### Unit Tests (Vitest) — 39 files, 417 tests
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
- [x] PR #15 merged — global chatbot, guest chat, late penalty auto-apply, Decimal128 fix
- [x] Late penalty grading — `calculateLatePenalty` helper, `gradeTask` applies flat + per-day to score, grade UI shows effective score preview
- [x] Decimal128 → Number — `latePenaltyPerDay` in stage model changed to Number; all defaults set to 0.5%
- [x] PR #16 merged — `step="any"` on number inputs for decimal support
- [x] PR #18 merged — prerender static pages: `/privacy`, `/terms`, `/support/guide`, `/delete-account-confirmation`
- [x] PR #19 merged — AGENTS.md with git workflow instructions
- [x] `tryCatchWrapper` now rethrows `Response` instances — 429 rate-limit responses propagate to the client instead of being flattened into generic 500s
- [x] Fixed `deleteProject` orphaned-submission bug — now deletes submissions by `task._id` (previously deleted by `stage` field which didn't exist); cascade collects task IDs from stages before cleaning submissions/tasks/progress/stages/project + broad program cache invalidation
- [x] Fixed `project-active` cache invalidation mismatches — `createProject`/`deleteProject` now invalidate the exact key (`project-active:pg<program>`) matching `getCurrentProject`
- [x] `createProject`/`updateProject` now also invalidate the `projects:pg<program>:*` list cache
- [x] `gradeTask` now resolves the submission's project cohort (via `task → stage → project → cohort`) instead of the grader's active cohort — correct cohort members for project-progress math and correct `cohortId`/program for integration events and cache invalidation
- [x] `gradeTask` cache invalidation expanded to cover task-stats (user + admin), scoreboards, project-active, submissions, and hub data for the affected program/cohort
- [x] `gradeTask` notification/workflow/integration payloads now report the **effective** score (after late-penalty) instead of the raw score
- [x] `gradeTask` stores fresh `latePenalty` (0 is no longer overridden by a stale `||` fallback for `graded` submissions)
- [x] `getTaskStatsForAdmins` rejects cross-program `programOverride` unless the caller is a `super_admin`
- [x] Added missing `checkRateLimit` guards: `fetchGradeTaskData` (now also wrapped in `tryCatchWrapper`), `fetchHubData`, `updateHubTaskStatus`, `updateMeetingUrl`, `getIntegrations`
- [x] Replaced dead `hub:tasks:<cohortId>` invalidation in `createHubTask` with real `hub:data:<cohortId>` key
- [x] Hardened grading authorization (CodeRabbit): `fetchGradeTaskData` now rejects non-graders (403), 404s on missing task, and blocks cross-program access for non-`super_admin` before returning any submission content
- [x] `gradeTask` now validates `MANAGE_TASKS` permission and enforces resolved-project program match against the session program before updating the submission
- [x] `getTaskStatsForAdmins` now rejects non-admin roles up front (before loading program users, emails, submissions, and stats) via `hasPermission(role, "MANAGE_TASKS")`
- [x] **Security (PR #27):** Resolved dependency advisories — bumped `react-router` + `@react-router/{node,serve,fs-routes,dev}` `7.17.0` → `7.18.2` (clears 5 CVEs: 2 high — DoS GHSA-chx6-hx7r-mcp5, CSRF GHSA-qwww-vcr4-c8h2; 3 moderate — open redirect GHSA-wrjc-x8rr-h8h6, XSS GHSA-h8fp-f39c-q6mh, constructor injection GHSA-337j-9hxr-rhxg) and `eslint` `^9.20.1` → `^10.9.1` (clears EOL deprecation). Stayed on 7.x to avoid the 8.x major breaking change. `yarn npm audit` → no findings; typecheck clean; 417 tests pass
- [x] **Security (PR #29):** Remediated all 33 remaining GitHub Dependabot transitive vulnerabilities by pinning patched versions via `resolutions` keyed by requested range — `brace-expansion@npm:^1.1.7/^2.0.2/^5.0.5/^5.0.8`, `fast-uri`, `ip-address`, `js-yaml`, `postcss`, `tar`, `undici@npm:^7.*/^8.4.1`, `@hono/node-server`, `hono`, `body-parser`, `ajv`. `yarn npm audit` → no findings; typecheck clean; 417 tests pass. Squash-merged to `main`.
- [x] **CI fix (PR #29):** `actions/setup-node@v5` hard-failed on the `"packageManager"` field (classic yarn 1.22.22 refused to run). Switched CI to explicit `corepack enable` + `corepack prepare yarn@4.16.0 --activate` (and dropped `cache: "yarn"`) so all jobs (`typecheck`/`test`/`lint`) use Yarn Berry 4.16.0 and pass.
- [x] **Component tests (PR #32):** Added Vitest component tests for 9 logic-bearing components in `app/components/__tests__/` — `chatbot`, `theme` (provider), `onboarding-tour`, `progress-bar`, `drawer`, `sidebar`, `notification`, `field`, `spotlight-card`. Covers RBAC nav filtering, theme persistence, polling/loading state, chatbot send/abort/feedback/clear, and spotlight hover reveal. All 461 tests pass; typecheck clean. Squash-merged `testing` → `main`; `testing` reset to `origin/main` afterward.
- [x] **Full-stack integration test (PR #36):** Added `app/.server/action/__tests__/app-flow.integration.test.ts` covering the admin→intern lifecycle end-to-end (create program/project → assign interns → submit → grade → completion). Fixed optional-chaining in `app/routes/_dashboard.projects.records/route.tsx` (PR #35 follow-up) and switched chat model to `nemotron-3.5-lightning-free`. 206 tests pass at merge; typecheck clean.
- [x] **Flow gap remediation + certificates (PR #37):** Remediated 3 defects surfaced by the integration test — (1) stage auto-fail was unreachable in the default flow because all 5 stages shared the project `endDate`; `createProject` now distributes stage `endDate` across stages. (2) Resubmission double-counted grades and counted `returned` submissions in totals; `gradeTask` now aggregates only the latest `graded` submission per task. (3) `runStatusUpdatesWorkflow` now issues a `Certificate` to members who finish all stages on project completion, notifies `certificate_issued`, and fails leftover `active` stage progress at project end. Added `app/.server/model/certificate.ts` (unique `certificateId`), `app/.server/action/certificate.ts` (`getUserCertificates`), and `certificate_issued` to the `NotificationType` union. Integration suite extended to 20 tests (default-flow auto-fail, no double-count, certificate issuance + read); 206 tests pass.
- [x] **Scheduler wiring + certificates page (PR #38):** Added a Vercel Cron in `vercel.json` (`*/15 * * * *`) hitting new `app/routes/api.v1.cron.status-updates/route.tsx`, which triggers the `run-status-updates` Upstash workflow so activation/completion, stage auto-fail, and certificate issuance now run on a schedule (previously only manually reachable). The cron endpoint optionally verifies a `CRON_SECRET` bearer token. Added `app/routes/_dashboard.certificates/route.tsx` (loader reads session certs via `getUserCertificates`) with a minimal UI and a `Certificates` sidebar nav entry. `yarn build` + `yarn typecheck` clean; full suite **481 tests pass**.
- [x] **Vercel deploy fixed (PR #40):** Root cause of every failing Vercel deployment was twofold — (1) the `*/15` Vercel Cron exceeded the Hobby plan limit (max one cron run/day), and (2) Vercel's build ran classic `yarn 1.22.19`, which cannot parse the Yarn-Berry-style `resolutions` keys (e.g. `name@npm:^range`) in `package.json`, so `yarn install` failed. Fixes: changed the cron to a daily `0 0 * * *` schedule (Hobby-allowed) and set the Vercel project **Install Command** to `corepack yarn@4.16.0 install` so the build uses Yarn Berry (matching local/CI) and the `resolutions` parse correctly. The trigger route is kept (it signs the QStash call to the workflow). Added `scripts/setup-qstash-schedule.mjs` to register a finer-grained QStash schedule (every 15 min) for `run-status-updates`, mirroring the existing `run-dashboard-refresh` QStash cron. All checks (Vercel, test, typecheck, lint, check-source-branch) now green.

- [x] **Certificates user-only + logo redesign (PR #42):** Restricted the certificates feature to the `user` role only — the `/certificates` sidebar nav entry is hidden for `admin`/`super_admin`, the certificate route renders a restricted UI when a non-`user` visits, and `getUserCertificates` returns 403 for non-`user` callers. Restored in-progress working-tree edits: `Logo` now renders an `<img>` with a string `size` prop (tailwind class) instead of the icon, with `logo.test.tsx` updated to match; fixed `support/route.tsx` `<Logo size={24}>` → `size="size-9"`. Typecheck clean; 481 tests pass.

- [x] **Lint gate fixed (PR #43):** ESLint was a no-op — no `eslint.config.*` existed and the CI `lint` job used `continue-on-error: true`, so it always passed. Added a flat `eslint.config.js` (typescript-eslint recommended + `react-hooks/rules-of-hooks` enforced as errors; `no-explicit-any` / `no-unused-vars` relaxed to warnings for now), added a `lint` script to `package.json`, and removed `continue-on-error` from the CI lint job so lint now actually gates merges. `eslint-plugin-react` was intentionally omitted (peer conflict with ESLint 10); only `react-hooks` is used. Verified: `yarn lint` clean (0 errors), typecheck clean, 481 tests pass.

---

## Known Issues / Blockers

- **Flaky test on CI** — Non-reproducible test failure on merge commit; re-running CI resolves it
- **Node 20 deprecation warning** — Resolved: CI now uses `actions/checkout@v5` and `actions/setup-node@v5`
- **No E2E in CI** — Playwright tests run locally only; no `npx playwright install` step in CI
- **CLIENT_URL env var** — Set to `https://tsa-internhub.vercel.app`; verify redirects/links work with production origin
