# IndiWebPros LMS Enterprise Testing Platform

This workspace package provides the complete testing automation pipeline for the IndiWebPros LMS.

---

## 1. Directory Structure

```
tests/
├── unit/               # Unit testing of middlewares, helper functions, and validators
├── integration/        # Integration testing of auth, registration, courses, and certificates
├── api/                # API route level requests (GET, POST, PUT, DELETE) using Supertest
├── security/           # OWASP-focused security vulnerability and RBAC boundary verification
├── e2e/                # Playwright End-to-End browser workflow simulator
├── performance/        # k6 load testing configurations
├── mocks/              # External service mock definitions (S3, SES, CloudWatch, Razorpay)
├── fixtures/           # Static test data structures (payload templates)
├── factories/          # Programmatic user and course object generators
├── helpers/            # Database cleaner, auth request wrappers
├── tsconfig.json       # TypeScript workspace options with monorepo path mapping
├── vitest.config.ts    # Vitest testing engine options & coverage thresholds
└── playwright.config.ts # Cross-browser viewport test configuration
```

---

## 2. Test Execution Command Guide

Use `pnpm` workspace filters from the root to run specific test categories:

```bash
# Run unit tests only
pnpm --filter tests test:unit

# Run integration tests only
pnpm --filter tests test:integration

# Run API endpoint tests only
pnpm --filter tests test:api

# Run security vulnerability tests only
pnpm --filter tests test:security

# Run all Vitest suites and check coverage targets
pnpm --filter tests test:coverage

# Run Playwright E2E browser tests (cross-browser desktop/mobile)
pnpm --filter tests test:e2e
```

---

## 3. Testing Strategy

### Database Isolation

A dedicated PostgreSQL test database is used. The `DbHelper` module handles cleaning up table entries in order of constraint dependency after each test run, ensuring 100% state isolation without data contamination.

### Mocking Strategy

External integrations (Amazon Simple Email Service, Simple Storage Service, CloudWatch telemetry, Razorpay SDK) are fully mocked inside `tests/mocks/` to eliminate network dependencies and slow execution speeds.

### Security Testing

The `security/` test suite covers key OWASP criteria:

- **JWT Hijacking Protection**: Rejects `none` algorithm headers and expired signatures.
- **RBAC Enforcement**: Validates that students cannot trigger admin dashboards or create courses.
- **IDOR Protection**: Validates resource ownership checks on private URLs.
- **Input Sanitization**: Verifies handling of SQL Injection attempts.
- **Webhook Verifier**: Rejects payment webhooks that lack proper SHA256 HMAC headers.

### E2E and Accessibility Audit

Playwright simulates complete browser interactions on Desktop Chrome, Firefox, Safari, and Mobile Viewports.

- **Axe Auditing**: `@axe-core/playwright` runs WCAG 2.1 AA audits on all main landing and student dashboard pages, ensuring zero violations.

### Performance Load Testing

The `performance/load-test.js` script is structured for direct consumption by `k6`. It ramps up virtual users, targets public/private endpoints, and asserts response thresholds (`p95 < 500ms`, error rate `< 1%`).
