import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { UnauthorizedError, ForbiddenError } from "@/errors/custom-errors";
import { prisma } from "@/database/client";

export interface TokenPayload {
  userId: string;
  role: string;
}

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export async function authGuard(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication token is missing or malformed");
    }

    const token = authHeader.split(" ")[1];
    let decoded: TokenPayload;

    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    } catch {
      throw new UnauthorizedError("Invalid or expired authentication token");
    }

    // Verify user exists and status is ACTIVE
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedError("Authenticated user no longer exists");
    }

    if (user.status !== "ACTIVE") {
      throw new ForbiddenError(`User account is ${user.status.toLowerCase()}`);
    }

    req.user = {
      userId: user.id,
      role: user.role.name,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User is not authenticated");
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError("You do not have permission to access this resource");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
