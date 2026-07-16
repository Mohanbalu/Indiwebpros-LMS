import { RequestHandler } from "express";
import { z } from "zod";

// Authentication placeholder
export const authPlaceholder: RequestHandler = (_req, _res, next) => {
  // Placeholder: Verify authorization tokens in future milestones
  next();
};

// Role authorization placeholder
export function rolePlaceholder(_allowedRoles: string[]): RequestHandler {
  return (_req, _res, next) => {
    // Placeholder: Match user credentials role against allowedRoles
    next();
  };
}

// Schema validation wrapper
export function validateSchema(schema: z.ZodSchema): RequestHandler {
  return (req, _res, next) => {
    // Attempt direct body parse first (since auth validator schemas are defined as plain objects)
    let result = schema.safeParse(req.body);
    if (!result.success) {
      // Fallback: check if the schema expects the wrapped request structure
      const wrappedResult = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (wrappedResult.success) {
        result = wrappedResult;
      }
    }

    if (!result.success) {
      next(result.error);
    } else {
      next();
    }
  };
}
