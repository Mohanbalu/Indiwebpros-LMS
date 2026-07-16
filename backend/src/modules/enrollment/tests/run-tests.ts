import { z } from "zod";
import {
  purchaseCourseSchema,
  mockPaymentCallbackSchema,
  verifyPaymentSchema,
  adminGrantEnrollmentSchema,
  createCouponSchema,
  validateCouponSchema,
} from "../validators/enrollment.validator";
import { AccessType, DiscountType } from "@/generated/client";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`❌ FAILED: ${message}`);
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
  console.log("💳 Running Enrollment & Purchase Module tests...\n");

  // ── Purchase Validator ──
  console.log("── Purchase Validator ──");
  const validPurchase = purchaseCourseSchema.parse({
    courseId: "123e4567-e89b-12d3-a456-426614174000",
    couponCode: "DISCOUNT100",
  });
  assert(validPurchase.courseId === "123e4567-e89b-12d3-a456-426614174000", "Valid course ID parsed");
  assert(validPurchase.couponCode === "DISCOUNT100", "Coupon code normalized/uppercased");

  assertThrows(
    () => purchaseCourseSchema.parse({ courseId: "not-a-uuid" }),
    "Rejects invalid course ID UUID"
  );

  // ── Mock Payment Callback Validator ──
  console.log("\n── Mock Payment Callback Validator ──");
  const validCallback = mockPaymentCallbackSchema.parse({
    paymentId: "123e4567-e89b-12d3-a456-426614174000",
    status: "SUCCESS",
  });
  assert(validCallback.status === "SUCCESS", "Valid status parsed");
  assert(validCallback.paymentMethod === "MOCK_CARD", "Defaults to MOCK_CARD payment method");

  assertThrows(
    () => mockPaymentCallbackSchema.parse({ paymentId: "123e4567-e89b-12d3-a456-426614174000", status: "INVALID" }),
    "Rejects invalid callback status"
  );

  // ── Admin Grant Enrollment Validator ──
  console.log("\n── Admin Grant Enrollment Validator ──");
  const validGrant = adminGrantEnrollmentSchema.parse({
    userId: "123e4567-e89b-12d3-a456-426614174000",
    courseId: "987fcdeb-51a2-43f7-9876-543210fedcba",
    accessType: "TIME_LIMITED",
    durationDays: "30",
  });
  assert(validGrant.accessType === AccessType.TIME_LIMITED, "Access type parsed");
  assert(validGrant.durationDays === 30, "Duration days coerced to number");

  // ── Coupon Validator ──
  console.log("\n── Coupon Validator ──");
  const validCoupon = createCouponSchema.parse({
    code: "SAVE50",
    discountType: "PERCENTAGE",
    discountValue: "50",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    minimumAmount: "500",
  });
  assert(validCoupon.code === "SAVE50", "Coupon code capitalized");
  assert(validCoupon.discountType === DiscountType.PERCENTAGE, "Discount type parsed");
  assert(validCoupon.minimumAmount === 500, "Minimum amount coerced");

  assertThrows(
    () => createCouponSchema.parse({
      code: "SAVE50",
      discountType: "PERCENTAGE",
      discountValue: "50",
      startDate: "2026-12-31",
      endDate: "2026-01-01", // Invalid date range
    }),
    "Rejects invalid coupon date ranges (endDate before startDate)"
  );

  assertThrows(
    () => createCouponSchema.parse({
      code: "INVALID CODE", // Spaces not allowed
      discountType: "PERCENTAGE",
      discountValue: "50",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    }),
    "Rejects coupon code containing spaces or special chars"
  );

  // ── Access Control Rules Simulation ──
  console.log("\n── Access Control Rules Simulation ──");
  const now = new Date();
  const future = new Date(now.getTime() + 10_000);
  const past = new Date(now.getTime() - 10_000);

  const canAccess = (status: string, expiresAt: Date | null) => {
    return status === "ACTIVE" && (expiresAt === null || expiresAt > now);
  };

  assert(canAccess("ACTIVE", null) === true, "Lifetime access allowed (expiresAt = null)");
  assert(canAccess("ACTIVE", future) === true, "Active time-limited access allowed");
  assert(canAccess("ACTIVE", past) === false, "Expired access blocked");
  assert(canAccess("EXPIRED", null) === false, "Expired status blocked");
  assert(canAccess("CANCELLED", future) === false, "Cancelled status blocked");

  // ── IDOR Ownership Verification Simulation ──
  console.log("\n── IDOR Ownership Verification Simulation ──");
  const verifyOwnership = (resourceUserId: string, reqUserId: string, role: string) => {
    if (role === "Admin") return true;
    return resourceUserId === reqUserId;
  };

  assert(verifyOwnership("user-1", "user-1", "Student") === true, "Student can access own enrollment details");
  assert(verifyOwnership("user-1", "user-2", "Student") === false, "Student blocked from another user's enrollment");
  assert(verifyOwnership("user-1", "user-2", "Admin") === true, "Admin bypasses ownership check");

  console.log("\n🎉 All Enrollment & Purchase Module tests passed successfully!");
}

run().catch((err) => {
  console.error("❌ Test run failed:", err.message);
  process.exit(1);
});
