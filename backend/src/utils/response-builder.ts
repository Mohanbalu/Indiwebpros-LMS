import { Response } from "express";

export interface SuccessResponse<T> {
  success: true;
  message: string;
  data?: T;
}

export interface FailureResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: unknown[];
  timestamp: string;
}

export class ResponseBuilder {
  static success<T>(res: Response, statusCode = 200, message = "Success", data?: T): Response {
    const payload: SuccessResponse<T> = {
      success: true,
      message,
    };
    if (data !== undefined) {
      payload.data = data;
    }
    return res.status(statusCode).json(payload);
  }

  static failure(
    res: Response,
    statusCode = 500,
    message = "An error occurred",
    errors: unknown[] = []
  ): Response {
    const payload: FailureResponse = {
      success: false,
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(payload);
  }
}
