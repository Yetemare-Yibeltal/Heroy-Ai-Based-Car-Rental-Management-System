import { Router } from 'express';
import * as growthController from './growth.controller';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { catchAsync } from '../../utils/catchAsync';

export const growthRoutes = Router();

growthRoutes.get('/referrals/me', authenticate, catchAsync(growthController.getMyReferralStats));

growthRoutes.get('/push/vapid-key', catchAsync(growthController.getVapidPublicKey));

growthRoutes.post('/push/subscribe', authenticate, catchAsync(growthController.subscribeToPush));

growthRoutes.post(
  '/push/unsubscribe',
  authenticate,
  catchAsync(growthController.unsubscribeFromPush)
);

growthRoutes.post('/newsletter/subscribe', catchAsync(growthController.subscribeToNewsletter));

growthRoutes.get('/newsletter/confirm', catchAsync(growthController.confirmNewsletter));

growthRoutes.post(
  '/newsletter/unsubscribe',
  catchAsync(growthController.unsubscribeFromNewsletter)
);

growthRoutes.post(
  '/analytics/track',
  optionalAuthenticate,
  catchAsync(growthController.trackAnalyticsEvent)
);
