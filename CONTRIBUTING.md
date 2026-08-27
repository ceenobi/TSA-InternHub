# Contributing to TSA InternHub

Thank you for contributing! This guide explains the workflow and standards
for contributing to the **TSA InternHub** internship management platform.

## Development Workflow

1. **Create a feature branch** from `main` (or `testing` for ongoing work):
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the project's coding conventions:
   - Functional components with hooks
   - Strict TypeScript typing
   - Tailwind CSS 4 with `cn()` utility for class merging
   - `@remixicon/react` for iconography (no `title` prop on Remixicon)
   - `cn()` utility for conditional class merging

3. **Run the full test suite** before committing:
   ```bash
   yarn test    # 39 test files, 417 tests
   yarn typecheck  # TypeScript compilation
   ```

4. **Commit with a descriptive message**:
   ```bash
   git commit -m "fix: <short description of the change>"
   ```

5. **Push to your fork** (or the `testing` branch):
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** from `testing` → `main`:
   - Fill the PR template (or describe the change, verification steps)
   - Ensure all CI checks pass (GitHub Actions: test, lint, typecheck)
   - Tag appropriate reviewers

7. **Merge after approval**:
   - Once CI passes, a maintainer merges the PR to `main` via squash merge
   - Sync your local `main`: `git checkout main && git pull origin main`

## Code Standards

- All routes must define and export type-safe `Route.LoaderArgs` and `Route.ActionArgs`
- Use `context.get()` inside loaders and middleware (Framework Mode)
- Server actions go in `app/.server/action/*.ts`
- Forms: Zod schemas in `app/lib/formSchema.ts` for validation + API payload verification
- Styling: Tailwind CSS 4 patterns; use `cn()` for conditional class merging
- Icons: `@remixicon/react`; wrap in `<span title="...">` for accessible tooltips
- Animation: `useWaveAnimation` hook for entrance animations
- Cache: `fetchWithCache` utility in `app/.server/utils/cache.ts` to reduce DB load

## Database & API

- MongoDB with Mongoose — use `.lean()` for read queries in Vitest mocks
- Better Auth with MongoDB Adapter for authentication
- Search: MongoDB Atlas Search (Lucene-based)
- Media: Cloudinary for avatars and uploads
- Queue: QStash for async workflows (run `yarn qstash` for local dev)

## Version & Releases

- Releases are managed via GitHub Releases
- See `AGENTS.md` for the official git workflow and branch policies

## Questions?

Open an issue or reach out to the maintainers. Thanks for helping improve
TSA InternHub!