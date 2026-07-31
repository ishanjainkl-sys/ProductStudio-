import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken, type TokenConfig } from "@productstudio/auth";
import { loadEnv } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { UnauthenticatedError } from "../lib/errors.js";
import { toApiRole } from "../lib/roles.js";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId?: string;
    }
  }
}

function tokenConfig(): TokenConfig {
  const env = loadEnv();
  return {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtlMinutes: env.ACCESS_TOKEN_TTL_MINUTES,
    refreshTtlDays: env.REFRESH_TOKEN_TTL_DAYS,
  };
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.ps_access as string | undefined;
    if (!token) throw new UnauthenticatedError();

    const payload = await verifyAccessToken(token, tokenConfig());
    const revoked = await prisma.revokedToken.findUnique({ where: { tokenId: payload.jti } });
    if (revoked) throw new UnauthenticatedError("Session revoked");

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthenticatedError();

    req.user = {
      id: user.id,
      email: user.email,
      role: toApiRole(user.role),
    };
    next();
  } catch (err) {
    next(err instanceof UnauthenticatedError ? err : new UnauthenticatedError());
  }
}

export function csrfGuard(req: Request, _res: Response, next: NextFunction): void {
  const safe = new Set(["GET", "HEAD", "OPTIONS"]);
  if (safe.has(req.method)) {
    next();
    return;
  }
  // Same-origin defense-in-depth (spec §34 CSRF)
  if (req.get("X-ProductStudio-Client") !== "web") {
    next(new UnauthenticatedError("CSRF check failed"));
    return;
  }
  next();
}

export { tokenConfig };
