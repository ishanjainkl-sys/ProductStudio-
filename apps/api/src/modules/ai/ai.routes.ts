import { Router } from "express";
import * as controller from "./ai.controller.js";
import { requireAuth, csrfGuard } from "../../middleware/requireAuth.js";

export const aiRouter = Router({ mergeParams: true });

aiRouter.post("/generate", requireAuth, csrfGuard, controller.generate);
aiRouter.post("/edit", requireAuth, csrfGuard, controller.edit);
aiRouter.post("/seo", requireAuth, csrfGuard, controller.seo);
