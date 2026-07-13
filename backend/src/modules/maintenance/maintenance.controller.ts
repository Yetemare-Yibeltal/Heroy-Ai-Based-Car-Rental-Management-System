import { Request, Response } from 'express';
import { sendSuccess, sendPaginated, sendNoContent } from '../../utils/apiResponse';
import * as maintenanceService from './maintenance.service';
import { CreateMaintenanceInput, UpdateMaintenanceInput } from './maintenance.types';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../constants/enums';
import { MaintenanceStatus } from '@prisma/client';

export async function createMaintenance(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateMaintenanceInput;
  const record = await maintenanceService.createMaintenance(input);
  sendSuccess(res, 201, 'Maintenance scheduled.', record);
}

export async function updateMaintenance(req: Request, res: Response): Promise<void> {
  const input = req.body as UpdateMaintenanceInput;
  const record = await maintenanceService.updateMaintenance(req.params.id, input);
  sendSuccess(res, 200, 'Maintenance record updated.', record);
}

export async function getMaintenanceById(req: Request, res: Response): Promise<void> {
  const record = await maintenanceService.getMaintenanceById(req.params.id);
  sendSuccess(res, 200, 'Maintenance record fetched.', record);
}

export async function listMaintenance(req: Request, res: Response): Promise<void> {
  const page = Math.max(parseInt(String(req.query.page ?? DEFAULT_PAGE), 10), 1);
  const limit = Math.min(
    Math.max(parseInt(String(req.query.limit ?? DEFAULT_PAGE_SIZE), 10), 1),
    MAX_PAGE_SIZE
  );
  const status = req.query.status as MaintenanceStatus | undefined;
  const vehicleId = req.query.vehicleId ? String(req.query.vehicleId) : undefined;

  const result = await maintenanceService.listMaintenance({ page, limit, status, vehicleId });
  sendPaginated(res, 'Maintenance records fetched.', result.records, {
    page,
    limit,
    total: result.total,
  });
}

export async function deleteMaintenance(req: Request, res: Response): Promise<void> {
  await maintenanceService.deleteMaintenance(req.params.id);
  sendNoContent(res);
}

export async function getVehiclesDueForService(req: Request, res: Response): Promise<void> {
  const vehicles = await maintenanceService.getVehiclesDueForService();
  sendSuccess(res, 200, 'Vehicles due for service fetched.', vehicles);
}
