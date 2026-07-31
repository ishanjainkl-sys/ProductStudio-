import { Router } from "express";
import * as controller from "./pages.controller.js";

/** Nested under /projects/:projectId/pages */
export const pagesRouter = Router({ mergeParams: true });

pagesRouter.get("/", controller.list);
pagesRouter.post("/", controller.create);
pagesRouter.post("/reorder", controller.reorder);

/** Top-level /pages/:id */
export const pageEntityRouter = Router();

pageEntityRouter.get("/:id", controller.get);
pageEntityRouter.patch("/:id", controller.update);
pageEntityRouter.post("/:id/save", controller.save);
pageEntityRouter.post("/:id/duplicate", controller.duplicate);
pageEntityRouter.delete("/:id", controller.remove);
pageEntityRouter.post("/:id/export", controller.exportPage);
