import { Request, Response, NextFunction } from "express";
import { ServiceContainer } from "../services";
import { ValidationError } from "../errors/custom-errors";

export class EmailController {
  // 1. POST /api/v1/email/send-test
  static async sendTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { to, templateName, data } = req.body;

      if (!to || !templateName) {
        throw new ValidationError("Missing required fields: to, templateName");
      }

      await ServiceContainer.email.sendTemplate(to, templateName, data || {});

      res.status(200).json({
        success: true,
        message: `Test email sent to ${to} using template ${templateName}`,
      });
    } catch (error) {
      next(error);
    }
  }

  // 2. POST /api/v1/email/resend-verification
  static async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, token } = req.body;

      if (!email || !token) {
        throw new ValidationError("Missing required fields: email, token");
      }

      await ServiceContainer.email.sendVerification(email, token);

      res.status(200).json({
        success: true,
        message: `Verification email sent to ${email}`,
      });
    } catch (error) {
      next(error);
    }
  }

  // 3. POST /api/v1/email/send-password-reset
  static async sendPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, token } = req.body;

      if (!email || !token) {
        throw new ValidationError("Missing required fields: email, token");
      }

      await ServiceContainer.email.sendPasswordReset(email, token);

      res.status(200).json({
        success: true,
        message: `Password reset email sent to ${email}`,
      });
    } catch (error) {
      next(error);
    }
  }
}
