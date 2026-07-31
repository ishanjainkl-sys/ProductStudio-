import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { generateId } from "@productstudio/shared-types";
import { ALLOWED_MIME_TYPES } from "@productstudio/shared-schemas";
import { loadEnv } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import { NotFoundError, ResourceInUseError, ValidationError } from "../../lib/errors.js";
import { requireProjectAccess } from "../projects/projects.service.js";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

export async function requestUploadUrl(
  projectId: string,
  userId: string,
  input: { filename: string; mimeType: string; sizeBytes: number },
) {
  await requireProjectAccess(projectId, userId);
  const env = loadEnv();
  if (input.sizeBytes > env.MAX_ASSET_BYTES) {
    throw new ValidationError("File exceeds maximum size");
  }
  if (!ALLOWED_MIME_TYPES.includes(input.mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new ValidationError("Unsupported file type");
  }

  const safe = sanitizeFilename(input.filename);
  const key = `${projectId}/${randomUUID()}-${safe}`;
  const dir = path.join(env.UPLOAD_DIR, projectId);
  await fs.mkdir(dir, { recursive: true });

  // Local "signed URL": client POSTs multipart to confirm endpoint with key
  return {
    uploadUrl: `/api/projects/${projectId}/assets/upload`,
    key,
    method: "POST" as const,
    expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
  };
}

export async function confirmUpload(
  projectId: string,
  userId: string,
  input: {
    key: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    buffer: Buffer;
  },
) {
  await requireProjectAccess(projectId, userId);
  const env = loadEnv();
  if (!input.key.startsWith(`${projectId}/`)) {
    throw new ValidationError("Invalid upload key");
  }
  if (input.buffer.byteLength > env.MAX_ASSET_BYTES) {
    throw new ValidationError("File exceeds maximum size");
  }

  const abs = path.join(env.UPLOAD_DIR, input.key);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, input.buffer);

  const url = `/uploads/${input.key}`;
  const asset = await prisma.asset.create({
    data: {
      id: generateId("ast"),
      projectId,
      url,
      storageKey: input.key,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.byteLength,
      originalFilename: sanitizeFilename(input.filename),
    },
  });

  return {
    id: asset.id,
    projectId: asset.projectId,
    url: asset.url,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    originalFilename: asset.originalFilename,
    createdAt: asset.createdAt.toISOString(),
  };
}

export async function listAssets(projectId: string, userId: string) {
  await requireProjectAccess(projectId, userId);
  const assets = await prisma.asset.findMany({
    where: { projectId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { references: true } } },
  });
  return assets.map((a) => ({
    id: a.id,
    projectId: a.projectId,
    url: a.url,
    mimeType: a.mimeType,
    sizeBytes: a.sizeBytes,
    originalFilename: a.originalFilename,
    createdAt: a.createdAt.toISOString(),
    usageCount: a._count.references,
  }));
}

export async function getUsages(assetId: string, userId: string) {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, deletedAt: null },
    include: { project: true, references: { include: { page: true } } },
  });
  if (!asset || asset.project.ownerId !== userId) throw new NotFoundError("Asset not found");
  return asset.references.map((r) => ({
    pageId: r.pageId,
    pageName: r.page.name,
    nodeId: r.nodeId,
  }));
}

export async function deleteAsset(assetId: string, userId: string, force = false) {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, deletedAt: null },
    include: { project: true, references: true },
  });
  if (!asset || asset.project.ownerId !== userId) throw new NotFoundError("Asset not found");

  if (asset.references.length && !force) {
    throw new ResourceInUseError("Asset is referenced by pages", {
      usages: asset.references.map((r) => ({ pageId: r.pageId, nodeId: r.nodeId })),
    });
  }

  if (force && asset.references.length) {
    await prisma.assetReference.deleteMany({ where: { assetId } });
  }

  await prisma.asset.update({
    where: { id: assetId },
    data: { deletedAt: new Date() },
  });
  return { ok: true };
}

export async function readAssetBuffer(assetId: string): Promise<Buffer | null> {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) return null;
  const env = loadEnv();
  try {
    return await fs.readFile(path.join(env.UPLOAD_DIR, asset.storageKey));
  } catch {
    return null;
  }
}
