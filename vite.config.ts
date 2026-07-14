import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

export default defineConfig(async (env) => {
  const plugins = [
    tailwindcss(),
    reactRouter(),
  ];

  if (process.env.SENTRY_AUTH_TOKEN && env.command === "build") {
    const { sentryReactRouter } = await import("@sentry/react-router");
    plugins.push(...await sentryReactRouter(
      { sourceMapsUploadOptions: { enabled: true } },
      env,
    ));
  }

  plugins.push(visualizer({
    filename: "build/stats.html",
    gzipSize: true,
    brotliSize: true,
    open: true,
  }));

  return {
    plugins,
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
  };
});
