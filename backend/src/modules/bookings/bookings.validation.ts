import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

export const createBookingSchema = z
  .object({
    vehicleId: z.string().cuid('Invalid vehicle ID'),
    locationId: z.string().cuid('Invalid location ID').optional(),
    startDate: z.string().datetime('Start date must be a valid ISO date'),
    endDate: z.string().datetime('End date must be a valid ISO date'),
    insuranceAddOn: z.boolean().optional(),
    deliveryRequested: z.boolean().optional(),
    deliveryAddress: z.string().max(300).optional(),
    couponCode: z.string().max(50).optional(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after the start date.',
    path: ['endDate'],
  })
  .refine((data) => new Date(data.startDate) >= new Date(new Date().toDateString()), {
    message: 'Start date cannot be in the past.',
    path: ['startDate'],
  })
  .refine((data) => !data.deliveryRequested || (data.deliveryRequested && data.deliveryAddress), {
    message: 'A delivery address is required when requesting delivery.',
    path: ['deliveryAddress'],
  });

export const updateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
});

export const listBookingsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  userId: z.string().cuid().optional(),
  vehicleId: z.string().cuid().optional(),
  startDateFrom: z.string().datetime().optional(),
  startDateTo: z.string().datetime().optional(),
});

export type CreateBookingSchema = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusSchema = z.infer<typeof updateBookingStatusSchema>;
export type ListBookingsQuerySchema = z.infer<typeof listBookingsQuerySchema>;
