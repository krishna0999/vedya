import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { prerenderTemplates } from "./scripts/prerender";

// @schema resolves to the shared source of truth in backend/src/schema.
// server.fs.allow must include the repo root so Vite may serve those files.
export default defineConfig({
  plugins: [vue(), prerenderTemplates()],
  resolve: {
    alias: {
      "@schema": fileURLToPath(
        new URL("../backend/src/schema/index.ts", import.meta.url),
      ),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    fs: { allow: [fileURLToPath(new URL("..", import.meta.url))] },
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
});
