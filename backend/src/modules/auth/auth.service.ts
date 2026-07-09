import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { hashPassword, comparePassword } from "../../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getExpiryDate,
} from "../../utils/jwt";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import {
  RegisterInput,
  LoginInput,
  AuthResult,
  AuthenticatedUser,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from "./auth.types";

function toAuthenticatedUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl: string | null;
  verificationStatus: string;
  loyaltyPoints: number;
}): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as AuthenticatedUser["role"],
    avatarUrl: user.avatarUrl,
    verificationStatus: user.verificationStatus,
    loyaltyPoints: user.loyaltyPoints,
  };
}

async function issueTokens(userId: string, email: string, role: string) {
  const accessToken = signAccessToken({ userId, email, role });
  const refreshToken = signRefreshToken({ userId });

  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
      expiresAt: getExpiryDate(env.jwt.refreshExpiresIn),
    },
  });

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw AppError.conflict("An account with this email already exists.");
  }

  const hashedPassword = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
    },
  });

  const tokens = await issueTokens(user.id, user.email, user.role);

  logger.info(`New user registered: ${user.email}`);

  return { user: toAuthenticatedUser(user), tokens };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw AppError.unauthorized("Invalid email or password.");
  }

  const passwordMatches = await comparePassword(input.password, user.password);
  if (!passwordMatches) {
    throw AppError.unauthorized("Invalid email or password.");
  }

  const tokens = await issueTokens(user.id, user.email, user.role);

  logger.info(`User logged in: ${user.email}`);

  return { user: toAuthenticatedUser(user), tokens };
}

export async function refreshTokens(
  refreshToken: string,
): Promise<AuthResult["tokens"]> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized("Invalid or expired refresh token.");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });
  if (
    !storedToken ||
    storedToken.revoked ||
    storedToken.expiresAt < new Date()
  ) {
    throw AppError.unauthorized(
      "Refresh token is no longer valid. Please log in again.",
    );
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw AppError.unauthorized("User no longer exists.");
  }

  // Rotate: revoke the used refresh token and issue a new pair.
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked: true },
  });

  return issueTokens(user.id, user.email, user.role);
}

export async function logout(refreshToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { revoked: true },
  });
}

export async function logoutAllSessions(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
}

export async function forgotPassword(
  input: ForgotPasswordInput,
): Promise<{ resetToken: string } | null> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Do not reveal whether the email exists - respond the same way either way.
  if (!user) {
    return null;
  }

  // The token is signed with a secret derived from the current password
  // hash, so it automatically becomes invalid once the password changes.
  const resetToken = jwt.sign(
    { userId: user.id },
    env.jwt.accessSecret + user.password,
    { expiresIn: "30m" },
  );

  logger.info(`Password reset requested for: ${user.email}`);

  // In Phase 13 (email integration) this token gets emailed to the user
  // instead of returned directly.
  return { resetToken };
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const decoded = jwt.decode(input.token) as { userId: string } | null;
  if (!decoded?.userId) {
    throw AppError.badRequest("Invalid or expired reset token.");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) {
    throw AppError.badRequest("Invalid or expired reset token.");
  }

  try {
    jwt.verify(input.token, env.jwt.accessSecret + user.password);
  } catch {
    throw AppError.badRequest("Invalid or expired reset token.");
  }

  const hashedPassword = await hashPassword(input.newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  await logoutAllSessions(user.id);

  logger.info(`Password reset completed for: ${user.email}`);
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound("User not found.");
  }

  const matches = await comparePassword(input.currentPassword, user.password);
  if (!matches) {
    throw AppError.badRequest("Current password is incorrect.");
  }

  const hashedPassword = await hashPassword(input.newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  logger.info(`Password changed for: ${user.email}`);
}

export async function getAuthenticatedUser(
  userId: string,
): Promise<AuthenticatedUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound("User not found.");
  }
  return toAuthenticatedUser(user);
}
