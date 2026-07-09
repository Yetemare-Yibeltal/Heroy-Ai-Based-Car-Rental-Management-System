import { BookingStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

/** Booking statuses that actually hold a vehicle's calendar slot. */
const BLOCKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.ACTIVE,
];

/**
 * Two date ranges overlap if one starts before the other ends,
 * in both directions. This is the standard interval-overlap check:
 *   existing.start < requested.end AND requested.start < existing.end
 */
export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Checks whether a specific vehicle is free for the given date range,
 * optionally excluding one booking ID (used when updating an existing
 * booking's dates, so it doesn't collide with itself).
 */
export async function isVehicleAvailable(
  vehicleId: string,
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string
): Promise<boolean> {
  const conflictCount = await prisma.booking.count({
    where: {
      vehicleId,
      status: { in: BLOCKING_STATUSES },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
  });

  return conflictCount === 0;
}

/**
 * Returns every conflicting booking for a vehicle and date range,
 * useful for admin-facing error messages that explain exactly why
 * a vehicle isn't available.
 */
export async function getConflictingBookings(
  vehicleId: string,
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string
) {
  return prisma.booking.findMany({
    where: {
      vehicleId,
      status: { in: BLOCKING_STATUSES },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: { id: true, startDate: true, endDate: true, status: true },
  });
}

/**
 * Number of whole days between two dates, always at least 1 -
 * a same-day pickup/return still counts as a 1-day rental.
 */
export function calculateRentalDays(startDate: Date, endDate: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.round((endDate.getTime() - startDate.getTime()) / msPerDay);
  return Math.max(days, 1);
}
