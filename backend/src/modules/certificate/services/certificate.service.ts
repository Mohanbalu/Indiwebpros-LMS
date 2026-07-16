import { prisma } from "@/database/client";
import {
  Certificate,
  CertificateStatus,
  EnrollmentStatus,
} from "@/generated/client";
import { NotFoundError, ForbiddenError, ValidationError } from "@/errors/custom-errors";
import {
  CertificateNotEligibleException,
  CertificateAlreadyExistsException,
  CertificateRevokedException,
  VerificationFailedException,
} from "../errors/certificate-exceptions";
import { ServiceContainer } from "@/services/shared/service-container";
import crypto from "crypto";
import { generateQrBuffer } from "../helpers/qr.helper";
import { generateCertificatePdfBuffer } from "../helpers/pdf.helper";

export class CertificateService {
  async checkEligibility(userId: string, courseId: string): Promise<boolean> {
    // 1. Enrollment status is ACTIVE
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        status: EnrollmentStatus.ACTIVE,
        deletedAt: null,
      },
    });

    if (!enrollment) {
      throw new CertificateNotEligibleException("No active enrollment found for this student");
    }

    if (enrollment.expiresAt !== null && enrollment.expiresAt < new Date()) {
      throw new CertificateNotEligibleException("Enrollment has expired");
    }

    // 2. Learning progress completion percentage is 100%
    const progress = await prisma.learningProgress.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (!progress || progress.progressPercentage < 100.0) {
      throw new CertificateNotEligibleException("Course completion percentage is less than 100%");
    }

    // 3. Required quizzes must be passed
    const quizzes = await prisma.quiz.findMany({
      where: { courseId, status: "PUBLISHED", deletedAt: null },
    });

    for (const quiz of quizzes) {
      const passedAttempt = await prisma.quizAttempt.findFirst({
        where: {
          quizId: quiz.id,
          userId,
          passed: true,
          status: "SUBMITTED",
        },
      });

      if (!passedAttempt) {
        throw new CertificateNotEligibleException(`Required quiz "${quiz.title}" has not been passed`);
      }
    }

    return true;
  }

  async generateCertificate(userId: string, courseId: string, issuerId?: string): Promise<Certificate> {
    // Check if duplicate exists
    const existing = await prisma.certificate.findFirst({
      where: { userId, courseId },
    });

    if (existing) {
      throw new CertificateAlreadyExistsException();
    }

    // Check eligibility
    await this.checkEligibility(userId, courseId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!user || !course) {
      throw new NotFoundError("Student or course not found");
    }

    // Generate certificate number: IWP-2026-FS-00001234
    const count = await prisma.certificate.count();
    const certificateNumber = `IWP-2026-FS-${String(count + 1).padStart(8, "0")}`;

    // Cryptographically secure verification code (32 chars min)
    const verificationCode = crypto.randomBytes(16).toString("hex"); // 32 characters hex
    const verificationUrl = `https://learn.indiwebpros.in/verify/${verificationCode}`;

    // Generate QR code buffer
    const qrBuffer = await generateQrBuffer(verificationUrl);

    // Format Completion Date
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Generate PDF buffer
    const pdfBuffer = await generateCertificatePdfBuffer({
      studentName: `${user.firstName} ${user.lastName}`,
      courseName: course.title,
      completionDate: formattedDate,
      certificateNumber,
      verificationUrl,
      qrCodeBuffer: qrBuffer,
      issueDate: formattedDate,
      verificationCode,
      version: 1,
    });

    return prisma.$transaction(async (tx) => {
      // S3 QR Upload
      const qrKey = `certificates/qr-${verificationCode}.png`;
      const qrUpload = await ServiceContainer.storage.upload(qrBuffer, qrKey, { contentType: "image/png" });
      const qrFile = await tx.file.create({
        data: {
          name: `qr-${verificationCode}.png`,
          originalName: `qr-${verificationCode}.png`,
          mimeType: "image/png",
          extension: ".png",
          size: qrBuffer.length,
          bucket: qrUpload.bucket as string,
          key: qrKey,
          url: `https://${qrUpload.bucket}.s3.amazonaws.com/${qrKey}`,
          uploadedBy: userId,
        },
      });

      // S3 PDF Upload
      const pdfKey = `certificates/cert-${verificationCode}.pdf`;
      const pdfUpload = await ServiceContainer.storage.upload(pdfBuffer, pdfKey, { contentType: "application/pdf" });
      const pdfFile = await tx.file.create({
        data: {
          name: `cert-${verificationCode}.pdf`,
          originalName: `cert-${verificationCode}.pdf`,
          mimeType: "application/pdf",
          extension: ".pdf",
          size: pdfBuffer.length,
          bucket: pdfUpload.bucket as string,
          key: pdfKey,
          url: `https://${pdfUpload.bucket}.s3.amazonaws.com/${pdfKey}`,
          uploadedBy: userId,
        },
      });

      // Write Certificate
      const cert = await tx.certificate.create({
        data: {
          userId,
          courseId,
          certificateNumber,
          verificationCode,
          verificationUrl,
          qrCodeFileId: qrFile.id,
          pdfFileId: pdfFile.id,
          generatedBy: issuerId ?? null,
          version: 1,
          status: CertificateStatus.GENERATED,
        },
        include: {
          pdfFile: true,
          qrCodeFile: true,
        },
      });

      // Audit Log
      try {
        await ServiceContainer.audit.log({
          userId: issuerId ?? userId,
          action: "CERTIFICATE_GENERATED",
          resource: "Certificate",
          resourceId: cert.id,
          details: { certificateNumber, version: 1 },
          status: "SUCCESS",
        });
      } catch {}

      // Notifications
      try {
        await ServiceContainer.notification.create({
          userId,
          title: "Certificate Issued! 🎓",
          message: `Congratulations! Your official certificate for "${course.title}" is ready.`,
          type: "CERTIFICATE" as any,
          priority: "HIGH" as any,
        });

        // Email Notification
        await ServiceContainer.email.send(
          user.email,
          `Certificate Ready: ${course.title}`,
          `<p>Congratulations ${user.firstName}!</p>
           <p>Your official completion credential for <b>${course.title}</b> is ready for download.</p>
           <p>Certificate Number: <b>${certificateNumber}</b></p>
           <p>You can verify your credential at: <a href="${verificationUrl}">${verificationUrl}</a></p>`
        );
      } catch {}

      return cert;
    });
  }

  async regenerateCertificate(certificateId: string, adminId: string): Promise<Certificate> {
    const cert = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: { user: true, course: true },
    });

    if (!cert) throw new NotFoundError("Certificate not found");
    if (cert.status === CertificateStatus.REVOKED) {
      throw new CertificateRevokedException("Cannot regenerate a revoked certificate");
    }

    const user = cert.user;
    const course = cert.course;
    const nextVersion = cert.version + 1;

    // Regenerate QR Code URL (points to verification page)
    const verificationUrl = `https://learn.indiwebpros.in/verify/${cert.verificationCode}`;
    const qrBuffer = await generateQrBuffer(verificationUrl);

    // Format Completion Date
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Generate new PDF buffer with updated version/signatures
    const pdfBuffer = await generateCertificatePdfBuffer({
      studentName: `${user.firstName} ${user.lastName}`,
      courseName: course.title,
      completionDate: formattedDate,
      certificateNumber: cert.certificateNumber,
      verificationUrl,
      qrCodeBuffer: qrBuffer,
      issueDate: formattedDate,
      verificationCode: cert.verificationCode,
      version: nextVersion,
    });

    return prisma.$transaction(async (tx) => {
      // Re-upload QR Code File
      const qrKey = `certificates/qr-${cert.verificationCode}-v${nextVersion}.png`;
      const qrUpload = await ServiceContainer.storage.upload(qrBuffer, qrKey, { contentType: "image/png" });
      const qrFile = await tx.file.create({
        data: {
          name: `qr-${cert.verificationCode}-v${nextVersion}.png`,
          originalName: `qr-${cert.verificationCode}-v${nextVersion}.png`,
          mimeType: "image/png",
          extension: ".png",
          size: qrBuffer.length,
          bucket: qrUpload.bucket as string,
          key: qrKey,
          url: `https://${qrUpload.bucket}.s3.amazonaws.com/${qrKey}`,
          uploadedBy: user.id,
        },
      });

      // Re-upload PDF
      const pdfKey = `certificates/cert-${cert.verificationCode}-v${nextVersion}.pdf`;
      const pdfUpload = await ServiceContainer.storage.upload(pdfBuffer, pdfKey, { contentType: "application/pdf" });
      const pdfFile = await tx.file.create({
        data: {
          name: `cert-${cert.verificationCode}-v${nextVersion}.pdf`,
          originalName: `cert-${cert.verificationCode}-v${nextVersion}.pdf`,
          mimeType: "application/pdf",
          extension: ".pdf",
          size: pdfBuffer.length,
          bucket: pdfUpload.bucket as string,
          key: pdfKey,
          url: `https://${pdfUpload.bucket}.s3.amazonaws.com/${pdfKey}`,
          uploadedBy: user.id,
        },
      });

      // Update certificate details
      const updated = await tx.certificate.update({
        where: { id: certificateId },
        data: {
          qrCodeFileId: qrFile.id,
          pdfFileId: pdfFile.id,
          version: nextVersion,
          status: CertificateStatus.REGENERATED,
        },
        include: { pdfFile: true, qrCodeFile: true },
      });

      // Audit Log
      try {
        await ServiceContainer.audit.log({
          userId: adminId,
          action: "CERTIFICATE_REGENERATED",
          resource: "Certificate",
          resourceId: cert.id,
          details: { version: nextVersion },
          status: "SUCCESS",
        });
      } catch {}

      // Notification
      try {
        await ServiceContainer.notification.create({
          userId: cert.userId,
          title: "Certificate Updated 🔄",
          message: `Your certificate for "${course.title}" has been updated to version ${nextVersion}.0.`,
          type: "CERTIFICATE" as any,
          priority: "NORMAL" as any,
        });
      } catch {}

      return updated;
    });
  }

  async revokeCertificate(certificateId: string, reason: string, adminId: string): Promise<Certificate> {
    const cert = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: { course: true, user: true },
    });

    if (!cert) throw new NotFoundError("Certificate not found");

    const updated = await prisma.certificate.update({
      where: { id: certificateId },
      data: { status: CertificateStatus.REVOKED },
    });

    try {
      await ServiceContainer.audit.log({
        userId: adminId,
        action: "CERTIFICATE_REVOKED",
        resource: "Certificate",
        resourceId: certificateId,
        details: { reason },
        status: "SUCCESS",
      });
    } catch {}

    try {
      await ServiceContainer.notification.create({
        userId: cert.userId,
        title: "Certificate Revoked ⚠️",
        message: `Your certificate for "${cert.course.title}" has been revoked by the administrator.`,
        type: "CERTIFICATE" as any,
        priority: "CRITICAL" as any,
      });

      await ServiceContainer.email.send(
        cert.user.email,
        `Certificate Revocation Notification`,
        `<p>Notice: Your certificate with ID <b>${cert.certificateNumber}</b> has been revoked by the Administrator due to: ${reason}.</p>`
      );
    } catch {}

    return updated;
  }

  async verifyCertificate(verificationCode: string) {
    const cert = await prisma.certificate.findUnique({
      where: { verificationCode },
      include: {
        user: { select: { firstName: true, lastName: true } },
        course: { select: { title: true } },
      },
    });

    if (!cert) throw new VerificationFailedException();

    try {
      await ServiceContainer.audit.log({
        userId: "anonymous",
        action: "CERTIFICATE_VERIFIED",
        resource: "Certificate",
        resourceId: cert.id,
        details: { certificateNumber: cert.certificateNumber, status: cert.status },
        status: "SUCCESS",
      });
    } catch {}

    return {
      isValid: cert.status !== CertificateStatus.REVOKED && cert.status !== CertificateStatus.EXPIRED,
      studentName: `${cert.user.firstName} ${cert.user.lastName}`,
      courseName: cert.course.title,
      status: cert.status,
      issuedAt: cert.issuedAt,
    };
  }

  async getSignedDownloadUrl(certificateId: string, userId: string, role: string): Promise<string> {
    const cert = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: { pdfFile: true },
    });

    if (!cert) throw new NotFoundError("Certificate not found");

    if (role !== "Admin" && cert.userId !== userId) {
      throw new ForbiddenError("You do not have permission to download this certificate");
    }

    if (!cert.pdfFile) {
      throw new NotFoundError("Certificate PDF file is missing");
    }

    const signedUrl = await ServiceContainer.storage.getSignedDownloadUrl(cert.pdfFile.key);

    try {
      await ServiceContainer.audit.log({
        userId,
        action: "CERTIFICATE_DOWNLOADED",
        resource: "Certificate",
        resourceId: certificateId,
        details: {},
        status: "SUCCESS",
      });
    } catch {}

    return signedUrl;
  }
}

export const certificateService = new CertificateService();
