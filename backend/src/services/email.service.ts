import nodemailer from "nodemailer";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const url = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">Verify your email address</h2>
        <p style="color: #475569; font-size: 16px; line-height: 24px;">Thank you for registering at IndiWebPros LMS. Please click the button below to verify your email address and activate your account:</p>
        <div style="margin: 24px 0;">
          <a href="${url}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">Verify Email</a>
        </div>
        <p style="color: #94a3b8; font-size: 14px;">This link will expire in 24 hours. If you did not register for an account, please ignore this email.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: '"IndiWebPros LMS" <noreply@indiwebpros.com>',
        to: email,
        subject: "Verify Your Email Address - IndiWebPros LMS",
        html,
      });
      logger.info(`Verification email sent to ${email}`);
    } catch (error) {
      logger.error(error as Error, `Failed to send verification email to ${email}`);
      if (env.NODE_ENV !== "development" && env.SMTP_USER !== "mock_smtp_user") {
        throw error;
      }
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const url = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">Reset your password</h2>
        <p style="color: #475569; font-size: 16px; line-height: 24px;">You requested to reset your password. Please click the button below to proceed:</p>
        <div style="margin: 24px 0;">
          <a href="${url}" target="_blank" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #94a3b8; font-size: 14px;">This reset link will expire in 15 minutes. If you did not make this request, please secure your account.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: '"IndiWebPros LMS" <security@indiwebpros.com>',
        to: email,
        subject: "Reset Your Password - IndiWebPros LMS",
        html,
      });
      logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
      logger.error(error as Error, `Failed to send password reset email to ${email}`);
      if (env.NODE_ENV !== "development" && env.SMTP_USER !== "mock_smtp_user") {
        throw error;
      }
    }
  }
}

export const emailService = new EmailService();
