import { Router } from 'express';
import * as subscriptionController from './subscription.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { catchAsync } from '../../utils/catchAsync';
import { ADMIN_ROLES } from '../../constants/enums';
import { z } from 'zod';

const createSubscriptionSchema = z.object({
  vehicleId: z.string().cuid('Invalid vehicle ID'),
  plan: z.enum(['WEEKLY', 'MONTHLY']),
  startDate: z.string().datetime('Start date must be a valid ISO date'),
});

export const subscriptionRoutes = Router();

subscriptionRoutes.post(
  '/',
  authenticate,
  validate(createSubscriptionSchema),
  catchAsync(subscriptionController.createSubscription)
);

subscriptionRoutes.get('/me', authenticate, catchAsync(subscriptionController.listMySubscriptions));

subscriptionRoutes.get(
  '/',
  authenticate,
  authorize(...ADMIN_ROLES),
  catchAsync(subscriptionController.listSubscriptions)
);

subscriptionRoutes.patch(
  '/:id/pause',
  authenticate,
  catchAsync(subscriptionController.pauseSubscription)
);

subscriptionRoutes.patch(
  '/:id/resume',
  authenticate,
  catchAsync(subscriptionController.resumeSubscription)
);

subscriptionRoutes.patch(
  '/:id/cancel',
  authenticate,
  catchAsync(subscriptionController.cancelSubscription)
);
