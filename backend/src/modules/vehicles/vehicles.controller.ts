import { Request, Response } from 'express';
import { sendSuccess, sendPaginated, sendNoContent } from '../../utils/apiResponse';
import * as vehiclesService from './vehicles.service';
import {
  CreateVehicleSchema,
  UpdateVehicleSchema,
  ListVehiclesQuerySchema,
} from './vehicles.validation';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../constants/enums';

export async function listVehicles(req: Request, res: Response): Promise<void> {
  const q = req.query as unknown as ListVehiclesQuerySchema;

  const page = Math.max(parseInt(String(q.page ?? DEFAULT_PAGE), 10), 1);
  const limit = Math.min(
    Math.max(parseInt(String(q.limit ?? DEFAULT_PAGE_SIZE), 10), 1),
    MAX_PAGE_SIZE
  );

  const result = await vehiclesService.listVehicles({
    page,
    limit,
    category: q.category,
    status: q.status,
    transmission: q.transmission,
    fuel: q.fuel,
    minPrice: q.minPrice ? Number(q.minPrice) : undefined,
    maxPrice: q.maxPrice ? Number(q.maxPrice) : undefined,
    seats: q.seats ? Number(q.seats) : undefined,
    locationId: q.locationId,
    search: q.search,
    sortBy: q.sortBy,
    startDate: q.startDate,
    endDate: q.endDate,
  });

  sendPaginated(res, 'Vehicles fetched.', result.vehicles, { page, limit, total: result.total });
}

export async function getVehicleById(req: Request, res: Response): Promise<void> {
  const vehicle = await vehiclesService.getVehicleById(req.params.id);
  sendSuccess(res, 200, 'Vehicle fetched.', vehicle);
}

export async function createVehicle(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateVehicleSchema;
  const vehicle = await vehiclesService.createVehicle(input);
  sendSuccess(res, 201, 'Vehicle created.', vehicle);
}

export async function updateVehicle(req: Request, res: Response): Promise<void> {
  const input = req.body as UpdateVehicleSchema;
  const vehicle = await vehiclesService.updateVehicle(req.params.id, input);
  sendSuccess(res, 200, 'Vehicle updated.', vehicle);
}

export async function deleteVehicle(req: Request, res: Response): Promise<void> {
  await vehiclesService.deleteVehicle(req.params.id);
  sendNoContent(res);
}

export async function addVehicleImage(req: Request, res: Response): Promise<void> {
  const { url, isPrimary } = req.body as { url: string; isPrimary?: boolean };
  const vehicle = await vehiclesService.addVehicleImage(req.params.id, url, isPrimary ?? false);
  sendSuccess(res, 201, 'Image added.', vehicle);
}

export async function removeVehicleImage(req: Request, res: Response): Promise<void> {
  await vehiclesService.removeVehicleImage(req.params.id, req.params.imageId);
  sendNoContent(res);
}
