import { Router } from "express";
import { requireAuth, csrfGuard } from "../../middleware/requireAuth.js";
import * as controller from "./templates.controller.js";

export const templatesRouter = Router();
templatesRouter.use(requireAuth, csrfGuard);
templatesRouter.get("/", controller.list);
templatesRouter.get("/:id/versions", controller.versions);

export const templatesProjectRouter = Router({ mergeParams: true });
templatesProjectRouter.post("/save-as-template", controller.saveAsTemplate);
