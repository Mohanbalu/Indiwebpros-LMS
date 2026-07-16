import { Router } from "express";
import { PurchaseController } from "../controllers/purchase.controller";
import { authGuard, authorize } from "@/middlewares/auth";
import rateLimit from "express-rate-limit";

const router = Router();
const rl = rateLimit({ windowMs: 60_000, max: 30 });

// Purchase Course
router.post("/", authGuard, rl, PurchaseController.createPurchase);

export default router;
