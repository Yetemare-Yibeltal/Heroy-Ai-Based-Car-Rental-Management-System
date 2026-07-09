import { Request, Response } from "express";
import { sendSuccess } from "../../utils/apiResponse";
import { AppError } from "../../utils/AppError";
import * as authService from "./auth.service";
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
} from "./auth.validation";

export async function register(req: Request, res: Response): Promise<void> {
  const input = req.body as RegisterSchema;
  const result = await authService.register(input);
  sendSuccess(res, 201, "Account created successfully.", result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginSchema;
  const result = await authService.login(input);
  sendSuccess(res, 200, "Logged in successfully.", result);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as RefreshTokenSchema;
  const tokens = await authService.refreshTokens(refreshToken);
  sendSuccess(res, 200, "Token refreshed successfully.", tokens);
}

export async function logout(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as RefreshTokenSchema;
  await authService.logout(refreshToken);
  sendSuccess(res, 200, "Logged out successfully.", null);
}

export async function logoutAll(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized("Authentication required.");
  }
  await authService.logoutAllSessions(req.user.userId);
  sendSuccess(res, 200, "Logged out of all sessions.", null);
}

export async function forgotPassword(
  req: Request,
  res: Response,
): Promise<void> {
  const input = req.body as ForgotPasswordSchema;
  await authService.forgotPassword(input);
  // Always respond the same way, whether or not the email exists,
  // to avoid leaking which emails are registered.
  sendSuccess(
    res,
    200,
    "If an account exists with that email, a password reset link has been sent.",
    null,
  );
}

export async function resetPassword(
  req: Request,
  res: Response,
): Promise<void> {
  const input = req.body as ResetPasswordSchema;
  await authService.resetPassword(input);
  sendSuccess(
    res,
    200,
    "Password reset successfully. Please log in with your new password.",
    null,
  );
}

export async function changePassword(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized("Authentication required.");
  }
  const input = req.body as ChangePasswordSchema;
  await authService.changePassword(req.user.userId, input);
  sendSuccess(res, 200, "Password changed successfully.", null);
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized("Authentication required.");
  }
  const user = await authService.getAuthenticatedUser(req.user.userId);
  sendSuccess(res, 200, "Current user fetched.", user);
}
