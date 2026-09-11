import type { Request, Response, NextFunction } from "express";
import {
  createPageSchema,
  savePageSchema,
  updatePageSchema,
  exportPageSchema,
} from "@productstudio/shared-schemas";
import { z } from "zod";
import * as service from "./pages.service.js";
import * as exportService from "../export/export.service.js";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.listPages((req.params.projectId as string), req.user!.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createPageSchema.parse(req.body);
    const data = await service.createPage((req.params.projectId as string), req.user!.id, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getPage((req.params.id as string), req.user!.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updatePageSchema.parse(req.body);
    const data = await service.updatePage((req.params.id as string), req.user!.id, body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function save(req: Request, res: Response, next: NextFunction) {
  try {
    const body = savePageSchema.parse(req.body);
    const data = await service.savePage(
      (req.params.id as string),
      req.user!.id,
      body.contentJson as never,
      body.expectedVersion,
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function duplicate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.duplicatePage((req.params.id as string), req.user!.id);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deletePage((req.params.id as string), req.user!.id);
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
}

export async function reorder(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ pageIds: z.array(z.string()).min(1) }).parse(req.body);
    const data = await service.reorderPages((req.params.projectId as string), req.user!.id, body.pageIds);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function exportPage(req: Request, res: Response, next: NextFunction) {
  try {
    const body = exportPageSchema.parse(req.body);
    const data = await exportService.exportPage((req.params.id as string), req.user!.id, body.format);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}
