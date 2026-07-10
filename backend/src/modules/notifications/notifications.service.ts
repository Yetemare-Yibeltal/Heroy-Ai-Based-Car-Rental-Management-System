import { NotificationType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
}

/**
 * Creates a notification for a user. Called internally by other
 * modules (bookings, payments, maintenance, etc.) rather than
 * exposed as a public "create notification for anyone" endpoint.
 */
export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
    },
  });
}

export async function listMyNotifications(
  userId: string,
  page: number,
  limit: number,
  unreadOnly: boolean
) {
  const where = { userId, ...(unreadOnly ? { read: false } : {}) };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return { notifications, total, unreadCount };
}

export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });

  if (!notification) {
    throw AppError.notFound('Notification not found.');
  }
  if (notification.userId !== userId) {
    throw AppError.forbidden('This notification does not belong to you.');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });

  if (!notification) {
    throw AppError.notFound('Notification not found.');
  }
  if (notification.userId !== userId) {
    throw AppError.forbidden('This notification does not belong to you.');
  }

  await prisma.notification.delete({ where: { id: notificationId } });
}
