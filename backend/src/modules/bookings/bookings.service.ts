import { Prisma, BookingStatus, VehicleStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { isVehicleAvailable, getConflictingBookings } from './availability.util';
import { calculatePriceBreakdown } from './pricing.util';
import { awardPointsForBooking } from '../coupons/loyalty.service';
import { emitBookingStatusChanged } from '../../realtime/notifications.gateway';
import { assertUserIsVerified } from '../verification/verification.service';
import {
  CreateBookingInput,
  BookingOutput,
  ListBookingsQuery,
  ListBookingsResult,
} from './bookings.types';

type BookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    user: { select: { id: true; firstName: true; lastName: true; email: true; phone: true } };
    vehicle: { include: { images: true } };
    location: true;
    coupon: true;
    payment: { select: { status: true } };
  };
}>;

const bookingInclude = {
  user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  vehicle: { include: { images: true } },
  location: true,
  coupon: true,
  payment: { select: { status: true } },
} satisfies Prisma.BookingInclude;

function toBookingOutput(booking: BookingWithRelations): BookingOutput {
  const primaryImage =
    booking.vehicle.images.find((img) => img.isPrimary) ?? booking.vehicle.images[0];

  return {
    id: booking.id,
    userId: booking.userId,
    user: booking.user,
    vehicleId: booking.vehicleId,
    vehicle: {
      id: booking.vehicle.id,
      name: booking.vehicle.name,
      brand: booking.vehicle.brand,
      plate: booking.vehicle.plate,
      pricePerDay: booking.vehicle.pricePerDay,
      primaryImageUrl: primaryImage?.url ?? null,
    },
    locationId: booking.locationId,
    locationName: booking.location?.name ?? null,
    startDate: booking.startDate,
    endDate: booking.endDate,
    totalPrice: booking.totalPrice,
    status: booking.status,
    couponCode: booking.coupon?.code ?? null,
    insuranceAddOn: booking.insuranceAddOn,
    deliveryRequested: booking.deliveryRequested,
    deliveryAddress: booking.deliveryAddress,
    paymentStatus: booking.payment?.status ?? null,
    createdAt: booking.createdAt,
  };
}

export async function createBooking(
  userId: string,
  input: CreateBookingInput
): Promise<BookingOutput> {
  await assertUserIsVerified(userId);

  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle) {
    throw AppError.notFound('Vehicle not found.');
  }

  if (vehicle.status === VehicleStatus.MAINTENANCE || vehicle.status === VehicleStatus.RETIRED) {
    throw AppError.badRequest('This vehicle is not currently available for booking.');
  }

  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  const available = await isVehicleAvailable(input.vehicleId, startDate, endDate);
  if (!available) {
    const conflicts = await getConflictingBookings(input.vehicleId, startDate, endDate);
    throw AppError.conflict(
      `This vehicle is already booked for part of the requested period (${conflicts.length} conflicting booking${
        conflicts.length > 1 ? 's' : ''
      }). Please choose different dates.`
    );
  }

  let coupon = null;
  if (input.couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: input.couponCode } });
    if (!coupon) {
      throw AppError.badRequest('Invalid coupon code.');
    }
  }

  const breakdown = calculatePriceBreakdown({
    pricePerDay: vehicle.pricePerDay,
    startDate,
    endDate,
    insuranceAddOn: input.insuranceAddOn ?? false,
    deliveryRequested: input.deliveryRequested ?? false,
    coupon,
  });

  const booking = await prisma.$transaction(async (tx) => {
    const created = await tx.booking.create({
      data: {
        userId,
        vehicleId: input.vehicleId,
        locationId: input.locationId,
        startDate,
        endDate,
        totalPrice: breakdown.total,
        status: BookingStatus.PENDING,
        couponId: coupon?.id,
        insuranceAddOn: input.insuranceAddOn ?? false,
        deliveryRequested: input.deliveryRequested ?? false,
        deliveryAddress: input.deliveryAddress,
      },
      include: bookingInclude,
    });

    if (coupon) {
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    return created;
  });

  logger.info(`Booking created: ${booking.id} for vehicle ${vehicle.plate}`);

  return toBookingOutput(booking);
}

