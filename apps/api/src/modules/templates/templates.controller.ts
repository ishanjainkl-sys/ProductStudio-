import type { Request, Response, NextFunction } from "express";
import { createTemplateSchema } from "@productstudio/shared-schemas";
import * as service from "./templates.service.js";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.listTemplates();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function versions(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.listVersions((req.params.id as string));
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function saveAsTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createTemplateSchema.parse(req.body);
    const data = await service.createTemplateFromProject(
      (req.params.projectId as string),
      req.user!.id,
      body,
    );
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
}
