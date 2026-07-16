import { z } from "zod";

export const generateCertificateSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  courseId: z.string().uuid("Invalid course ID"),
});

export const revokeCertificateSchema = z.object({
  reason: z.string().trim().min(5, "Revocation reason must be at least 5 characters"),
});

export const verificationCodeSchema = z.object({
  verificationCode: z.string().trim().min(32, "Verification code must be at least 32 characters"),
});

export type GenerateCertificateInput = z.infer<typeof generateCertificateSchema>;
export type RevokeCertificateInput = z.infer<typeof revokeCertificateSchema>;
