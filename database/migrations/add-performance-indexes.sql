-- ============================================================
-- IndiWebPros LMS — Performance Index Migrations
-- Milestone 24: Database Optimization
-- ============================================================
-- Apply via: psql $DATABASE_URL -f add-performance-indexes.sql
-- Or: npx prisma db execute --file add-performance-indexes.sql
-- ============================================================

BEGIN;

-- ── Enrollment Table Indexes ───────────────────────────────────────────────

-- Student's enrollments lookup (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollment_userId_status
  ON "Enrollment" ("userId", "status")
  WHERE "deletedAt" IS NULL;

-- Course-level enrollment count
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollment_courseId_status
  ON "Enrollment" ("courseId", "status")
  WHERE "deletedAt" IS NULL;

-- Expiry check for time-limited enrollments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollment_expiresAt
  ON "Enrollment" ("expiresAt")
  WHERE "expiresAt" IS NOT NULL AND "deletedAt" IS NULL;

-- Composite unique check (userId + courseId active enrollment)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollment_userId_courseId
  ON "Enrollment" ("userId", "courseId")
  WHERE "deletedAt" IS NULL;

-- ── Payment Table Indexes ──────────────────────────────────────────────────

-- User's payment history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_userId_status
  ON "Payment" ("userId", "status", "createdAt" DESC);

-- Provider transaction ID lookup (for webhook matching)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_transactionId
  ON "Payment" ("transactionId")
  WHERE "transactionId" IS NOT NULL;

-- Order ID lookup for Razorpay webhooks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_status_createdAt
  ON "Payment" ("status", "createdAt" DESC);

-- ── AuditLog Table Indexes ─────────────────────────────────────────────────

-- User audit trail
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auditLog_userId_action
  ON "AuditLog" ("userId", "action", "createdAt" DESC)
  WHERE "userId" IS NOT NULL;

-- Resource audit trail (find all audits for a specific resource)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auditLog_resource_resourceId
  ON "AuditLog" ("resource", "resourceId", "createdAt" DESC)
  WHERE "resourceId" IS NOT NULL;

-- Time-based audit queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auditLog_createdAt
  ON "AuditLog" ("createdAt" DESC);

-- ── Notification Table Indexes ─────────────────────────────────────────────

-- Unread notifications for a user (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_userId_isRead
  ON "Notification" ("userId", "isRead", "createdAt" DESC)
  WHERE "deletedAt" IS NULL;

-- ── CourseProgress Table Indexes ───────────────────────────────────────────

-- Student progress per lesson
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courseProgress_userId_lessonId
  ON "CourseProgress" ("userId", "lessonId");

-- Student progress per course (to calculate completion %)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courseProgress_userId_courseId
  ON "CourseProgress" ("userId", "courseId");

-- ── Course Table Indexes ───────────────────────────────────────────────────

-- Published courses listing (marketplace)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_status_createdAt
  ON "Course" ("status", "createdAt" DESC)
  WHERE "deletedAt" IS NULL;

-- Instructor's courses
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_instructorId_status
  ON "Course" ("instructorId", "status")
  WHERE "deletedAt" IS NULL;

-- Course slug lookup (used in routes)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_course_slug
  ON "Course" ("slug")
  WHERE "deletedAt" IS NULL;

-- ── User Table Indexes ─────────────────────────────────────────────────────

-- Email lookup (auth)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email
  ON "User" ("email")
  WHERE "deletedAt" IS NULL;

-- Role-based user listing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role_status
  ON "User" ("role", "status")
  WHERE "deletedAt" IS NULL;

-- ── PaymentAttempt Table Indexes ───────────────────────────────────────────

-- Payment attempts per payment
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_paymentAttempt_paymentId
  ON "PaymentAttempt" ("paymentId", "createdAt" DESC);

COMMIT;

-- ── Analyze tables after index creation ───────────────────────────────────
ANALYZE "Enrollment";
ANALYZE "Payment";
ANALYZE "AuditLog";
ANALYZE "Notification";
ANALYZE "CourseProgress";
ANALYZE "Course";
ANALYZE "User";
ANALYZE "PaymentAttempt";

-- Report index sizes
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
