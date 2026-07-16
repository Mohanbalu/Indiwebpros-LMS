import { Router } from "express";
import multer from "multer";
import { StorageController } from "@/controllers/storage.controller";
import { authGuard } from "@/middlewares/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Apply authGuard on all storage endpoints to protect private assets
router.use(authGuard);

router.post("/upload", upload.single("file"), StorageController.upload);
router.post("/upload-url", StorageController.getUploadUrl);
router.get("/download-url/:fileId", StorageController.getDownloadUrl);
router.delete("/:fileId", StorageController.delete);

// Multipart upload flows
router.post("/multipart/start", StorageController.startMultipart);
router.post("/multipart/part", upload.single("part"), StorageController.uploadPart);
router.post("/multipart/complete", StorageController.completeMultipart);
router.post("/multipart/abort", StorageController.abortMultipart);

export default router;
