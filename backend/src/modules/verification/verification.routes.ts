import { Router } from 'express';
import * as verificationController from './verification.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { catchAsync } from '../../utils/catchAsync';
import { STAFF_ROLES } from '../../constants/enums';
import {
  submitVerificationSchema,
  reviewVerificationSchema,
  listVerificationsQuerySchema,
} from './verification.validation';

export const verificationRoutes = Router();

verificationRoutes.post(
  '/',
  authenticate,
  validate(submitVerificationSchema),
  catchAsync(verificationController.submitVerification)
);

verificationRoutes.get('/me', authenticate, catchAsync(verificationController.listMyVerifications));

verificationRoutes.get(
  '/',
  authenticate,
  authorize(...STAFF_ROLES),
  validate(listVerificationsQuerySchema, 'query'),
  catchAsync(verificationController.listVerifications)
);

verificationRoutes.patch(
  '/:id/review',
  authenticate,
  authorize(...STAFF_ROLES),
  validate(reviewVerificationSchema),
  catchAsync(verificationController.reviewVerification)
);
