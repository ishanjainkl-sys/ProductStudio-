import { z } from "zod";

export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

export const uploadUrlRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
});

export const confirmAssetSchema = z.object({
  key: z.string().min(1),
  filename: z.string().min(1).max(255),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
});
