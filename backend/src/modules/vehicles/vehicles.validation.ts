import { z } from 'zod';
import { VehicleCategory, VehicleStatus, TransmissionType, FuelType } from '@prisma/client';

const imageSchema = z.object({
  url: z.string().url('Each image must be a valid URL'),
  isPrimary: z.boolean().optional(),
});

export const createVehicleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  brand: z.string().min(1, 'Brand is required').max(100),
  category: z.nativeEnum(VehicleCategory),
  transmission: z.nativeEnum(TransmissionType),
  fuel: z.nativeEnum(FuelType),
  seats: z.number().int().min(1).max(20),
  pricePerDay: z.number().positive('Price must be greater than 0'),
  plate: z.string().min(1, 'Plate/identifier is required').max(30),
  description: z.string().max(2000).optional(),
  mileage: z.number().int().min(0).optional(),
  year: z
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1),
  locationId: z.string().cuid().optional(),
  images: z.array(imageSchema).optional(),
});

export const updateVehicleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  brand: z.string().min(1).max(100).optional(),
  category: z.nativeEnum(VehicleCategory).optional(),
  transmission: z.nativeEnum(TransmissionType).optional(),
  fuel: z.nativeEnum(FuelType).optional(),
  seats: z.number().int().min(1).max(20).optional(),
  pricePerDay: z.number().positive().optional(),
  description: z.string().max(2000).optional(),
  mileage: z.number().int().min(0).optional(),
  year: z
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1)
    .optional(),
  status: z.nativeEnum(VehicleStatus).optional(),
  locationId: z.string().cuid().optional(),
});

const numericQueryParam = () =>
  z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined))
    .refine((val) => val === undefined || !Number.isNaN(val), 'Must be a number');

export const listVehiclesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  category: z.nativeEnum(VehicleCategory).optional(),
  status: z.nativeEnum(VehicleStatus).optional(),
  transmission: z.nativeEnum(TransmissionType).optional(),
  fuel: z.nativeEnum(FuelType).optional(),
  minPrice: numericQueryParam(),
  maxPrice: numericQueryParam(),
  seats: numericQueryParam(),
  locationId: z.string().cuid().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'rating']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const addVehicleImageSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  isPrimary: z.boolean().optional(),
});

export type CreateVehicleSchema = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleSchema = z.infer<typeof updateVehicleSchema>;
export type ListVehiclesQuerySchema = z.infer<typeof listVehiclesQuerySchema>;