export async function getBookingById(bookingId: string): Promise<BookingOutput> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  });

  if (!booking) {
    throw AppError.notFound('Booking not found.');
  }

  return toBookingOutput(booking);
}

export async function assertBookingOwnership(
  bookingId: string,
  userId: string,
  userRole: string
): Promise<void> {
  const staffRoles = ['STAFF', 'BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'];
  if (staffRoles.includes(userRole)) return;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw AppError.notFound('Booking not found.');
  }
  if (booking.userId !== userId) {
    throw AppError.forbidden('You do not have access to this booking.');
  }
}

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.ACTIVE, BookingStatus.CANCELLED],
  [BookingStatus.ACTIVE]: [BookingStatus.COMPLETED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
};

export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus
): Promise<BookingOutput> {
  const existing = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { vehicle: { select: { name: true } } },
  });
  if (!existing) {
    throw AppError.notFound('Booking not found.');
  }

  const allowedNext = VALID_TRANSITIONS[existing.status];
  if (!allowedNext.includes(newStatus)) {
    throw AppError.badRequest(
      `Cannot change booking status from ${existing.status} to ${newStatus}.`
    );
  }

  const booking = await prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
      include: bookingInclude,
    });

    if (newStatus === BookingStatus.ACTIVE) {
      await tx.vehicle.update({
        where: { id: existing.vehicleId },
        data: { status: VehicleStatus.RENTED },
      });
    } else if (newStatus === BookingStatus.COMPLETED || newStatus === BookingStatus.CANCELLED) {
      await tx.vehicle.update({
        where: { id: existing.vehicleId },
        data: { status: VehicleStatus.AVAILABLE },
      });
    }

    return updated;
  });

  if (newStatus === BookingStatus.COMPLETED) {
    await awardPointsForBooking(existing.userId, existing.totalPrice);
  }

  emitBookingStatusChanged(existing.userId, {
    bookingId: existing.id,
    status: newStatus,
    vehicleName: existing.vehicle.name,
  });

  logger.info(`Booking ${bookingId} status changed: ${existing.status} -> ${newStatus}`);

  return toBookingOutput(booking);
}

export async function cancelBooking(bookingId: string): Promise<BookingOutput> {
  const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!existing) {
    throw AppError.notFound('Booking not found.');
  }

  const cancellableStatuses: BookingStatus[] = [BookingStatus.PENDING, BookingStatus.CONFIRMED];
  if (!cancellableStatuses.includes(existing.status)) {
    throw AppError.badRequest(
      'This booking can no longer be cancelled. It may already be active or completed.'
    );
  }

  return updateBookingStatus(bookingId, BookingStatus.CANCELLED);
}

export async function listBookings(query: ListBookingsQuery): Promise<ListBookingsResult> {
  const where: Prisma.BookingWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.userId) where.userId = query.userId;
  if (query.vehicleId) where.vehicleId = query.vehicleId;

  if (query.startDateFrom || query.startDateTo) {
    where.startDate = {
      ...(query.startDateFrom ? { gte: new Date(query.startDateFrom) } : {}),
      ...(query.startDateTo ? { lte: new Date(query.startDateTo) } : {}),
    };
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings: bookings.map(toBookingOutput),
    total,
  };
}

export async function getQuote(
  vehicleId: string,
  startDate: string,
  endDate: string,
  insuranceAddOn: boolean,
  deliveryRequested: boolean,
  couponCode?: string
) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) {
    throw AppError.notFound('Vehicle not found.');
  }

  let coupon = null;
  if (couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon) {
      throw AppError.badRequest('Invalid coupon code.');
    }
  }

  return calculatePriceBreakdown({
    pricePerDay: vehicle.pricePerDay,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    insuranceAddOn,
    deliveryRequested,
    coupon,
  });
}
