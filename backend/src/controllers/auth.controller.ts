import { Request, Response, NextFunction } from "express";
import { AuthService } from "@/services/auth.service";
import { ResponseBuilder } from "@/utils/response-builder";
import { prisma } from "@/database/client";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/errors/custom-errors";
import { env } from "@/config/env";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? ("strict" as const) : ("lax" as const),
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: "/api/v1/auth",
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.register(req.body);
      ResponseBuilder.success(
        res,
        201,
        "Registration successful. Please check your email to verify your account."
      );
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userAgent = req.headers["user-agent"];
      const device = Array.isArray(userAgent) ? userAgent[0] : userAgent;
      const ipAddress = req.ip;

      const { accessToken, refreshToken, user } = await AuthService.login(
        req.body,
        device,
        ipAddress
      );

      res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
      ResponseBuilder.success(res, 200, "Login successful", { accessToken, user });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      if (refreshToken) {
        const userAgent = req.headers["user-agent"];
        const device = Array.isArray(userAgent) ? userAgent[0] : userAgent;
        await AuthService.logout(refreshToken, req.ip, device);
      }

      res.clearCookie("refreshToken", { ...COOKIE_OPTIONS, maxAge: 0 });
      ResponseBuilder.success(res, 200, "Logout successful");
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies.refreshToken || req.body.refreshToken;
      if (!token) {
        throw new UnauthorizedError("Refresh token is missing");
      }

      const userAgent = req.headers["user-agent"];
      const device = Array.isArray(userAgent) ? userAgent[0] : userAgent;
      const ipAddress = req.ip;

      const { accessToken, refreshToken } = await AuthService.refresh(token, device, ipAddress);

      res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
      ResponseBuilder.success(res, 200, "Token refreshed successfully", { accessToken });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.forgotPassword(req.body.email);
      ResponseBuilder.success(
        res,
        200,
        "If the email address exists, a password reset link has been sent."
      );
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.resetPassword(req.body);
      ResponseBuilder.success(res, 200, "Password has been reset successfully.");
    } catch (error) {
      next(error);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.query.token as string;
      if (!token) {
        throw new ValidationError("Verification token is missing");
      }

      await AuthService.verifyEmail(token);
      ResponseBuilder.success(res, 200, "Email verified successfully.");
    } catch (error) {
      next(error);
    }
  }

  static async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.resendVerification(req.body.email);
      ResponseBuilder.success(res, 200, "Verification email resent successfully.");
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Not authenticated");
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { role: true },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...userProfile } = user;
      ResponseBuilder.success(res, 200, "Current user profile fetched successfully", userProfile);
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Not authenticated");
      }

      await AuthService.changePassword(req.user.userId, req.body);

      res.clearCookie("refreshToken", { ...COOKIE_OPTIONS, maxAge: 0 });
      ResponseBuilder.success(res, 200, "Password changed successfully. Please log in again.");
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // DEVICE SESSIONS CONTROLLERS
  // ==========================================

  static async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Not authenticated");
      }
      const sessions = await AuthService.listSessions(req.user.userId);
      ResponseBuilder.success(res, 200, "Active sessions fetched successfully", sessions);
    } catch (error) {
      next(error);
    }
  }

  static async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Not authenticated");
      }
      const { id: sessionId } = req.params;
      if (!sessionId) {
        throw new ValidationError("Session ID is required");
      }
      await AuthService.revokeSession(sessionId as string, req.user.userId as string);
      ResponseBuilder.success(res, 200, "Session revoked successfully");
    } catch (error) {
      next(error);
    }
  }

  static async logoutAllDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Not authenticated");
      }
      await AuthService.logoutAllDevices(req.user.userId);
      res.clearCookie("refreshToken", { ...COOKIE_OPTIONS, maxAge: 0 });
      ResponseBuilder.success(res, 200, "Logged out of all devices successfully");
    } catch (error) {
      next(error);
    }
  }
}
