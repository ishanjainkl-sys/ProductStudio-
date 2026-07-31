import { z } from "zod";
import path from "node:path";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  SESSION_INACTIVITY_HOURS: z.coerce.number().positive().default(24),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  UPLOAD_DIR: z.string().default("./uploads"),
  EXPORT_DIR: z.string().default("./exports"),
  MAX_ASSET_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function loadEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  if (cached && process.env.NODE_ENV !== "test") return cached;
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  cached = {
    ...parsed.data,
    UPLOAD_DIR: path.resolve(parsed.data.UPLOAD_DIR),
    EXPORT_DIR: path.resolve(parsed.data.EXPORT_DIR),
  };
  return cached;
}

export function resetEnvCache(): void {
  cached = null;
}
