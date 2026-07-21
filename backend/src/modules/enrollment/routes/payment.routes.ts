import { Router } from "express";
import { PurchaseController } from "../controllers/purchase.controller";
import { authGuard, authorize } from "@/middlewares/auth";
import rateLimit from "express-rate-limit";

const router = Router();
const rl = rateLimit({ windowMs: 60_000, max: 30 });

// ==========================================
// NOTE: Razorpay webhook route is mounted in app.ts
// BEFORE express.json() to preserve raw body for
// HMAC signature verification. See app.ts.
// ==========================================

// ==========================================
// Razorpay Payment Flow
// ==========================================

/** POST /payments/razorpay/create-order  → Create Razorpay order (authenticated) */
router.post("/razorpay/create-order", authGuard, rl, PurchaseController.createRazorpayOrder);

/** POST /payments/razorpay/verify        → Verify Razorpay signature (authenticated) */
router.post("/razorpay/verify", authGuard, rl, PurchaseController.verifyRazorpayPayment);

// ==========================================
// Legacy / Mock Payment Flow
// ==========================================

/** POST /payments/mock        → Mock callback for test/dev */
router.post("/mock", authGuard, rl, PurchaseController.mockPaymentCallback);

/** POST /payments/verify      → Generic verify (legacy compatibility) */
router.post("/verify", authGuard, rl, PurchaseController.verifyPayment);

/** POST /payments/refund      → Admin-only refund */
router.post("/refund", authGuard, authorize(["Admin"]), rl, PurchaseController.refundPayment);

/** GET  /payments/history     → Student's own payment history */
router.get("/history", authGuard, rl, PurchaseController.getPaymentHistory);

/** GET  /payments/invoice/:id → Invoice data for a payment */
router.get("/invoice/:id", authGuard, rl, PurchaseController.getInvoice);

/** GET  /payments/:id         → Get payment details */
router.get("/:id", authGuard, rl, PurchaseController.getPaymentDetails);

// ==========================================
// Coupon Endpoints
// ==========================================

/** POST /payments/coupons               → Admin: create coupon */
router.post("/coupons", authGuard, authorize(["Admin"]), rl, PurchaseController.createCoupon);

/** GET  /payments/coupons               → Admin: list all coupons */
router.get("/coupons", authGuard, authorize(["Admin"]), rl, PurchaseController.listCoupons);

/** POST /payments/coupons/validate      → Validate coupon for a course */
router.post("/coupons/validate", authGuard, rl, PurchaseController.validateCoupon);

export default router;
