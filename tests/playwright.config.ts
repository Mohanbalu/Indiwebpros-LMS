import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { outputFolder: "../playwright-report" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Desktop Viewports
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox-desktop",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit-desktop",
      use: { ...devices["Desktop Safari"] },
    },
    // Mobile Viewports
    {
      name: "chrome-mobile",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "safari-mobile",
      use: { ...devices["iPhone 12"] },
    },
    // Tablet Viewport
    {
      name: "safari-tablet",
      use: { ...devices["iPad Mini"] },
    },
  ],
});
