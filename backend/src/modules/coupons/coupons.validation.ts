import { z } from 'zod';
import { CouponType } from '@prisma/client';

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(30)
    .transform((val) => val.toUpperCase().trim()),
  type: z.nativeEnum(CouponType),
  value: z.number().positive('Value must be greater than 0'),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updateCouponSchema = z.object({
  value: z.number().positive().optional(),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
  active: z.boolean().optional(),
});

export type CreateCouponSchema = z.infer<typeof createCouponSchema>;
export type UpdateCouponSchema = z.infer<typeof updateCouponSchema>;
