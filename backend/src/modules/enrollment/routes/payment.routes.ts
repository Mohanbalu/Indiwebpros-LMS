import { Router, Request, Response, NextFunction } from "express";
import { PurchaseController } from "../controllers/purchase.controller";
import { authGuard, authorize } from "@/middlewares/auth";
import rateLimit from "express-rate-limit";
import express from "express";

const router = Router();
const rl = rateLimit({ windowMs: 60_000, max: 30 });

// ==========================================
// Razorpay Webhook — MUST be before express.json()
// Raw body capture middleware only for this route
// ==========================================

router.post(
  "/razorpay/webhook",
  express.raw({ type: "application/json" }),
  (req: Request, _res: Response, next: NextFunction) => {
    // Capture raw body string for HMAC signature verification
    (req as any).rawBody = req.body.toString("utf8");
    next();
  },
  PurchaseController.razorpayWebhook
);

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
