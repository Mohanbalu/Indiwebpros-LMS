import { Request, Response, NextFunction } from "express";
import { IDGenerator } from "@/utils/helpers";

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export function requestId(req: Request, res: Response, next: NextFunction) {
  const reqId = req.header("x-request-id") || IDGenerator.uuid();
  req.id = reqId;
  res.setHeader("x-request-id", reqId);
  next();
}
