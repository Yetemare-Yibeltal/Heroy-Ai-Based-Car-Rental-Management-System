import { z } from 'zod';

export const createCorporateAccountSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(150),
  contactEmail: z.string().email('Must be a valid email address'),
  contactPhone: z.string().min(7).max(20).optional(),
  billingAddress: z.string().max(300).optional(),
});

export const updateCorporateAccountSchema = z.object({
  companyName: z.string().min(1).max(150).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(7).max(20).optional(),
  billingAddress: z.string().max(300).optional(),
});

export const addEmployeeSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
});

export const billingSummaryQuerySchema = z.object({
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
});

export type CreateCorporateAccountSchema = z.infer<typeof createCorporateAccountSchema>;
export type UpdateCorporateAccountSchema = z.infer<typeof updateCorporateAccountSchema>;
export type AddEmployeeSchema = z.infer<typeof addEmployeeSchema>;
