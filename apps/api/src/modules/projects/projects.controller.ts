import type { Request, Response, NextFunction } from "express";
import {
  createProjectSchema,
  paginationSchema,
  updateProjectSchema,
} from "@productstudio/shared-schemas";
import * as service from "./projects.service.js";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const q = paginationSchema.parse(req.query);
    const result = await service.listProjects(req.user!.id, q);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function recentlyDeleted(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.listRecentlyDeleted(req.user!.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createProjectSchema.parse(req.body);
    const result =
      body.source === "blank"
        ? await service.createBlankProject(req.user!.id, body)
        : await service.createProjectFromTemplate(req.user!.id, body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getProject((req.params.id as string), req.user!.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateProjectSchema.parse(req.body);
    const data = await service.updateProject((req.params.id as string), req.user!.id, body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.softDeleteProject((req.params.id as string), req.user!.id);
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
}

export async function restore(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.restoreProject((req.params.id as string), req.user!.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}
