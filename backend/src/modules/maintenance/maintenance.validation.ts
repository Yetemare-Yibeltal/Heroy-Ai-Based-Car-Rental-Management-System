import { z } from 'zod';

export const createMaintenanceSchema = z.object({
  vehicleId: z.string().cuid('Invalid vehicle ID'),
  description: z.string().min(1, 'Description is required').max(500),
  scheduledDate: z.string().datetime('Scheduled date must be a valid ISO date'),
});

export const updateMaintenanceSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED']).optional(),
  description: z.string().min(1).max(500).optional(),
  scheduledDate: z.string().datetime().optional(),
  completedDate: z.string().datetime().optional(),
  odometerAtService: z.number().int().min(0).optional(),
  cost: z.number().min(0).optional(),
});

export const listMaintenanceQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED']).optional(),
  vehicleId: z.string().cuid().optional(),
});

export type CreateMaintenanceSchema = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceSchema = z.infer<typeof updateMaintenanceSchema>;
