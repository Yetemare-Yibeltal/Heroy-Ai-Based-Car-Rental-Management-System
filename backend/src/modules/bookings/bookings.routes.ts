import { Router } from 'express';
import * as bookingsController from './bookings.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { catchAsync } from '../../utils/catchAsync';
import { STAFF_ROLES } from '../../constants/enums';
import {
  createBookingSchema,
  updateBookingStatusSchema,
  listBookingsQuerySchema,
} from './bookings.validation';

export const bookingsRoutes = Router();

bookingsRoutes.get('/quote', authenticate, catchAsync(bookingsController.getQuote));

bookingsRoutes.post(
  '/',
  authenticate,
  validate(createBookingSchema),
  catchAsync(bookingsController.createBooking)
);

bookingsRoutes.get(
  '/',
  authenticate,
  validate(listBookingsQuerySchema, 'query'),
  catchAsync(bookingsController.listBookings)
);

bookingsRoutes.get('/:id', authenticate, catchAsync(bookingsController.getBookingById));

bookingsRoutes.patch(
  '/:id/status',
  authenticate,
  authorize(...STAFF_ROLES),
  validate(updateBookingStatusSchema),
  catchAsync(bookingsController.updateBookingStatus)
);

bookingsRoutes.post('/:id/cancel', authenticate, catchAsync(bookingsController.cancelBooking));
