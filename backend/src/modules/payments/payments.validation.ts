import { z } from 'zod';
import { PaymentProvider } from '@prisma/client';

export const initiatePaymentSchema = z.object({
  bookingId: z.string().cuid('Invalid booking ID'),
  provider: z.nativeEnum(PaymentProvider),
});

export type InitiatePaymentSchema = z.infer<typeof initiatePaymentSchema>;
