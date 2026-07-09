import { Prisma, BookingStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleOutput,
  ListVehiclesQuery,
  ListVehiclesResult,
  VehicleImageInput,
} from './vehicles.types';

type VehicleWithRelations = Prisma.VehicleGetPayload<{
  include: {
    images: true;
    location: true;
    reviews: { select: { rating: true } };
  };
}>;

function toVehicleOutput(vehicle: VehicleWithRelations): VehicleOutput {
  const reviewCount = vehicle.reviews.length;
  const averageRating =
    reviewCount > 0
      ? Math.round((vehicle.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
      : null;

  return {
    id: vehicle.id,
    name: vehicle.name,
    brand: vehicle.brand,
    category: vehicle.category,
    transmission: vehicle.transmission,
    fuel: vehicle.fuel,
    seats: vehicle.seats,
    pricePerDay: vehicle.pricePerDay,
    status: vehicle.status,
    plate: vehicle.plate,
    description: vehicle.description,
    mileage: vehicle.mileage,
    year: vehicle.year,
    locationId: vehicle.locationId,
    locationName: vehicle.location?.name ?? null,
    images: vehicle.images.map((img) => ({ id: img.id, url: img.url, isPrimary: img.isPrimary })),
    averageRating,
    reviewCount,
    createdAt: vehicle.createdAt,
  };
}

const vehicleInclude = {
  images: true,
  location: true,
  reviews: { select: { rating: true } },
} satisfies Prisma.VehicleInclude;

export async function createVehicle(input: CreateVehicleInput): Promise<VehicleOutput> {
  const existingPlate = await prisma.vehicle.findUnique({ where: { plate: input.plate } });
  if (existingPlate) {
    throw AppError.conflict('A vehicle with this plate/identifier already exists.');
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      name: input.name,
      brand: input.brand,
      category: input.category,
      transmission: input.transmission,
      fuel: input.fuel,
      seats: input.seats,
      pricePerDay: input.pricePerDay,
      plate: input.plate,
      description: input.description,
      mileage: input.mileage ?? 0,
      year: input.year,
      locationId: input.locationId,
      images: input.images
        ? {
            create: input.images.map((img: VehicleImageInput) => ({
              url: img.url,
              isPrimary: img.isPrimary ?? false,
            })),
          }
        : undefined,
    },
    include: vehicleInclude,
  });

  logger.info(`Vehicle created: ${vehicle.name} (${vehicle.plate})`);

  return toVehicleOutput(vehicle);
}

export async function updateVehicle(
  vehicleId: string,
  input: UpdateVehicleInput
): Promise<VehicleOutput> {
  const existing = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!existing) {
    throw AppError.notFound('Vehicle not found.');
  }

  const vehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      name: input.name,
      brand: input.brand,
      category: input.category,
      transmission: input.transmission,
      fuel: input.fuel,
      seats: input.seats,
      pricePerDay: input.pricePerDay,
      description: input.description,
      mileage: input.mileage,
      year: input.year,
      status: input.status,
      locationId: input.locationId,
    },
    include: vehicleInclude,
  });

  logger.info(`Vehicle updated: ${vehicle.name} (${vehicle.plate})`);

  return toVehicleOutput(vehicle);
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  const existing = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!existing) {
    throw AppError.notFound('Vehicle not found.');
  }

  const activeBookings = await prisma.booking.count({
    where: {
      vehicleId,
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ACTIVE] },
    },
  });

  if (activeBookings > 0) {
    throw AppError.conflict(
      'This vehicle has active or upcoming bookings and cannot be deleted. Retire it instead.'
    );
  }

  await prisma.vehicle.delete({ where: { id: vehicleId } });

  logger.info(`Vehicle deleted: ${existing.name} (${existing.plate})`);
}

export async function getVehicleById(vehicleId: string): Promise<VehicleOutput> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: vehicleInclude,
  });

  if (!vehicle) {
    throw AppError.notFound('Vehicle not found.');
  }

  return toVehicleOutput(vehicle);
}

/**
 * Returns the IDs of vehicles that are already booked (in a
 * non-cancelled state) for any part of the given date range.
 * Used both by the fleet search (to exclude unavailable vehicles)
 * and by the booking module (to validate a specific request).
 */
export async function getBookedVehicleIds(startDate: Date, endDate: Date): Promise<Set<string>> {
  const overlapping = await prisma.booking.findMany({
    where: {
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ACTIVE] },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
    select: { vehicleId: true },
  });

  return new Set(overlapping.map((b) => b.vehicleId));
}

export async function listVehicles(query: ListVehiclesQuery): Promise<ListVehiclesResult> {
  const where: Prisma.VehicleWhereInput = {};

  if (query.category) where.category = query.category;
  if (query.transmission) where.transmission = query.transmission;
  if (query.fuel) where.fuel = query.fuel;
  if (query.seats) where.seats = { gte: query.seats };
  if (query.locationId) where.locationId = query.locationId;

  if (query.minPrice || query.maxPrice) {
    where.pricePerDay = {
      ...(query.minPrice ? { gte: query.minPrice } : {}),
      ...(query.maxPrice ? { lte: query.maxPrice } : {}),
    };
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { brand: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  // If a date range was provided, exclude vehicles already booked for it,
  // and default to only showing AVAILABLE-status vehicles unless a
  // specific status filter was explicitly requested.
  if (query.startDate && query.endDate) {
    const bookedIds = await getBookedVehicleIds(new Date(query.startDate), new Date(query.endDate));
    if (bookedIds.size > 0) {
      where.id = { notIn: Array.from(bookedIds) };
    }
    where.status = query.status ?? 'AVAILABLE';
  } else if (query.status) {
    where.status = query.status;
  }

  let orderBy: Prisma.VehicleOrderByWithRelationInput = { createdAt: 'desc' };
  if (query.sortBy === 'price_asc') orderBy = { pricePerDay: 'asc' };
  if (query.sortBy === 'price_desc') orderBy = { pricePerDay: 'desc' };
  if (query.sortBy === 'newest') orderBy = { createdAt: 'desc' };
  // 'rating' sort is applied in-memory below since it's a computed field.

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      include: vehicleInclude,
      orderBy,
      skip: query.sortBy === 'rating' ? undefined : (query.page - 1) * query.limit,
      take: query.sortBy === 'rating' ? undefined : query.limit,
    }),
    prisma.vehicle.count({ where }),
  ]);

  let results = vehicles.map(toVehicleOutput);

  if (query.sortBy === 'rating') {
    results = results
      .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
      .slice((query.page - 1) * query.limit, (query.page - 1) * query.limit + query.limit);
  }

  return { vehicles: results, total };
}

export async function addVehicleImage(
  vehicleId: string,
  url: string,
  isPrimary: boolean
): Promise<VehicleOutput> {
  const existing = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!existing) {
    throw AppError.notFound('Vehicle not found.');
  }

  if (isPrimary) {
    await prisma.vehicleImage.updateMany({ where: { vehicleId }, data: { isPrimary: false } });
  }

  await prisma.vehicleImage.create({ data: { vehicleId, url, isPrimary } });

  const vehicle = await prisma.vehicle.findUniqueOrThrow({
    where: { id: vehicleId },
    include: vehicleInclude,
  });

  return toVehicleOutput(vehicle);
}

export async function removeVehicleImage(vehicleId: string, imageId: string): Promise<void> {
  const image = await prisma.vehicleImage.findUnique({ where: { id: imageId } });
  if (!image || image.vehicleId !== vehicleId) {
    throw AppError.notFound('Image not found for this vehicle.');
  }

  await prisma.vehicleImage.delete({ where: { id: imageId } });
}
