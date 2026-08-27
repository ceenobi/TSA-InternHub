# Learnings

- 2026-08-27 — deps: In this Yarn Berry 4.x repo, run `yarn npm audit` (NOT `yarn audit`) to check vulnerabilities; the short command errors with "Couldn't find a script named audit".
- 2026-08-27 — deps: react-router security bumps should stay on the latest 7.x patch (e.g. 7.18.2) rather than jumping to 8.x, since 8.x is a major with breaking changes; the 7.17.0 CVEs are all fixed by 7.18.2.
- 2026-08-27 — ci: GitHub's "N vulnerabilities on default branch" banner is cached and only re-scans `main` after a merge — local `yarn npm audit` reports the real current state, which can be far fewer than the banner implies.
- 2026-08-27 — ci: The `lint` CI job (`npx eslint app/ --max-warnings 0`) runs with `continue-on-error: true` and there is no eslint config file, so lint failures never block merges; treat `typecheck` + `test` as the real required gates.
