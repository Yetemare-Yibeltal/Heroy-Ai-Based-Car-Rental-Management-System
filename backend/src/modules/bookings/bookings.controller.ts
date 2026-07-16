import { Request, Response } from 'express';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import * as bookingsService from './bookings.service';
import { CreateBookingSchema, UpdateBookingStatusSchema } from './bookings.validation';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, STAFF_ROLES } from '../../constants/enums';
import { BookingStatus } from '@prisma/client';

export async function createBooking(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const input = req.body as CreateBookingSchema;
  const booking = await bookingsService.createBooking(req.user.userId, input);
  sendSuccess(res, 201, 'Booking created. Awaiting confirmation.', booking);
}

export async function getQuote(req: Request, res: Response): Promise<void> {
  const {
    vehicleId,
    startDate,
    endDate,
    insuranceAddOn,
    deliveryRequested,
    couponCode,
    locationId,
  } = req.query as {
    vehicleId: string;
    startDate: string;
    endDate: string;
    insuranceAddOn?: string;
    deliveryRequested?: string;
    couponCode?: string;
    locationId?: string;
  };

  const quote = await bookingsService.getQuote(
    vehicleId,
    startDate,
    endDate,
    insuranceAddOn === 'true',
    deliveryRequested === 'true',
    couponCode,
    locationId
  );

  sendSuccess(res, 200, 'Quote calculated.', quote);
}

export async function getBookingById(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  await bookingsService.assertBookingOwnership(req.params.id, req.user.userId, req.user.role);
  const booking = await bookingsService.getBookingById(req.params.id);
  sendSuccess(res, 200, 'Booking fetched.', booking);
}

export async function listBookings(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');

  const page = Math.max(parseInt(String(req.query.page ?? DEFAULT_PAGE), 10), 1);
  const limit = Math.min(
    Math.max(parseInt(String(req.query.limit ?? DEFAULT_PAGE_SIZE), 10), 1),
    MAX_PAGE_SIZE
  );

  const isStaff = (STAFF_ROLES as readonly string[]).includes(req.user.role);

  const result = await bookingsService.listBookings({
    page,
    limit,
    status: req.query.status as BookingStatus | undefined,
    userId: isStaff ? (req.query.userId as string | undefined) : req.user.userId,
    vehicleId: req.query.vehicleId as string | undefined,
    startDateFrom: req.query.startDateFrom as string | undefined,
    startDateTo: req.query.startDateTo as string | undefined,
  });

  sendPaginated(res, 'Bookings fetched.', result.bookings, { page, limit, total: result.total });
}

export async function updateBookingStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body as UpdateBookingStatusSchema;
  const booking = await bookingsService.updateBookingStatus(req.params.id, status);
  sendSuccess(res, 200, 'Booking status updated.', booking);
}

export async function cancelBooking(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  await bookingsService.assertBookingOwnership(req.params.id, req.user.userId, req.user.role);
  const booking = await bookingsService.cancelBooking(req.params.id);
  sendSuccess(res, 200, 'Booking cancelled.', booking);
}
