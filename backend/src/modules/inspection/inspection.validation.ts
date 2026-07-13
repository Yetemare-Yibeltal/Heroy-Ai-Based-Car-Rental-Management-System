import { z } from 'zod';

export const createInspectionSchema = z.object({
  bookingId: z.string().cuid('Invalid booking ID'),
  type: z.enum(['PICKUP', 'RETURN']),
  notes: z.string().max(1000).optional(),
  photos: z.array(z.string().url()).min(1, 'At least one photo is required'),
  damageFound: z.boolean(),
});

export type CreateInspectionSchema = z.infer<typeof createInspectionSchema>;
