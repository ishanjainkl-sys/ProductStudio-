import { z } from "zod";

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().max(60).optional(),
  description: z.string().max(2000).optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
