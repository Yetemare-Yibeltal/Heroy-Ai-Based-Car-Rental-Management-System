import { z } from 'zod';
import { Role, VerificationStatus } from '@prisma/client';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().min(7).max(20).optional(),
  avatarUrl: z.string().url().optional(),
});

export const adminUpdateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().min(7).max(20).optional(),
  role: z.nativeEnum(Role).optional(),
  verificationStatus: z.nativeEnum(VerificationStatus).optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
export type AdminUpdateUserSchema = z.infer<typeof adminUpdateUserSchema>;
