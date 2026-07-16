import { Request, Response, NextFunction } from "express";
import { certificateService } from "../services/certificate.service";
import { prisma } from "@/database/client";
import { ValidationError, ForbiddenError, NotFoundError } from "@/errors/custom-errors";
import {
  generateCertificateSchema,
  revokeCertificateSchema,
  verificationCodeSchema,
} from "../validators/certificate.validator";

export class CertificateController {
  static async verifyCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = verificationCodeSchema.safeParse(req.params);
      if (!parsed.success) throw new ValidationError("Invalid verification code parameter", parsed.error.errors);

      const verification = await certificateService.verifyCertificate(parsed.data.verificationCode);
      res.json({ success: true, data: verification });
    } catch (e) { next(e); }
  }

  static async getMyCertificates(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const certificates = await prisma.certificate.findMany({
        where: { userId },
        include: { course: { select: { id: true, title: true } }, pdfFile: true },
        orderBy: { issuedAt: "desc" },
      });

      res.json({ success: true, data: certificates });
    } catch (e) { next(e); }
  }

  static async getCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.userId;
      const role = req.user!.role;

      const cert = await prisma.certificate.findUnique({
        where: { id },
        include: { course: true, user: { select: { firstName: true, lastName: true } }, pdfFile: true, qrCodeFile: true },
      });

      if (!cert) throw new NotFoundError("Certificate not found");

      if (role !== "Admin" && cert.userId !== userId) {
        // Check if instructor owns the course
        if (role === "Instructor") {
          const course = await prisma.course.findUnique({ where: { id: cert.courseId } });
          if (!course || course.instructorId !== userId) {
            throw new ForbiddenError("You are not authorized to view this certificate");
          }
        } else {
          throw new ForbiddenError("You are not authorized to view this certificate");
        }
      }

      res.json({ success: true, data: cert });
    } catch (e) { next(e); }
  }

  static async generateCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = generateCertificateSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid manual certificate request payload", parsed.error.errors);

      const issuerId = req.user!.userId;
      const cert = await certificateService.generateCertificate(parsed.data.userId, parsed.data.courseId, issuerId);

      res.status(201).json({ success: true, data: cert });
    } catch (e) { next(e); }
  }

  static async regenerateCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const adminId = req.user!.userId;

      const cert = await certificateService.regenerateCertificate(id, adminId);
      res.json({ success: true, data: cert });
    } catch (e) { next(e); }
  }

  static async revokeCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const parsed = revokeCertificateSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid revocation description", parsed.error.errors);

      const adminId = req.user!.userId;
      const cert = await certificateService.revokeCertificate(id, parsed.data.reason, adminId);

      res.json({ success: true, data: cert });
    } catch (e) { next(e); }
  }

  static async downloadCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.userId;
      const role = req.user!.role;

      const signedUrl = await certificateService.getSignedDownloadUrl(id, userId, role);
      res.json({ success: true, downloadUrl: signedUrl });
    } catch (e) { next(e); }
  }
}
