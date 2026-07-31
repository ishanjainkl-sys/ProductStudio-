import { Router } from "express";
import * as controller from "./theme.controller.js";

export const themeRouter = Router({ mergeParams: true });

themeRouter.get("/", (req, res, next) => {
  if (req.baseUrl.endsWith("/settings")) return controller.getSettings(req, res, next);
  return controller.getTheme(req, res, next);
});

themeRouter.patch("/", (req, res, next) => {
  if (req.baseUrl.endsWith("/settings")) return controller.patchSettings(req, res, next);
  return controller.patchTheme(req, res, next);
});
