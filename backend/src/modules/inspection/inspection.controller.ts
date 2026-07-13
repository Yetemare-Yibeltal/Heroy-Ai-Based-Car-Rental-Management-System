import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import * as inspectionService from './inspection.service';
import * as bookingsService from '../bookings/bookings.service';
import { CreateInspectionInput } from './inspection.types';

export async function createInspection(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const input = req.body as CreateInspectionInput;
  const report = await inspectionService.createInspection(req.user.userId, input);
  sendSuccess(res, 201, 'Inspection recorded.', report);
}

export async function getInspectionsForBooking(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  await bookingsService.assertBookingOwnership(
    req.params.bookingId,
    req.user.userId,
    req.user.role
  );
  const reports = await inspectionService.getInspectionsForBooking(req.params.bookingId);
  sendSuccess(res, 200, 'Inspection reports fetched.', reports);
}

export async function compareInspections(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  await bookingsService.assertBookingOwnership(
    req.params.bookingId,
    req.user.userId,
    req.user.role
  );
  const result = await inspectionService.compareInspections(req.params.bookingId);
  sendSuccess(res, 200, 'Inspection comparison fetched.', result);
}
