import { Router } from "express";
import multer from "multer";
import { requireAuth, csrfGuard } from "../../middleware/requireAuth.js";
import * as controller from "./assets.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/** Nested under /projects/:projectId/assets */
export const assetsRouter = Router({ mergeParams: true });
assetsRouter.post("/upload-url", controller.uploadUrl);
assetsRouter.post("/upload", upload.single("file"), controller.upload);
assetsRouter.post("/", controller.confirm);
assetsRouter.get("/", controller.list);

export const assetEntityRouter = Router();
assetEntityRouter.use(requireAuth, csrfGuard);
assetEntityRouter.get("/:id/usages", controller.usages);
assetEntityRouter.delete("/:id", controller.remove);
