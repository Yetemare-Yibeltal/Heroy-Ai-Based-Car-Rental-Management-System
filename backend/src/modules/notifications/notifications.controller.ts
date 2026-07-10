import { Request, Response } from 'express';
import { sendSuccess, sendPaginated, sendNoContent } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import * as notificationsService from './notifications.service';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../constants/enums';

export async function listMyNotifications(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');

  const page = Math.max(parseInt(String(req.query.page ?? DEFAULT_PAGE), 10), 1);
  const limit = Math.min(
    Math.max(parseInt(String(req.query.limit ?? DEFAULT_PAGE_SIZE), 10), 1),
    MAX_PAGE_SIZE
  );
  const unreadOnly = req.query.unreadOnly === 'true';

  const result = await notificationsService.listMyNotifications(
    req.user.userId,
    page,
    limit,
    unreadOnly
  );

  sendPaginated(res, 'Notifications fetched.', result.notifications, {
    page,
    limit,
    total: result.total,
  });
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const notification = await notificationsService.markAsRead(req.params.id, req.user.userId);
  sendSuccess(res, 200, 'Notification marked as read.', notification);
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  await notificationsService.markAllAsRead(req.user.userId);
  sendSuccess(res, 200, 'All notifications marked as read.', null);
}

export async function deleteNotification(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  await notificationsService.deleteNotification(req.params.id, req.user.userId);
  sendNoContent(res);
}
