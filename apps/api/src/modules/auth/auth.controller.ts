import type { Request, Response, NextFunction } from "express";
import { loginSchema } from "@productstudio/shared-schemas";
import { verifyAccessToken, verifyRefreshToken } from "@productstudio/auth";
import { loadEnv } from "../../config/env.js";
import * as authService from "./auth.service.js";
import { tokenConfig } from "../../middleware/requireAuth.js";

function setAuthCookies(
  res: Response,
  access: { token: string; expiresAt: Date },
  refresh: { token: string; expiresAt: Date },
) {
  const env = loadEnv();
  const common = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    path: "/",
  };
  res.cookie("ps_access", access.token, {
    ...common,
    sameSite: "lax",
    expires: access.expiresAt,
  });
  res.cookie("ps_refresh", refresh.token, {
    ...common,
    sameSite: "strict",
    expires: refresh.expiresAt,
  });
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body.email, body.password);
    setAuthCookies(res, result.access, result.refresh);
    res.json({ data: { user: result.user } });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const config = tokenConfig();
    let accessJti: string | undefined;
    let refreshJti: string | undefined;
    try {
      if (req.cookies?.ps_access) {
        accessJti = (await verifyAccessToken(req.cookies.ps_access, config)).jti;
      }
    } catch {
      /* ignore */
    }
    try {
      if (req.cookies?.ps_refresh) {
        refreshJti = (await verifyRefreshToken(req.cookies.ps_refresh, config)).jti;
      }
    } catch {
      /* ignore */
    }
    await authService.logout(accessJti, refreshJti);
    res.clearCookie("ps_access", { path: "/" });
    res.clearCookie("ps_refresh", { path: "/" });
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json({ data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.updateProfile(req.user!.id, req.body);
    res.json({ data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.ps_refresh as string | undefined;
    if (!token) {
      res.status(401).json({
        error: { code: "UNAUTHENTICATED", message: "Missing refresh token" },
      });
      return;
    }
    const result = await authService.refreshSession(token);
    setAuthCookies(res, result.access, result.refresh);
    res.json({ data: { user: result.user } });
  } catch (err) {
    next(err);
  }
}

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export async function uploadAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "No file provided" } });
      return;
    }
    const file = req.file;
    const env = loadEnv();
    const avatarDir = path.join(env.UPLOAD_DIR, "avatars");
    await fs.mkdir(avatarDir, { recursive: true });

    // Create random filename
    const ext = path.extname(file.originalname) || ".png";
    const filename = `${req.user!.id}_${crypto.randomBytes(8).toString("hex")}${ext}`;
    const filePath = path.join(avatarDir, filename);
    await fs.writeFile(filePath, file.buffer);

    const url = `/uploads/avatars/${filename}`;
    const user = await authService.updateAvatar(req.user!.id, url);
    res.json({ data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function removeAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.updateAvatar(req.user!.id, null);
    res.json({ data: { user } });
  } catch (err) {
    next(err);
  }
}
