import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
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
