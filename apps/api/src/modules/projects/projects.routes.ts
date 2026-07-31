import { Router } from "express";
import { requireAuth, csrfGuard } from "../../middleware/requireAuth.js";
import * as controller from "./projects.controller.js";
import { pagesRouter } from "../pages/pages.routes.js";
import { themeRouter } from "../theme/theme.routes.js";
import { assetsRouter } from "../assets/assets.routes.js";
import { templatesProjectRouter } from "../templates/templates.routes.js";

export const projectsRouter = Router();

projectsRouter.use(requireAuth, csrfGuard);

projectsRouter.get("/", controller.list);
projectsRouter.get("/recently-deleted", controller.recentlyDeleted);
projectsRouter.post("/", controller.create);
projectsRouter.get("/:id", controller.get);
projectsRouter.patch("/:id", controller.update);
projectsRouter.delete("/:id", controller.remove);
projectsRouter.post("/:id/restore", controller.restore);

projectsRouter.use("/:projectId/pages", pagesRouter);
projectsRouter.use("/:projectId/theme", themeRouter);
projectsRouter.use("/:projectId/settings", themeRouter);
projectsRouter.use("/:projectId/assets", assetsRouter);
projectsRouter.use("/:projectId", templatesProjectRouter);
