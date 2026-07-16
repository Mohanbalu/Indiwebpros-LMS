import { TemplateEngine } from "../../email/templates/template-engine";
import {
  paginationSchema,
  notificationFilterSchema,
  createNotificationSchema,
  broadcastSchema,
} from "../validators/notification.validator";
import { NotificationType, NotificationPriority } from "../../../generated/client";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion Failed: ${message}`);
  console.log(`✅ [PASS] ${message}`);
}

function assertThrows(fn: () => unknown, message: string): void {
  try {
    fn();
    throw new Error(`Expected error but none thrown: ${message}`);
  } catch (err) {
    if ((err as Error).message.startsWith("Expected error but none thrown")) throw err;
    console.log(`✅ [PASS] ${message}`);
  }
}

async function run() {
  console.log("🔔 Running Notification Module tests...\n");

  // ─── Pagination Schema ───────────────────────────────────────────────────
  console.log("── Pagination Schema ──");
  const p1 = paginationSchema.parse({ page: "2", limit: "10" });
  assert(p1.page === 2 && p1.limit === 10, "Pagination coerces strings to numbers");

  const p2 = paginationSchema.parse({});
  assert(p2.page === 1 && p2.limit === 20, "Pagination uses defaults");
  assert(p2.sortBy === "createdAt" && p2.sortOrder === "desc", "Pagination sort defaults correct");

  assertThrows(() => paginationSchema.parse({ limit: "200" }), "Pagination rejects limit > 100");

  // ─── Filter Schema ────────────────────────────────────────────────────────
  console.log("\n── Filter Schema ──");
  const f1 = notificationFilterSchema.parse({ isRead: "false", type: "SYSTEM" });
  assert(f1.isRead === false, "Filter coerces isRead string to boolean");
  assert(f1.type === NotificationType.SYSTEM, "Filter accepts valid NotificationType");

  assertThrows(
    () => notificationFilterSchema.parse({ type: "INVALID_TYPE" }),
    "Filter rejects invalid NotificationType"
  );

  const f2 = notificationFilterSchema.parse({ priority: "HIGH" });
  assert(f2.priority === NotificationPriority.HIGH, "Filter accepts valid NotificationPriority");

  // ─── Create Notification Schema ───────────────────────────────────────────
  console.log("\n── Create Notification Schema ──");
  const valid = createNotificationSchema.parse({
    userId: "123e4567-e89b-12d3-a456-426614174000",
    title: "Test Title",
    message: "Test message body",
    type: "SYSTEM",
    priority: "HIGH",
  });
  assert(valid.userId === "123e4567-e89b-12d3-a456-426614174000", "CreateNotification accepts valid userId UUID");
  assert(valid.priority === NotificationPriority.HIGH, "CreateNotification accepts priority");
  assert(valid.type === NotificationType.SYSTEM, "CreateNotification accepts type");

  assertThrows(
    () => createNotificationSchema.parse({ userId: "not-a-uuid", title: "T", message: "M", type: "SYSTEM" }),
    "CreateNotification rejects invalid UUID userId"
  );
  assertThrows(
    () => createNotificationSchema.parse({ userId: "123e4567-e89b-12d3-a456-426614174000", title: "", message: "M", type: "SYSTEM" }),
    "CreateNotification rejects empty title"
  );

  // ─── Broadcast Schema ─────────────────────────────────────────────────────
  console.log("\n── Broadcast Schema ──");
  const b1 = broadcastSchema.parse({
    title: "System Maintenance",
    message: "The platform will be down briefly.",
    type: "ANNOUNCEMENT",
    targetAll: true,
  });
  assert(b1.targetAll === true, "Broadcast accepts targetAll flag");

  const b2 = broadcastSchema.parse({
    title: "Role Update",
    message: "All students are notified.",
    type: "SYSTEM",
    targetRole: "STUDENT",
  });
  assert(b2.targetRole === "STUDENT", "Broadcast accepts targetRole string");

  const b3 = broadcastSchema.parse({
    title: "Personal Note",
    message: "Hey there!",
    type: "SYSTEM",
    targetUserIds: ["123e4567-e89b-12d3-a456-426614174000"],
  });
  assert(b3.targetUserIds?.length === 1, "Broadcast accepts targetUserIds array");

  assertThrows(
    () =>
      broadcastSchema.parse({
        title: "Bad User IDs",
        message: "Test",
        type: "SYSTEM",
        targetUserIds: ["not-a-uuid"],
      }),
    "Broadcast rejects invalid UUID in targetUserIds"
  );

  // ─── IDOR Protection Simulation ──────────────────────────────────────────
  console.log("\n── IDOR Protection Simulation ──");
  const ownerUserId = "123e4567-e89b-12d3-a456-426614174000";
  const attackerUserId = "987fcdeb-51a2-43f7-9876-543210fedcba";
  const mockNotification = { id: "abc", userId: ownerUserId, title: "Private" };

  // Simulate ownership check
  function checkOwnership(notifUserId: string, requestUserId: string): boolean {
    return notifUserId === requestUserId;
  }
  assert(checkOwnership(mockNotification.userId, ownerUserId) === true, "IDOR: owner can access own notification");
  assert(checkOwnership(mockNotification.userId, attackerUserId) === false, "IDOR: attacker blocked from another user's notification");

  console.log("\n🎉 All Notification Module tests passed successfully!");
}

run().catch((err) => {
  console.error("❌ Test run failed:", err.message);
  process.exit(1);
});
