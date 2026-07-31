import { z } from "zod";

export const createProjectSchema = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("blank"),
    name: z.string().min(1).max(120),
    description: z.string().max(2000).optional(),
  }),
  z.object({
    source: z.literal("template"),
    name: z.string().min(1).max(120),
    templateVersionId: z.string().min(1),
    description: z.string().max(2000).optional(),
  }),
]);

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional().nullable(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  query: z.string().optional().default(""),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
