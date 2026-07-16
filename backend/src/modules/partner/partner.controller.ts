import { Request, Response } from 'express';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { listVehicles } from '../vehicles/vehicles.service';
import { getBookedVehicleIds } from '../vehicles/vehicles.service';
import { prisma } from '../../config/prisma';
import * as apiKeysService from './apiKeys.service';
import { ApiKeyScope } from './apiKeys.service';

export async function getPartnerFleet(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 20), 50);

  const result = await listVehicles({
    page,
    limit,
    category: req.query.category as never,
    status: 'AVAILABLE',
  });

  sendPaginated(res, 'Fleet fetched.', result.vehicles, { page, limit, total: result.total });
}

export async function getPartnerAvailability(req: Request, res: Response): Promise<void> {
  const { startDate, endDate } = req.query as { startDate: string; endDate: string };

  const bookedIds = await getBookedVehicleIds(new Date(startDate), new Date(endDate));
  const allVehicles = await prisma.vehicle.findMany({
    where: { status: 'AVAILABLE' },
    select: { id: true, name: true, category: true, pricePerDay: true },
  });

  const available = allVehicles.filter((v) => !bookedIds.has(v.id));

  sendSuccess(res, 200, 'Availability fetched.', available);
}

export async function getPartnerLocations(req: Request, res: Response): Promise<void> {
  const locations = await prisma.location.findMany({
    select: { id: true, name: true, address: true, city: true, country: true },
  });

  sendSuccess(res, 200, 'Locations fetched.', locations);
}

export async function issueApiKey(req: Request, res: Response): Promise<void> {
  const { partnerName, scopes } = req.body as { partnerName: string; scopes: ApiKeyScope[] };
  const result = apiKeysService.issueApiKey(partnerName, scopes);
  sendSuccess(res, 201, 'API key issued. Save this key now - it will not be shown again.', result);
}

export async function listApiKeys(req: Request, res: Response): Promise<void> {
  const keys = apiKeysService.listApiKeys();
  sendSuccess(res, 200, 'API keys fetched.', keys);
}

export async function revokeApiKey(req: Request, res: Response): Promise<void> {
  apiKeysService.revokeApiKey(req.params.keyId);
  sendSuccess(res, 200, 'API key revoked.', null);
}
