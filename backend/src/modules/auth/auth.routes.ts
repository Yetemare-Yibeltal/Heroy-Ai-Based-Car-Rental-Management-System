import { Router } from "express";
import * as authController from "./auth.controller";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import { authLimiter } from "../../middleware/rateLimiter";
import { catchAsync } from "../../utils/catchAsync";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "./auth.validation";

export const authRoutes = Router();

authRoutes.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  catchAsync(authController.register),
);

authRoutes.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  catchAsync(authController.login),
);

authRoutes.post(
  "/refresh",
  validate(refreshTokenSchema),
  catchAsync(authController.refresh),
);

authRoutes.post(
  "/logout",
  validate(refreshTokenSchema),
  catchAsync(authController.logout),
);

authRoutes.post(
  "/logout-all",
  authenticate,
  catchAsync(authController.logoutAll),
);

authRoutes.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  catchAsync(authController.forgotPassword),
);

authRoutes.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  catchAsync(authController.resetPassword),
);

authRoutes.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  catchAsync(authController.changePassword),
);

authRoutes.get("/me", authenticate, catchAsync(authController.me));
