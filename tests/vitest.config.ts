import { defineConfig } from "vitest/config";
import path from "path";
import dotenv from "dotenv";

// Load test environment variables before anything else
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 30000,
    setupFiles: [path.resolve(__dirname, "./helpers/setup.ts")],
    alias: {
      "@": path.resolve(__dirname, "../backend/src"),
      "@backend": path.resolve(__dirname, "../backend/src"),
      "@frontend": path.resolve(__dirname, "../frontend/src"),
    },
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**", "**/playwright.config.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "json-summary"],
      thresholds: {
        statements: 95,
        branches: 90,
        functions: 95,
        lines: 95,
      },
    },
  },
});
