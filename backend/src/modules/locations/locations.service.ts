import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { CreateLocationSchema, UpdateLocationSchema } from './locations.validation';

export async function listLocations() {
  return prisma.location.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { vehicles: true } } },
  });
}

export async function getLocationById(locationId: string) {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { _count: { select: { vehicles: true } } },
  });

  if (!location) {
    throw AppError.notFound('Location not found.');
  }

  return location;
}

export async function createLocation(input: CreateLocationSchema) {
  const location = await prisma.location.create({ data: input });
  logger.info(`Location created: ${location.name}`);
  return location;
}

export async function updateLocation(locationId: string, input: UpdateLocationSchema) {
  const existing = await prisma.location.findUnique({ where: { id: locationId } });
  if (!existing) {
    throw AppError.notFound('Location not found.');
  }

  const location = await prisma.location.update({ where: { id: locationId }, data: input });
  logger.info(`Location updated: ${location.name}`);
  return location;
}

export async function deleteLocation(locationId: string): Promise<void> {
  const existing = await prisma.location.findUnique({
    where: { id: locationId },
    include: { _count: { select: { vehicles: true } } },
  });

  if (!existing) {
    throw AppError.notFound('Location not found.');
  }

  if (existing._count.vehicles > 0) {
    throw AppError.conflict(
      'This location still has vehicles assigned to it. Reassign them before deleting.'
    );
  }

  await prisma.location.delete({ where: { id: locationId } });
  logger.info(`Location deleted: ${existing.name}`);
}
