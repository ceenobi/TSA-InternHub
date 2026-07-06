import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "app"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./app/test/setup.ts"],
    include: ["app/**/*.test.{ts,tsx}", "app/**/__tests__/*.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/build/**",
      "**/e2e/**",
    ],
    css: { modules: { classNameStrategy: "non-scoped" } },
    singleFork: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["app/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.*",
        "**/__tests__/**",
        "**/types.d.ts",
        "app/entry.client.tsx",
        "app/root.tsx",
        "app/routes.ts",
        "**/.server/**",
      ],
    },
  },
});
