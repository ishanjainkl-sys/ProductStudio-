import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as controller from "./auth.controller.js";

import multer from "multer";

export const authRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "VALIDATION_ERROR",
      message: "Too many login attempts. Try again later.",
    },
  },
});

authRouter.post("/login", loginLimiter, controller.login);
authRouter.post("/logout", controller.logout);
authRouter.get("/me", requireAuth, controller.me);
authRouter.patch("/me", requireAuth, controller.updateMe);
authRouter.post("/me/avatar", requireAuth, upload.single("file"), controller.uploadAvatar);
authRouter.delete("/me/avatar", requireAuth, controller.removeAvatar);
authRouter.post("/refresh", controller.refresh);
