import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "node:path";
import { loadEnv } from "./config/env.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requireAuth, csrfGuard } from "./middleware/requireAuth.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { projectsRouter } from "./modules/projects/projects.routes.js";
import { pageEntityRouter } from "./modules/pages/pages.routes.js";
import { templatesRouter } from "./modules/templates/templates.routes.js";
import { assetEntityRouter } from "./modules/assets/assets.routes.js";

export function createApp() {
  const env = loadEnv();
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "5mb" }));
  app.use(cookieParser());
  app.use(requestLogger);

  app.get("/health", (_req, res) => {
    res.json({ data: { status: "ok" } });
  });

  app.use("/uploads", express.static(env.UPLOAD_DIR));
  app.use("/exports", express.static(env.EXPORT_DIR));

  app.use("/api/auth", authRouter);
  app.use("/api/projects", projectsRouter);
  app.use("/api/pages", requireAuth, csrfGuard, pageEntityRouter);
  app.use("/api/templates", templatesRouter);
  app.use("/api/assets", assetEntityRouter);

  app.use(errorHandler);
  return app;
}

// Ensure path import is retained for future static resolution helpers
void path;
