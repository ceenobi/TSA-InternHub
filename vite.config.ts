import { reactRouter } from "@react-router/dev/vite";
import { sentryReactRouter } from "@sentry/react-router";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

export default defineConfig(async () => ({
  plugins: [
    tailwindcss(),
    reactRouter(),
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [...await sentryReactRouter({ sourceMapsUploadOptions: { enabled: true } }, { command: 'build', mode: 'production' })]
      : []),
    visualizer({
      filename: "build/stats.html",
      gzipSize: true,
      brotliSize: true,
      open: true,
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    host: "localhost",
    port: 3700,
    open: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "::1",
      "salmon-daring-partially.ngrok-free.app",
    ],
  },
});
