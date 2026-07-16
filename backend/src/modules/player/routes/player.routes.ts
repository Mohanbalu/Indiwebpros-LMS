import { Router } from "express";
import { CoursePlayerController } from "../controllers/player.controller";
import { authGuard } from "@/middlewares/auth";
import rateLimit from "express-rate-limit";

const router = Router();
const readRl = rateLimit({ windowMs: 60_000, max: 120 });
const writeRl = rateLimit({ windowMs: 60_000, max: 60 });

// Access control enforced via authGuard
router.use(authGuard);

router.get("/course/:courseId", readRl, CoursePlayerController.getCourseStructure);
router.get("/lesson/:lessonId", readRl, CoursePlayerController.getLessonDetails);
router.post("/lesson/download/:resourceId", writeRl, CoursePlayerController.trackDownload);

// Progress patches
router.patch("/video-progress", writeRl, CoursePlayerController.updateVideoProgress);
router.patch("/pdf-progress", writeRl, CoursePlayerController.updatePdfProgress);
router.patch("/article-progress", writeRl, CoursePlayerController.updateArticleProgress);

router.get("/resume", readRl, CoursePlayerController.getResumeLearning);

// Bookmarks
router.get("/bookmarks", readRl, CoursePlayerController.listBookmarks);
router.post("/bookmarks", writeRl, CoursePlayerController.addBookmark);
router.delete("/bookmarks/:id", writeRl, CoursePlayerController.removeBookmark);

// Notes
router.get("/notes", readRl, CoursePlayerController.listNotes);
router.post("/notes", writeRl, CoursePlayerController.createNote);
router.put("/notes/:id", writeRl, CoursePlayerController.updateNote);
router.delete("/notes/:id", writeRl, CoursePlayerController.deleteNote);

export default router;
