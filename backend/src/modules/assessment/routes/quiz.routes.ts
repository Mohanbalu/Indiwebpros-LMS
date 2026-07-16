import { Router } from "express";
import { QuizController } from "../controllers/quiz.controller";
import { authGuard, authorize } from "@/middlewares/auth";
import rateLimit from "express-rate-limit";

const router = Router();
const readRl = rateLimit({ windowMs: 60_000, max: 120 });
const writeRl = rateLimit({ windowMs: 60_000, max: 60 });
const instructorOrAdmin = authorize(["Admin", "Instructor"]);

router.use(authGuard);

// Student attempt actions
router.post("/attempts/start", writeRl, QuizController.startAttempt);
router.get("/attempts/:attemptId/resume", readRl, QuizController.resumeAttempt);
router.post("/attempts/:attemptId/submit", writeRl, QuizController.submitAttempt);
router.get("/attempts/:attemptId/result", readRl, QuizController.getAttemptResults);

// Quiz CRUD
router.post("/", instructorOrAdmin, writeRl, QuizController.createQuiz);
router.get("/:id", readRl, QuizController.getQuiz);
router.put("/:id", instructorOrAdmin, writeRl, QuizController.updateQuiz);
router.delete("/:id", instructorOrAdmin, writeRl, QuizController.deleteQuiz);

// Questions CRUD
router.post("/:quizId/questions", instructorOrAdmin, writeRl, QuizController.addQuestion);
router.put("/questions/:id", instructorOrAdmin, writeRl, QuizController.updateQuestion);
router.delete("/questions/:id", instructorOrAdmin, writeRl, QuizController.deleteQuestion);

// Options CRUD
router.post("/questions/:questionId/options", instructorOrAdmin, writeRl, QuizController.addOption);
router.put("/options/:id", instructorOrAdmin, writeRl, QuizController.updateOption);
router.delete("/options/:id", instructorOrAdmin, writeRl, QuizController.deleteOption);

// Manual grading
router.post("/answers/:answerId/grade", instructorOrAdmin, writeRl, QuizController.gradeAnswer);

export default router;
