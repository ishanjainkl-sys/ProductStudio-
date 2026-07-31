import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as controller from "./auth.controller.js";

export const authRouter = Router();

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
authRouter.post("/refresh", controller.refresh);
