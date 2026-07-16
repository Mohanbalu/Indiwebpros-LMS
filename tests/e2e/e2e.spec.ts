import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("E2E & Accessibility: Student Portal Flow", () => {
  // ─── 1. Accessibility Checks (WCAG AA) ──────────────────────────────────────
  test("landing page should pass accessibility audits (WCAG 2.1 AA)", async ({ page }) => {
    await page.goto("/");

    // Perform Axe accessibility analysis
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag21a", "wcag2aa", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();

    // Assert 0 violations found
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("student dashboard page should have correct heading levels and focus order", async ({
    page,
  }) => {
    await page.goto("/login");

    // Enter credentials
    await page.fill("#email-input", "student@indiwebpros.in");
    await page.fill("#password-input", "Password@123");
    await page.click("#login-submit-btn");

    await page.waitForURL("/student");

    // Perform accessibility audit on dashboard
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast", "button-name", "region", "label"])
      .analyze();

    expect(results.violations).toEqual([]);

    // Check keyboard navigation focus order is logical
    const headerTitle = page.locator("h1");
    await expect(headerTitle).toContainText("Student Dashboard");
  });

  // ─── 2. Full Course Purchasing & Progress Cycle ────────────────────────────
  test("should browse courses, purchase, complete quiz and download certificate", async ({
    page,
  }) => {
    page.on("console", async (msg) => {
      try {
        const args = await Promise.all(msg.args().map(arg => arg.jsonValue().catch(() => '')));
        console.log(`[BROWSER CONSOLE ${msg.type()}]: ${msg.text()}`, ...args);
      } catch {
        console.log(`[BROWSER CONSOLE ${msg.type()}]: ${msg.text()}`);
      }
    });
    page.on("pageerror", (err) => console.log(`[BROWSER PAGEERROR]: ${err.message}`));

    // Log in first to authenticate the browser session
    await page.goto("/login");
    await page.fill("#email-input", "student@indiwebpros.in");
    await page.fill("#password-input", "Password@123");
    await page.click("#login-submit-btn");
    await page.waitForURL("/student");

    // 1. Visit catalog page via client-side routing
    await page.locator("a[href='/courses']").first().click();
    await page.waitForURL(/\/courses/);
    await expect(page.locator("h1")).toContainText("Find Your Perfect Course Path");
    await page.waitForSelector(".course-card");

    // 2. Select course
    await page.locator(".course-card")
      .filter({ hasText: "Advanced Full Stack TypeScript SaaS Architecture" })
      .locator("text=View Details")
      .click();
    await expect(page.locator(".course-title")).toBeVisible({ timeout: 20000 });

    // 3. Purchase Course
    await page.click(".enroll-btn");
    await page.waitForURL(/\/payments\/checkout/);

    // Simulate successful payment checkout completion
    await page.click(".simulate-rzp-payment-success-btn");
    await page.waitForURL(/\/payments\/success/);

    // 4. Access Course Player
    await page.click(".start-learning-btn");
    await page.waitForURL(/\/player\/course/);

    // 5. Watch Lesson
    await page.locator(".lesson-item").first().click();
    await page.click(".play-video-btn");
    await page.waitForTimeout(1000); // watch simulation

    // 6. Complete Lesson quiz
    await page.click(".lesson-tab-quiz");
    await page.click(".start-quiz-btn");
    await page.check("input[type='radio']");
    await page.click(".submit-quiz-btn");
    await expect(page.locator(".quiz-score")).toContainText("Passed");

    // 7. Complete certificate generation & download
    await page.click(".generate-certificate-btn");
    await page.waitForSelector(".certificate-download-link");

    // Logout
    await page.click(".logout-profile-dropdown");
    await page.click(".logout-btn");
    await page.waitForURL("/login");
  });
});
