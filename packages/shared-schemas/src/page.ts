import { z } from "zod";

export const spacingBoxSchema = z.object({
  top: z.number(),
  bottom: z.number(),
  left: z.number(),
  right: z.number(),
});

export const tokenRefSchema = z.object({
  $token: z.string().min(1),
});

export const assetRefSchema = z.object({
  $ref: z.literal("asset"),
  id: z.string().min(1),
});

export const nodeRefSchema = z.object({
  $ref: z.literal("node"),
  id: z.string().min(1),
});

export const componentNodeSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    props: z.record(z.unknown()),
    responsiveProps: z
      .object({
        tablet: z.record(z.unknown()).optional(),
        mobile: z.record(z.unknown()).optional(),
      })
      .default({}),
    children: z.array(componentNodeSchema).optional(),
    dataBinding: z.record(z.unknown()).nullable().optional(),
  }),
);

export const pageDocumentSchema = z.object({
  schemaVersion: z.number().int().positive(),
  pageId: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(160),
  seo: z.object({
    title: z.string().max(160).optional(),
    description: z.string().max(300).optional(),
    ogImageAssetId: z.string().nullable().optional(),
  }),
  theme: z.object({
    overrides: z.record(z.unknown()),
  }),
  root: componentNodeSchema,
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    createdBy: z.string(),
    version: z.number().int().nonnegative(),
    viewport: z.enum(["desktop", "tablet", "mobile"]).optional(),
    isBlank: z.boolean().optional(),
    canvasX: z.number().optional(),
    canvasY: z.number().optional(),
    dimensions: z
      .record(
        z.enum(["desktop", "tablet", "mobile"]),
        z.object({
          width: z.number(),
          height: z.number(),
        })
      )
      .optional(),
  }),
});

export const createPageSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$|^\/$/, "Slug must be URL-safe")
    .optional(),
});

export const updatePageSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$|^\/$/)
    .optional(),
  seoTitle: z.string().max(160).nullable().optional(),
  seoDescription: z.string().max(300).nullable().optional(),
  isHome: z.boolean().optional(),
});

export const savePageSchema = z.object({
  contentJson: pageDocumentSchema,
  expectedVersion: z.number().int().nonnegative(),
});

export const exportPageSchema = z.object({
  format: z.enum(["html", "react"]),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type SavePageInput = z.infer<typeof savePageSchema>;
