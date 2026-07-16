# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> E2E & Accessibility: Student Portal Flow >> should browse courses, purchase, complete quiz and download certificate
- Location: e2e\e2e.spec.ts:45:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('.play-video-btn')

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - banner [ref=e5]:
    - generic [ref=e6]:
      - link "Exit Player" [ref=e7] [cursor=pointer]:
        - /url: /student
        - img [ref=e8]
        - text: Exit Player
      - heading "Advanced Full Stack TypeScript SaaS Architecture" [level=1] [ref=e11]
    - button "U" [ref=e14] [cursor=pointer]
  - generic [ref=e15]:
    - generic [ref=e17]:
      - generic [ref=e18]:
        - heading "Course Curriculum" [level=3] [ref=e19]
        - generic [ref=e20]:
          - img [ref=e21]
          - textbox "Search lessons..." [ref=e24]
      - generic [ref=e26]:
        - button "Introduction to Enterprise Prisma & PostgreSQL setups 0 / 2 Lessons completed" [ref=e27] [cursor=pointer]:
          - generic [ref=e28]:
            - heading "Introduction to Enterprise Prisma & PostgreSQL setups" [level=4] [ref=e29]
            - generic [ref=e30]: 0 / 2 Lessons completed
          - img [ref=e31]
        - generic [ref=e33]:
          - 'button "Lesson 1: Introduction to database connection pool 15 mins" [active] [ref=e34] [cursor=pointer]':
            - img [ref=e36]
            - generic [ref=e38]:
              - generic [ref=e39]: "Lesson 1: Introduction to database connection pool"
              - generic [ref=e41]: 15 mins
          - 'button "Lesson 2: Setting up foreign key constraints and index models 25 mins" [disabled] [ref=e42]':
            - img [ref=e44]
            - generic [ref=e47]:
              - generic [ref=e48]: "Lesson 2: Setting up foreign key constraints and index models"
              - generic [ref=e50]: 25 mins
    - generic [ref=e51]:
      - generic [ref=e52]:
        - generic [ref=e53]:
          - generic [ref=e54]:
            - 'heading "Lesson 1: Introduction to database connection pool" [level=2] [ref=e55]'
            - generic [ref=e56]: "Type: VIDEO | Duration: 15 mins"
          - button [ref=e57] [cursor=pointer]:
            - img [ref=e58]
        - generic [ref=e60]:
          - button "Previous Lesson" [disabled]
          - button "Next Lesson" [disabled]
        - generic [ref=e61]:
          - button "Overview" [ref=e62] [cursor=pointer]
          - button "Resources" [ref=e63] [cursor=pointer]
          - button "Notes" [ref=e64] [cursor=pointer]
          - button "Bookmarks" [ref=e65] [cursor=pointer]
          - button "Curriculum Quiz" [ref=e66] [cursor=pointer]
        - generic [ref=e68]:
          - heading "About this segment" [level=3] [ref=e69]
          - paragraph [ref=e70]: No description provided for this lesson segment.
      - generic [ref=e71]:
        - generic [ref=e72]:
          - heading "Overall Progress" [level=3] [ref=e73]
          - generic [ref=e74]:
            - generic [ref=e75]: 0%
            - generic [ref=e76]: 0 / 0 Lessons
        - generic [ref=e78]:
          - heading "Course Details" [level=4] [ref=e79]
          - generic [ref=e80]:
            - generic [ref=e81]:
              - generic [ref=e82]: "Pathway Status:"
              - generic [ref=e83]: In Progress
            - generic [ref=e84]:
              - generic [ref=e85]: "Certificate status:"
              - generic [ref=e86]: Locked (Complete lessons)
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import AxeBuilder from "@axe-core/playwright";
  3   | 
  4   | test.describe("E2E & Accessibility: Student Portal Flow", () => {
  5   |   // ─── 1. Accessibility Checks (WCAG AA) ──────────────────────────────────────
  6   |   test("landing page should pass accessibility audits (WCAG 2.1 AA)", async ({ page }) => {
  7   |     await page.goto("/");
  8   | 
  9   |     // Perform Axe accessibility analysis
  10  |     const accessibilityScanResults = await new AxeBuilder({ page })
  11  |       .withTags(["wcag2a", "wcag21a", "wcag2aa", "wcag21aa"])
  12  |       .disableRules(["color-contrast"])
  13  |       .analyze();
  14  | 
  15  |     // Assert 0 violations found
  16  |     expect(accessibilityScanResults.violations).toEqual([]);
  17  |   });
  18  | 
  19  |   test("student dashboard page should have correct heading levels and focus order", async ({
  20  |     page,
  21  |   }) => {
  22  |     await page.goto("/login");
  23  | 
  24  |     // Enter credentials
  25  |     await page.fill("#email-input", "student@indiwebpros.in");
  26  |     await page.fill("#password-input", "Password@123");
  27  |     await page.click("#login-submit-btn");
  28  | 
  29  |     await page.waitForURL("/student");
  30  | 
  31  |     // Perform accessibility audit on dashboard
  32  |     const results = await new AxeBuilder({ page })
  33  |       .withTags(["wcag2a", "wcag2aa"])
  34  |       .disableRules(["color-contrast", "button-name", "region", "label"])
  35  |       .analyze();
  36  | 
  37  |     expect(results.violations).toEqual([]);
  38  | 
  39  |     // Check keyboard navigation focus order is logical
  40  |     const headerTitle = page.locator("h1");
  41  |     await expect(headerTitle).toContainText("Student Dashboard");
  42  |   });
  43  | 
  44  |   // ─── 2. Full Course Purchasing & Progress Cycle ────────────────────────────
  45  |   test("should browse courses, purchase, complete quiz and download certificate", async ({
  46  |     page,
  47  |   }) => {
  48  |     page.on("console", async (msg) => {
  49  |       try {
  50  |         const args = await Promise.all(msg.args().map(arg => arg.jsonValue().catch(() => '')));
  51  |         console.log(`[BROWSER CONSOLE ${msg.type()}]: ${msg.text()}`, ...args);
  52  |       } catch {
  53  |         console.log(`[BROWSER CONSOLE ${msg.type()}]: ${msg.text()}`);
  54  |       }
  55  |     });
  56  |     page.on("pageerror", (err) => console.log(`[BROWSER PAGEERROR]: ${err.message}`));
  57  | 
  58  |     // Log in first to authenticate the browser session
  59  |     await page.goto("/login");
  60  |     await page.fill("#email-input", "student@indiwebpros.in");
  61  |     await page.fill("#password-input", "Password@123");
  62  |     await page.click("#login-submit-btn");
  63  |     await page.waitForURL("/student");
  64  | 
  65  |     // 1. Visit catalog page via client-side routing
  66  |     await page.locator("a[href='/courses']").first().click();
  67  |     await page.waitForURL(/\/courses/);
  68  |     await expect(page.locator("h1")).toContainText("Find Your Perfect Course Path");
  69  |     await page.waitForSelector(".course-card");
  70  | 
  71  |     // 2. Select course
  72  |     await page.locator(".course-card")
  73  |       .filter({ hasText: "Advanced Full Stack TypeScript SaaS Architecture" })
  74  |       .locator("text=View Details")
  75  |       .click();
  76  |     await expect(page.locator(".course-title")).toBeVisible({ timeout: 20000 });
  77  | 
  78  |     // 3. Purchase Course
  79  |     await page.click(".enroll-btn");
  80  |     await page.waitForURL(/\/payments\/checkout/);
  81  | 
  82  |     // Simulate successful payment checkout completion
  83  |     await page.click(".simulate-rzp-payment-success-btn");
  84  |     await page.waitForURL(/\/payments\/success/);
  85  | 
  86  |     // 4. Access Course Player
  87  |     await page.click(".start-learning-btn");
  88  |     await page.waitForURL(/\/player\/course/);
  89  | 
  90  |     // 5. Watch Lesson
  91  |     await page.locator(".lesson-item").first().click();
> 92  |     await page.click(".play-video-btn");
      |                ^ Error: page.click: Test timeout of 60000ms exceeded.
  93  |     await page.waitForTimeout(1000); // watch simulation
  94  | 
  95  |     // 6. Complete Lesson quiz
  96  |     await page.click(".lesson-tab-quiz");
  97  |     await page.click(".start-quiz-btn");
  98  |     await page.check("input[type='radio']");
  99  |     await page.click(".submit-quiz-btn");
  100 |     await expect(page.locator(".quiz-score")).toContainText("Passed");
  101 | 
  102 |     // 7. Complete certificate generation & download
  103 |     await page.click(".generate-certificate-btn");
  104 |     await page.waitForSelector(".certificate-download-link");
  105 | 
  106 |     // Logout
  107 |     await page.click(".logout-profile-dropdown");
  108 |     await page.click(".logout-btn");
  109 |     await page.waitForURL("/login");
  110 |   });
  111 | });
  112 | 
```