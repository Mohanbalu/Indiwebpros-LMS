import { Router } from "express";
import { CertificateController } from "../controllers/certificate.controller";
import { authGuard, authorize } from "@/middlewares/auth";
import rateLimit from "express-rate-limit";

const router = Router();
const readRl = rateLimit({ windowMs: 60_000, max: 120 });
const writeRl = rateLimit({ windowMs: 60_000, max: 60 });
const adminGuard = authorize(["Admin"]);

// 1. Public endpoint (NO AUTH required)
router.get("/verify/:verificationCode", readRl, CertificateController.verifyCertificate);

// 2. Private endpoints (AUTH required)
router.use(authGuard);

router.get("/my", readRl, CertificateController.getMyCertificates);
router.get("/:id", readRl, CertificateController.getCertificate);
router.get("/:id/download", readRl, CertificateController.downloadCertificate);
router.post("/generate-student", writeRl, CertificateController.generateStudentCertificate);

// Admin-only endpoints
router.post("/generate", adminGuard, writeRl, CertificateController.generateCertificate);
router.post("/:id/regenerate", adminGuard, writeRl, CertificateController.regenerateCertificate);
router.post("/:id/revoke", adminGuard, writeRl, CertificateController.revokeCertificate);

export default router;
