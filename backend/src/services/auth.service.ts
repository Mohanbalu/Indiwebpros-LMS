import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { prisma } from "@/database/client";
import { User, Session } from "@/generated/client";
import { emailService } from "./email.service";
import { UserAgentParser } from "@/utils/helpers";
import { AuditService } from "./audit.service";
import {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from "@/validators/auth.validator";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ForbiddenError,
} from "@/errors/custom-errors";

const SALT_ROUNDS = 12;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateRandomToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export class AuthService {
  static async register(input: RegisterInput): Promise<void> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ConflictError("Email address is already registered");
    }

    const role = await prisma.role.findUnique({
      where: { name: input.roleName },
    });

    if (!role) {
      throw new ValidationError(`Role [${input.roleName}] is invalid or not configured`);
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone || null,
        password: hashedPassword,
        roleId: role.id,
        isEmailVerified: false,
        status: "ACTIVE",
      },
    });

    // Generate Verification Token
    const rawToken = generateRandomToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Audit event
    await AuditService.log({
      userId: user.id,
      eventType: "SECURITY",
      action: "REGISTER",
      entity: "User",
      entityId: user.id,
      requestMethod: "POST",
      requestPath: "/api/v1/auth/register",
      statusCode: 201,
      success: true,
      metadata: { email: user.email },
    });

    // Send Verification Email
    await emailService.sendVerificationEmail(user.email, rawToken);
  }

  static async login(
    input: LoginInput,
    userAgentString?: string,
    ipAddress?: string
  ): Promise<{ accessToken: string; refreshToken: string; user: Omit<User, "password"> }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { role: true },
    });

    if (!user) {
      // Audit failed login
      await AuditService.log({
        eventType: "SECURITY",
        action: "LOGIN_FAILED",
        entity: "User",
        requestMethod: "POST",
        requestPath: "/api/v1/auth/login",
        statusCode: 401,
        success: false,
        ipAddress,
        userAgent: userAgentString,
        metadata: { email: input.email, reason: "User not found" },
      });
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.status !== "ACTIVE") {
      // Audit failed login (suspended/inactive)
      await AuditService.log({
        userId: user.id,
        eventType: "SECURITY",
        action: "LOGIN_FAILED",
        entity: "User",
        entityId: user.id,
        requestMethod: "POST",
        requestPath: "/api/v1/auth/login",
        statusCode: 403,
        success: false,
        ipAddress,
        userAgent: userAgentString,
        metadata: { email: input.email, reason: `Account status is ${user.status}` },
      });
      throw new ForbiddenError(`Your account status is ${user.status.toLowerCase()}`);
    }

    if (!user.isEmailVerified) {
      // Audit failed login (unverified)
      await AuditService.log({
        userId: user.id,
        eventType: "SECURITY",
        action: "LOGIN_FAILED",
        entity: "User",
        entityId: user.id,
        requestMethod: "POST",
        requestPath: "/api/v1/auth/login",
        statusCode: 403,
        success: false,
        ipAddress,
        userAgent: userAgentString,
        metadata: { email: input.email, reason: "Email unverified" },
      });
      throw new ForbiddenError("Please verify your email address before logging in");
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      // Audit failed login (bad credentials)
      await AuditService.log({
        userId: user.id,
        eventType: "SECURITY",
        action: "LOGIN_FAILED",
        entity: "User",
        entityId: user.id,
        requestMethod: "POST",
        requestPath: "/api/v1/auth/login",
        statusCode: 401,
        success: false,
        ipAddress,
        userAgent: userAgentString,
        metadata: { email: input.email, reason: "Incorrect password" },
      });
      throw new UnauthorizedError("Invalid email or password");
    }

    // Generate JWT access token
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role.name },
      env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Create session in database
    const uaInfo = UserAgentParser.parse(userAgentString);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        deviceName: uaInfo.deviceName,
        deviceType: uaInfo.deviceType,
        browser: uaInfo.browser,
        operatingSystem: uaInfo.operatingSystem,
        userAgent: userAgentString || null,
        ipAddress: ipAddress || null,
        expiresAt,
      },
    });

    // Generate Refresh Token
    const rawRefreshToken = generateRandomToken();
    const refreshTokenHash = hashToken(rawRefreshToken);

    await prisma.refreshToken.create({
      data: {
        sessionId: session.id,
        tokenHash: refreshTokenHash,
        expiresAt,
      },
    });

    // Audit successful login
    await AuditService.log({
      userId: user.id,
      eventType: "SECURITY",
      action: "LOGIN_SUCCESS",
      entity: "User",
      entityId: user.id,
      requestMethod: "POST",
      requestPath: "/api/v1/auth/login",
      statusCode: 200,
      success: true,
      ipAddress,
      userAgent: userAgentString,
      metadata: { sessionId: session.id },
    });

    // Strip password hash from profile return object
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userProfile } = user;

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: userProfile,
    };
  }

  static async refresh(
    rawRefreshToken: string,
    userAgentString?: string,
    ipAddress?: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = hashToken(rawRefreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        session: {
          include: {
            user: { include: { role: true } },
          },
        },
      },
    });

    // Invalidate session & potential reuse attack protection
    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date() || !storedToken.session.isActive) {
      if (storedToken) {
        // Reuse detection: Mark all active sessions & refresh tokens for this user as revoked/inactive
        const userId = storedToken.session.userId;
        await prisma.$transaction([
          prisma.refreshToken.updateMany({
            where: { session: { userId } },
            data: {
              isRevoked: true,
              revokedAt: new Date(),
              revokedReason: "REUSE_DETECTED",
            },
          }),
          prisma.session.updateMany({
            where: { userId },
            data: { isActive: false },
          }),
        ]);

        await AuditService.log({
          userId,
          eventType: "SECURITY",
          action: "TOKEN_REUSE_ATTACK",
          entity: "RefreshToken",
          entityId: storedToken.id,
          requestMethod: "POST",
          requestPath: "/api/v1/auth/refresh",
          statusCode: 401,
          success: false,
          ipAddress,
          userAgent: userAgentString,
          metadata: { reason: "Rotated token reuse attempt detected" },
        });
      }
      throw new UnauthorizedError("Invalid or expired refresh token session");
    }

    const session = storedToken.session;
    const user = session.user;

    if (user.status !== "ACTIVE") {
      throw new ForbiddenError("User account is no longer active");
    }

    // Invalidate/revoke used refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: "ROTATED",
        lastUsedAt: new Date(),
      },
    });

    // Update parent session last active status
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

    // Generate fresh tokens
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role.name },
      env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const newRawRefreshToken = generateRandomToken();
    const newRefreshTokenHash = hashToken(newRawRefreshToken);

    await prisma.refreshToken.create({
      data: {
        sessionId: session.id,
        tokenHash: newRefreshTokenHash,
        expiresAt: session.expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  static async logout(rawRefreshToken: string, ipAddress?: string, userAgentString?: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (storedToken) {
      await prisma.$transaction([
        prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: {
            isRevoked: true,
            revokedAt: new Date(),
            revokedReason: "LOGOUT",
          },
        }),
        prisma.session.update({
          where: { id: storedToken.sessionId },
          data: { isActive: false },
        }),
      ]);

      const session = await prisma.session.findUnique({
        where: { id: storedToken.sessionId },
      });

      if (session) {
        await AuditService.log({
          userId: session.userId,
          eventType: "SECURITY",
          action: "LOGOUT",
          entity: "Session",
          entityId: session.id,
          requestMethod: "POST",
          requestPath: "/api/v1/auth/logout",
          statusCode: 200,
          success: true,
          ipAddress,
          userAgent: userAgentString,
        });
      }
    }
  }

  static async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // User enumeration protection: do not leak if account exists
    if (!user) {
      return;
    }

    // Delete existing reset tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate Reset Token
    const rawToken = generateRandomToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Audit password reset request
    await AuditService.log({
      userId: user.id,
      eventType: "SECURITY",
      action: "PASSWORD_RESET_REQUEST",
      entity: "User",
      entityId: user.id,
      requestMethod: "POST",
      requestPath: "/api/v1/auth/forgot-password",
      statusCode: 200,
      success: true,
    });

    await emailService.sendPasswordResetEmail(user.email, rawToken);
  }

  static async resetPassword(input: ResetPasswordInput): Promise<void> {
    const tokenHash = hashToken(input.token);

    const storedToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new ValidationError("Invalid or expired password reset token");
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: storedToken.userId },
        data: { password: hashedPassword },
      }),
      // Revoke all active sessions and delete related refresh tokens
      prisma.refreshToken.updateMany({
        where: { session: { userId: storedToken.userId } },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: "PASSWORD_RESET",
        },
      }),
      prisma.session.updateMany({
        where: { userId: storedToken.userId },
        data: { isActive: false },
      }),
      // Delete the consumed reset token
      prisma.passwordResetToken.delete({
        where: { id: storedToken.id },
      }),
    ]);

    // Audit password reset completion
    await AuditService.log({
      userId: storedToken.userId,
      eventType: "SECURITY",
      action: "PASSWORD_RESET_COMPLETE",
      entity: "User",
      entityId: storedToken.userId,
      requestMethod: "POST",
      requestPath: "/api/v1/auth/reset-password",
      statusCode: 200,
      success: true,
    });
  }

  static async verifyEmail(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);

    const storedToken = await prisma.verificationToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new ValidationError("Invalid or expired email verification token");
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: storedToken.userId },
        data: { isEmailVerified: true },
      }),
      prisma.verificationToken.delete({
        where: { id: storedToken.id },
      }),
    ]);

    // Audit email verified
    await AuditService.log({
      userId: storedToken.userId,
      eventType: "SECURITY",
      action: "EMAIL_VERIFICATION",
      entity: "User",
      entityId: storedToken.userId,
      requestMethod: "GET",
      requestPath: "/api/v1/auth/verify-email",
      statusCode: 200,
      success: true,
    });
  }

  static async resendVerification(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundError("Email address is not registered");
    }

    if (user.isEmailVerified) {
      throw new ValidationError("Email address is already verified");
    }

    // Clear old tokens
    await prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate new token
    const rawToken = generateRandomToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Audit verification resent
    await AuditService.log({
      userId: user.id,
      eventType: "SECURITY",
      action: "EMAIL_VERIFICATION_RESEND",
      entity: "User",
      entityId: user.id,
      requestMethod: "POST",
      requestPath: "/api/v1/auth/resend-verification",
      statusCode: 200,
      success: true,
    });

    await emailService.sendVerificationEmail(user.email, rawToken);
  }

  static async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User account not found");
    }

    const isPasswordValid = await bcrypt.compare(input.oldPassword, user.password);
    if (!isPasswordValid) {
      throw new ValidationError("Incorrect current password provided");
    }

    const hashedPassword = await bcrypt.hash(input.newPassword, SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      }),
      // Revoke all active sessions and refresh tokens
      prisma.refreshToken.updateMany({
        where: { session: { userId } },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: "PASSWORD_CHANGED",
        },
      }),
      prisma.session.updateMany({
        where: { userId },
        data: { isActive: false },
      }),
    ]);

    // Audit password change
    await AuditService.log({
      userId,
      eventType: "SECURITY",
      action: "PASSWORD_CHANGED",
      entity: "User",
      entityId: userId,
      requestMethod: "POST",
      requestPath: "/api/v1/auth/change-password",
      statusCode: 200,
      success: true,
    });
  }

  // ==========================================
  // SESSION CONTEXT MANAGEMENT
  // ==========================================

  static async listSessions(userId: string): Promise<Session[]> {
    return prisma.session.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActiveAt: "desc" },
    });
  }

  static async revokeSession(sessionId: string, userId: string): Promise<void> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundError("Active session not found");
    }

    await prisma.$transaction([
      prisma.session.update({
        where: { id: sessionId },
        data: { isActive: false },
      }),
      prisma.refreshToken.updateMany({
        where: { sessionId },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: "REVOKED_BY_USER",
        },
      }),
    ]);

    await AuditService.log({
      userId,
      eventType: "SECURITY",
      action: "SESSION_REVOKED",
      entity: "Session",
      entityId: sessionId,
      requestMethod: "POST",
      requestPath: `/api/v1/auth/sessions/${sessionId}/revoke`,
      statusCode: 200,
      success: true,
    });
  }

  static async logoutAllDevices(userId: string): Promise<void> {
    await prisma.$transaction([
      prisma.session.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      }),
      prisma.refreshToken.updateMany({
        where: { session: { userId } },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: "LOGOUT_ALL_DEVICES",
        },
      }),
    ]);

    await AuditService.log({
      userId,
      eventType: "SECURITY",
      action: "LOGOUT_ALL_DEVICES",
      entity: "User",
      entityId: userId,
      requestMethod: "POST",
      requestPath: "/api/v1/auth/logout/all",
      statusCode: 200,
      success: true,
    });
  }
}
