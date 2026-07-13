import { MaintenanceStatus } from '@prisma/client';

export interface CreateMaintenanceInput {
  vehicleId: string;
  description: string;
  scheduledDate: string;
}

export interface UpdateMaintenanceInput {
  status?: MaintenanceStatus;
  description?: string;
  scheduledDate?: string;
  completedDate?: string;
  odometerAtService?: number;
  cost?: number;
}

export interface MaintenanceRecordOutput {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  status: MaintenanceStatus;
  description: string;
  scheduledDate: Date;
  completedDate: Date | null;
  odometerAtService: number | null;
  cost: number | null;
  createdAt: Date;
}

export interface ListMaintenanceQuery {
  page: number;
  limit: number;
  status?: MaintenanceStatus;
  vehicleId?: string;
}
