import { Router } from "express";
import multer from "multer";
import { ProfileController } from "@/modules/dashboard/controllers/profile.controller";
import { authGuard } from "@/middlewares/auth";
import rateLimit from "express-rate-limit";

const router = Router();
const readRl = rateLimit({ windowMs: 60_000, max: 120 });
const upload = multer({ storage: multer.memoryStorage() });

router.use(authGuard);

router.get("/", readRl, ProfileController.getProfileData);
router.put("/", ProfileController.updateProfileSettings);
router.post("/wishlist", ProfileController.toggleWishlist);

// Image Upload Endpoints (Avatar & Cover)
router.post("/avatar", upload.single("avatar"), ProfileController.uploadAvatar);
router.post("/cover", upload.single("cover"), ProfileController.uploadCover);

export default router;
