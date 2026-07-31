import type { Request, Response, NextFunction } from "express";
import { confirmAssetSchema, uploadUrlRequestSchema } from "@productstudio/shared-schemas";
import * as service from "./assets.service.js";
import { ValidationError } from "../../lib/errors.js";

export async function uploadUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const body = uploadUrlRequestSchema.parse(req.body);
    const data = await service.requestUploadUrl(req.params.projectId!, req.user!.id, body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function upload(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    if (!file) throw new ValidationError("Missing file");
    const meta = confirmAssetSchema.parse({
      key: req.body.key,
      filename: req.body.filename || file.originalname,
      mimeType: req.body.mimeType || file.mimetype,
      sizeBytes: Number(req.body.sizeBytes) || file.size,
    });
    const data = await service.confirmUpload(req.params.projectId!, req.user!.id, {
      ...meta,
      buffer: file.buffer,
    });
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
}

export async function confirm(req: Request, res: Response, next: NextFunction) {
  try {
    // Spec POST /assets after signed upload — for local storage this is unused;
    // prefer /upload which writes the file.
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Use POST /assets/upload with multipart file and key",
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.listAssets(req.params.projectId!, req.user!.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function usages(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getUsages(req.params.id!, req.user!.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const force = req.query.force === "true";
    await service.deleteAsset(req.params.id!, req.user!.id, force);
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
}
