import { Router } from "express";
import { CategoryController } from "../controllers/category.controller";
import { authGuard, authorize } from "@/middlewares/auth";
import rateLimit from "express-rate-limit";

const router = Router();
const rl = rateLimit({ windowMs: 60_000, max: 60 });

// Public
router.get("/", rl, CategoryController.getAll);
router.get("/:id", rl, CategoryController.getById);

// Admin only
router.post("/", authGuard, authorize(["Admin"]), CategoryController.create);
router.put("/:id", authGuard, authorize(["Admin"]), CategoryController.update);
router.delete("/:id", authGuard, authorize(["Admin"]), CategoryController.delete);

export default router;
