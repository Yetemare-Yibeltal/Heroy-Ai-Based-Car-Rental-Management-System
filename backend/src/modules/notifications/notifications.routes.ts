import { Router } from 'express';
import * as notificationsController from './notifications.controller';
import { authenticate } from '../../middleware/auth';
import { catchAsync } from '../../utils/catchAsync';

export const notificationsRoutes = Router();

notificationsRoutes.get('/', authenticate, catchAsync(notificationsController.listMyNotifications));

notificationsRoutes.patch(
  '/read-all',
  authenticate,
  catchAsync(notificationsController.markAllAsRead)
);

notificationsRoutes.patch(
  '/:id/read',
  authenticate,
  catchAsync(notificationsController.markAsRead)
);

notificationsRoutes.delete(
  '/:id',
  authenticate,
  catchAsync(notificationsController.deleteNotification)
);
