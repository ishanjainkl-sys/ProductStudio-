import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { DomainError } from "../lib/errors.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request body failed schema validation",
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof DomainError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? {},
      },
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Unexpected server error",
    },
  });
}
