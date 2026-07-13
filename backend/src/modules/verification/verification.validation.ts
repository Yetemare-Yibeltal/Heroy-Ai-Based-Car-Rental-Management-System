import { z } from 'zod';

export const submitVerificationSchema = z.object({
  documentType: z.enum(['DRIVERS_LICENSE', 'NATIONAL_ID', 'PASSPORT']),
  documentUrl: z.string().url('Document URL must be valid'),
});

export const reviewVerificationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().max(500).optional(),
});

export const listVerificationsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
});

export type SubmitVerificationSchema = z.infer<typeof submitVerificationSchema>;
export type ReviewVerificationSchema = z.infer<typeof reviewVerificationSchema>;
