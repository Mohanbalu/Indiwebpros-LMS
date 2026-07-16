import { Router } from "express";
import { CourseController } from "../controllers/course.controller";
import { ModuleController } from "../controllers/module.controller";
import { LessonController } from "../controllers/lesson.controller";
import { LessonResourceController } from "../controllers/lesson-resource.controller";
import { CourseMetaController } from "../controllers/course-meta.controller";
import { authGuard, authorize } from "@/middlewares/auth";
import rateLimit from "express-rate-limit";

const router = Router();
const readRl = rateLimit({ windowMs: 60_000, max: 120 });
const writeRl = rateLimit({ windowMs: 60_000, max: 30 });

const canManage = authorize(["Admin", "Instructor"]);

// ── Courses ──────────────────────────────────────────────────────────────────
router.get("/",               readRl, authGuard, CourseController.getAll);
router.get("/slug/:slug",     readRl, CourseController.getBySlug);
router.get("/:id",            readRl, authGuard, CourseController.getById);
router.post("/",              writeRl, authGuard, canManage, CourseController.create);
router.put("/:id",            writeRl, authGuard, canManage, CourseController.update);
router.patch("/:id/publish",  writeRl, authGuard, canManage, CourseController.publish);
router.patch("/:id/archive",  writeRl, authGuard, canManage, CourseController.archive);
router.post("/:id/duplicate", writeRl, authGuard, authorize(["Admin"]), CourseController.duplicate);
router.delete("/:id",         writeRl, authGuard, authorize(["Admin"]), CourseController.delete);

// ── Modules (nested under course) ─────────────────────────────────────────
router.get("/:courseId/modules",              readRl, authGuard, ModuleController.getByCourse);
router.post("/:courseId/modules",             writeRl, authGuard, canManage, ModuleController.create);
router.patch("/:courseId/modules/reorder",    writeRl, authGuard, canManage, ModuleController.reorder);
router.put("/modules/:id",                    writeRl, authGuard, canManage, ModuleController.update);
router.delete("/modules/:id",                 writeRl, authGuard, canManage, ModuleController.delete);

// ── Lessons (nested under module) ─────────────────────────────────────────
router.post("/modules/:moduleId/lessons",          writeRl, authGuard, canManage, LessonController.create);
router.patch("/modules/:moduleId/lessons/reorder", writeRl, authGuard, canManage, LessonController.reorder);
router.put("/lessons/:id",                         writeRl, authGuard, canManage, LessonController.update);
router.patch("/lessons/:id/publish",               writeRl, authGuard, canManage, LessonController.publish);
router.delete("/lessons/:id",                      writeRl, authGuard, canManage, LessonController.delete);

// ── Lesson Resources ──────────────────────────────────────────────────────
router.get("/lessons/:lessonId/resources",    readRl, authGuard, LessonResourceController.getByLesson);
router.post("/lessons/:lessonId/resources",   writeRl, authGuard, canManage, LessonResourceController.create);
router.delete("/resources/:id",               writeRl, authGuard, canManage, LessonResourceController.delete);

// ── Course Meta ────────────────────────────────────────────────────────────
// FAQs
router.get("/:courseId/faqs",         readRl, authGuard, CourseMetaController.listFAQs);
router.post("/:courseId/faqs",        writeRl, authGuard, canManage, CourseMetaController.createFAQ);
router.put("/faqs/:id",               writeRl, authGuard, canManage, CourseMetaController.updateFAQ);
router.delete("/faqs/:id",            writeRl, authGuard, canManage, CourseMetaController.deleteFAQ);
// Requirements
router.get("/:courseId/requirements",     readRl, authGuard, CourseMetaController.listRequirements);
router.post("/:courseId/requirements",    writeRl, authGuard, canManage, CourseMetaController.createRequirement);
router.delete("/requirements/:id",        writeRl, authGuard, canManage, CourseMetaController.deleteRequirement);
// Outcomes
router.get("/:courseId/outcomes",     readRl, authGuard, CourseMetaController.listOutcomes);
router.post("/:courseId/outcomes",    writeRl, authGuard, canManage, CourseMetaController.createOutcome);
router.delete("/outcomes/:id",        writeRl, authGuard, canManage, CourseMetaController.deleteOutcome);
// Tags
router.get("/:courseId/tags",         readRl, authGuard, CourseMetaController.listTags);
router.post("/:courseId/tags",        writeRl, authGuard, canManage, CourseMetaController.addTag);
router.delete("/:courseId/tags/:tagId", writeRl, authGuard, canManage, CourseMetaController.removeTag);

export default router;
