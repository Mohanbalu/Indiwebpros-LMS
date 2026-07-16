import { Request, Response, NextFunction } from "express";
import { NotFoundError } from "@/errors/custom-errors";

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError("Requested API resource not found"));
}
