# Security Policy

## Supported Versions

We actively support the latest stable version of TSA InternHub. Security
issues should be reported privately via email to
[security@tsa-internhub.example](mailto:security@tsa-internhub.example).

## Reporting Security Issues

Please do NOT disclose security vulnerabilities publicly. Instead, email
[security@tsa-internhub.example](mailto:security@tsa-internhub.example) with
details of the issue. We appreciate your responsible disclosure.

The project maintainers will:

1. Acknowledge receipt of the report within 48 hours
2. Evaluate the severity and impact of the issue
3. Provide a timely fix or mitigation
4. Credit the reporter in the release notes (unless they request to remain
   anonymous)

## Secure Development Practices

- All server actions validate permissions via `hasPermission(role, "MANAGE_*")`
- Input validation using Zod schemas
- Rate limiting on all API endpoints
- Environment variables for secrets (BETTER_AUTH_URL, CLIENT_URL, QSTASH_URL, QSTASH_TOKEN)
- TypeScript type safety throughout
- Dependencies kept up to date via `yarn audit`

## Preferred Languages

Report security issues in English, including:
- Component/feature name
- Steps to reproduce
- Expected vs. actual behavior
- Any stack traces or error messages
- Browser/OS environment

## Scope

This policy covers the TSA InternHub web application, its APIs, and
associated infrastructure. It does not cover third-party services
integrated into the platform (e.g., Cloudinary, Upstash, Better Auth)
beyond the project's control.

## Contact

For security issues: [security@tsa-internhub.example](mailto:security@tsa-internhub.example)