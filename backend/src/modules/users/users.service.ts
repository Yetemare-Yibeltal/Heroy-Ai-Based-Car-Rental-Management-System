import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import {
  PublicUser,
  UpdateProfileInput,
  AdminUpdateUserInput,
  ListUsersQuery,
  ListUsersResult,
} from './users.types';

function toPublicUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  avatarUrl: string | null;
  verificationStatus: string;
  loyaltyPoints: number;
  corporateAccountId: string | null;
  createdAt: Date;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role as PublicUser['role'],
    avatarUrl: user.avatarUrl,
    verificationStatus: user.verificationStatus as PublicUser['verificationStatus'],
    loyaltyPoints: user.loyaltyPoints,
    corporateAccountId: user.corporateAccountId,
    createdAt: user.createdAt,
  };
}

export async function getProfile(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound('User not found.');
  }
  return toPublicUser(user);
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<PublicUser> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      avatarUrl: input.avatarUrl,
    },
  });

  logger.info(`Profile updated: ${user.email}`);

  return toPublicUser(user);
}

export async function deleteOwnAccount(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound('User not found.');
  }

  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { revoked: true },
  });

  await prisma.user.delete({ where: { id: userId } });

  logger.info(`Account deleted: ${user.email}`);
}

export async function listUsers(query: ListUsersQuery): Promise<ListUsersResult> {
  const where: Prisma.UserWhereInput = {};

  if (query.role) {
    where.role = query.role;
  }

  if (query.search) {
    where.OR = [
      { email: { contains: query.search, mode: 'insensitive' } },
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map(toPublicUser),
    total,
  };
}

export async function getUserById(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound('User not found.');
  }
  return toPublicUser(user);
}

export async function adminUpdateUser(
  userId: string,
  input: AdminUpdateUserInput
): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw AppError.notFound('User not found.');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: input.role,
      verificationStatus: input.verificationStatus,
    },
  });

  logger.info(`Admin updated user: ${user.email}`);

  return toPublicUser(user);
}

export async function adminDeleteUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound('User not found.');
  }

  await prisma.user.delete({ where: { id: userId } });

  logger.info(`Admin deleted user: ${user.email}`);
}
