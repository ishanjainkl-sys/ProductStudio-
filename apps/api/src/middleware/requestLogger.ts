import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers["x-request-id"] as string) || randomUUID();
  res.setHeader("x-request-id", requestId);
  (req as Request & { requestId: string }).requestId = requestId;
  const start = Date.now();
  res.on("finish", () => {
    const userId = (req as Request & { user?: { id: string } }).user?.id ?? null;
    console.log(
      JSON.stringify({
        requestId,
        userId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - start,
      }),
    );
  });
  next();
}
