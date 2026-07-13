import { Router } from 'express';
import * as inspectionController from './inspection.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { catchAsync } from '../../utils/catchAsync';
import { STAFF_ROLES } from '../../constants/enums';
import { createInspectionSchema } from './inspection.validation';

export const inspectionRoutes = Router();

inspectionRoutes.post(
  '/',
  authenticate,
  authorize(...STAFF_ROLES),
  validate(createInspectionSchema),
  catchAsync(inspectionController.createInspection)
);

inspectionRoutes.get(
  '/booking/:bookingId',
  authenticate,
  catchAsync(inspectionController.getInspectionsForBooking)
);

inspectionRoutes.get(
  '/booking/:bookingId/compare',
  authenticate,
  catchAsync(inspectionController.compareInspections)
);
