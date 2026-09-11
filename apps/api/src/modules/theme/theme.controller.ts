import type { Request, Response, NextFunction } from "express";
import { updateThemeSchema, updateProjectSchema } from "@productstudio/shared-schemas";
import * as service from "./theme.service.js";

export async function getTheme(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getTheme((req.params.projectId as string), req.user!.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function patchTheme(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateThemeSchema.parse(req.body);
    const data = await service.updateTheme((req.params.projectId as string), req.user!.id, body.tokens);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getSettings((req.params.projectId as string), req.user!.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function patchSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateProjectSchema.parse(req.body);
    const data = await service.updateSettings((req.params.projectId as string), req.user!.id, body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}
