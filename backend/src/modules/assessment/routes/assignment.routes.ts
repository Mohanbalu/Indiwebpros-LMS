import { Router } from "express";
import { AssignmentController } from "../controllers/assignment.controller";
import { authGuard, authorize } from "@/middlewares/auth";
import rateLimit from "express-rate-limit";

const router = Router();
const readRl = rateLimit({ windowMs: 60_000, max: 120 });
const writeRl = rateLimit({ windowMs: 60_000, max: 60 });
const instructorOrAdmin = authorize(["Admin", "Instructor"]);

router.use(authGuard);

// Student actions
router.post("/submissions", writeRl, AssignmentController.submitSubmission);
router.get("/submissions/:submissionId", readRl, AssignmentController.getSubmission);

// Instructor actions
router.post("/submissions/:submissionId/review", instructorOrAdmin, writeRl, AssignmentController.reviewSubmission);
router.get("/:id/submissions", instructorOrAdmin, readRl, AssignmentController.listSubmissions);

// Assignment CRUD
router.post("/", instructorOrAdmin, writeRl, AssignmentController.createAssignment);
router.get("/:id", readRl, AssignmentController.getAssignment);
router.put("/:id", instructorOrAdmin, writeRl, AssignmentController.updateAssignment);
router.delete("/:id", instructorOrAdmin, writeRl, AssignmentController.deleteAssignment);

export default router;
