import { z } from "zod";
import { USER_ROLES } from "@productstudio/shared-types";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const publicUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(USER_ROLES),
});

export type LoginInput = z.infer<typeof loginSchema>;
