import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

export interface WishlistItemOutput {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehicleBrand: string;
  pricePerDay: number;
  status: string;
  primaryImageUrl: string | null;
  addedAt: Date;
}

export async function addToWishlist(
  userId: string,
  vehicleId: string
): Promise<WishlistItemOutput> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) {
    throw AppError.notFound('Vehicle not found.');
  }

  const existing = await prisma.wishlist.findUnique({
    where: { userId_vehicleId: { userId, vehicleId } },
  });
  if (existing) {
    throw AppError.conflict('This vehicle is already in your wishlist.');
  }

  const item = await prisma.wishlist.create({
    data: { userId, vehicleId },
    include: { vehicle: { include: { images: true } } },
  });

  logger.info(`User ${userId} added vehicle ${vehicleId} to wishlist`);

  const primaryImage = item.vehicle.images.find((img) => img.isPrimary) ?? item.vehicle.images[0];

  return {
    id: item.id,
    vehicleId: item.vehicleId,
    vehicleName: item.vehicle.name,
    vehicleBrand: item.vehicle.brand,
    pricePerDay: item.vehicle.pricePerDay,
    status: item.vehicle.status,
    primaryImageUrl: primaryImage?.url ?? null,
    addedAt: item.createdAt,
  };
}

export async function removeFromWishlist(userId: string, vehicleId: string): Promise<void> {
  const existing = await prisma.wishlist.findUnique({
    where: { userId_vehicleId: { userId, vehicleId } },
  });

  if (!existing) {
    throw AppError.notFound('This vehicle is not in your wishlist.');
  }

  await prisma.wishlist.delete({ where: { id: existing.id } });

  logger.info(`User ${userId} removed vehicle ${vehicleId} from wishlist`);
}

export async function listMyWishlist(userId: string): Promise<WishlistItemOutput[]> {
  const items = await prisma.wishlist.findMany({
    where: { userId },
    include: { vehicle: { include: { images: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return items.map((item) => {
    const primaryImage = item.vehicle.images.find((img) => img.isPrimary) ?? item.vehicle.images[0];

    return {
      id: item.id,
      vehicleId: item.vehicleId,
      vehicleName: item.vehicle.name,
      vehicleBrand: item.vehicle.brand,
      pricePerDay: item.vehicle.pricePerDay,
      status: item.vehicle.status,
      primaryImageUrl: primaryImage?.url ?? null,
      addedAt: item.createdAt,
    };
  });
}

export async function isVehicleWishlisted(userId: string, vehicleId: string): Promise<boolean> {
  const existing = await prisma.wishlist.findUnique({
    where: { userId_vehicleId: { userId, vehicleId } },
  });
  return existing !== null;
}
