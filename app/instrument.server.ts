import * as Sentry from "@sentry/react-router";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "",
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV || "development",
  enabled: !!process.env.SENTRY_DSN && process.env.NODE_ENV === "production",
});
