import { z } from 'zod';

export const createReviewSchema = z.object({
  bookingId: z.string().cuid('Invalid booking ID'),
  rating: z
    .number()
    .int()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
  comment: z.string().max(1000).optional(),
});

export const listReviewsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  vehicleId: z.string().cuid().optional(),
  minRating: z.string().optional(),
});

export type CreateReviewSchema = z.infer<typeof createReviewSchema>;
