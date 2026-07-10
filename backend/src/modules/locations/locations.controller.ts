import { Request, Response } from 'express';
import { sendSuccess, sendNoContent } from '../../utils/apiResponse';
import * as locationsService from './locations.service';
import { CreateLocationSchema, UpdateLocationSchema } from './locations.validation';

export async function listLocations(req: Request, res: Response): Promise<void> {
  const locations = await locationsService.listLocations();
  sendSuccess(res, 200, 'Locations fetched.', locations);
}

export async function getLocationById(req: Request, res: Response): Promise<void> {
  const location = await locationsService.getLocationById(req.params.id);
  sendSuccess(res, 200, 'Location fetched.', location);
}

export async function createLocation(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateLocationSchema;
  const location = await locationsService.createLocation(input);
  sendSuccess(res, 201, 'Location created.', location);
}

export async function updateLocation(req: Request, res: Response): Promise<void> {
  const input = req.body as UpdateLocationSchema;
  const location = await locationsService.updateLocation(req.params.id, input);
  sendSuccess(res, 200, 'Location updated.', location);
}

export async function deleteLocation(req: Request, res: Response): Promise<void> {
  await locationsService.deleteLocation(req.params.id);
  sendNoContent(res);
}
