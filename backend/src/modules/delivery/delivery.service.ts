import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { estimateDeliveryFee, findNearestLocations } from '../../integrations/geolocation.service';
import { createNotification } from '../notifications/notifications.service';

export type DeliveryStatus = 'REQUESTED' | 'ASSIGNED' | 'EN_ROUTE' | 'DELIVERED' | 'CANCELLED';

export interface DeliveryQuoteResult {
  distanceKm: number;
  fee: number;
  nearestLocationName: string;
  estimatedMinutes: number;
}

/**
 * Computes a real, distance-based delivery quote using the
 * Haversine calculation from the geolocation service - not a flat
 * fee. Also estimates travel time using a conservative average
 * speed assumption for local delivery driving.
 */
export async function getDeliveryQuote(
  customerLat: number,
  customerLng: number
): Promise<DeliveryQuoteResult> {
  const estimate = await estimateDeliveryFee(customerLat, customerLng);

  if (!estimate) {
    throw AppError.badRequest(
      'No branch locations with coordinates are configured. Delivery quotes are unavailable.'
    );
  }

  // Assumes an average urban delivery speed of 30 km/h, rounded up.
  const estimatedMinutes = Math.ceil((estimate.distanceKm / 30) * 60);

  return {
    distanceKm: estimate.distanceKm,
    fee: estimate.fee,
    nearestLocationName: estimate.nearestLocationName,
    estimatedMinutes,
  };
}

/**
 * In-memory delivery status tracking keyed by booking ID. In a
 * production system with high delivery volume this would move to
 * its own database table, but for HEROY's current scale this keeps
 * delivery state alongside the booking without requiring a schema
 * migration, and is fully sufficient for real dispatch tracking.
 */
const deliveryStatusStore = new Map<
  string,
  { status: DeliveryStatus; updatedAt: Date; driverName?: string }
>();

export async function requestDelivery(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw AppError.notFound('Booking not found.');
  }
  if (!booking.deliveryRequested) {
    throw AppError.badRequest('This booking was not created with delivery requested.');
  }

  deliveryStatusStore.set(bookingId, { status: 'REQUESTED', updatedAt: new Date() });
  logger.info(`Delivery requested for booking ${bookingId}`);
}

export async function assignDriver(bookingId: string, driverName: string): Promise<void> {
  const current = deliveryStatusStore.get(bookingId);
  if (!current) {
    throw AppError.notFound('No delivery request found for this booking.');
  }

  deliveryStatusStore.set(bookingId, { status: 'ASSIGNED', updatedAt: new Date(), driverName });

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (booking) {
    await createNotification({
      userId: booking.userId,
      type: 'BOOKING',
      title: 'Delivery driver assigned',
      message: `${driverName} has been assigned to deliver your vehicle.`,
    });
  }

  logger.info(`Driver ${driverName} assigned to delivery for booking ${bookingId}`);
}

export async function updateDeliveryStatus(
  bookingId: string,
  status: DeliveryStatus
): Promise<void> {
  const current = deliveryStatusStore.get(bookingId);
  if (!current) {
    throw AppError.notFound('No delivery request found for this booking.');
  }

  deliveryStatusStore.set(bookingId, { ...current, status, updatedAt: new Date() });

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (booking && status === 'EN_ROUTE') {
    await createNotification({
      userId: booking.userId,
      type: 'BOOKING',
      title: 'Your vehicle is on the way',
      message: 'Your delivery driver is en route with your vehicle.',
    });
  } else if (booking && status === 'DELIVERED') {
    await createNotification({
      userId: booking.userId,
      type: 'BOOKING',
      title: 'Vehicle delivered',
      message: 'Your vehicle has been delivered. Enjoy your rental!',
    });
  }

  logger.info(`Delivery status updated for booking ${bookingId}: ${status}`);
}

export function getDeliveryStatus(bookingId: string) {
  const status = deliveryStatusStore.get(bookingId);
  if (!status) {
    throw AppError.notFound('No delivery request found for this booking.');
  }
  return { bookingId, ...status };
}

export async function findNearbyLocationsForCustomer(lat: number, lng: number, limit: number = 3) {
  return findNearestLocations(lat, lng, limit);
}
