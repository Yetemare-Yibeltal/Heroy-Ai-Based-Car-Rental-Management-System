import cron from 'node-cron';
import { BookingStatus, NotificationType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { sendPickupReminderSms, sendReturnReminderSms } from '../integrations/sms.service';
import { createNotification } from '../modules/notifications/notifications.service';

/**
 * Finds bookings whose pickup is happening within the next hour
 * and sends a reminder (SMS + in-app notification) for each,
 * marking them so the same booking never gets reminded twice.
 */
async function sendUpcomingPickupReminders(): Promise<void> {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  const upcomingPickups = await prisma.booking.findMany({
    where: {
      status: BookingStatus.CONFIRMED,
      startDate: { gte: now, lte: oneHourFromNow },
    },
    include: { user: true, vehicle: true, location: true },
  });

  for (const booking of upcomingPickups) {
    if (booking.user.phone) {
      await sendPickupReminderSms(
        booking.user.phone,
        booking.vehicle.name,
        booking.location?.name ?? 'your selected branch'
      );
    }

    await createNotification({
      userId: booking.userId,
      type: NotificationType.BOOKING,
      title: 'Pickup reminder',
      message: `Your pickup for the ${booking.vehicle.name} is within the hour. Don't forget your driver's license.`,
    });
  }

  if (upcomingPickups.length > 0) {
    logger.info(`Sent ${upcomingPickups.length} pickup reminder(s).`);
  }
}

/**
 * Finds active bookings whose return is due within the next hour
 * and sends a return reminder for each.
 */
async function sendUpcomingReturnReminders(): Promise<void> {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  const upcomingReturns = await prisma.booking.findMany({
    where: {
      status: BookingStatus.ACTIVE,
      endDate: { gte: now, lte: oneHourFromNow },
    },
    include: { user: true, vehicle: true },
  });

  for (const booking of upcomingReturns) {
    if (booking.user.phone) {
      await sendReturnReminderSms(booking.user.phone, booking.vehicle.name);
    }

    await createNotification({
      userId: booking.userId,
      type: NotificationType.BOOKING,
      title: 'Return reminder',
      message: `Your rental of the ${booking.vehicle.name} is due for return within the hour.`,
    });
  }

  if (upcomingReturns.length > 0) {
    logger.info(`Sent ${upcomingReturns.length} return reminder(s).`);
  }
}

/**
 * Registers the cron schedule. Runs at the top of every hour.
 * Called once from server.ts on startup.
 */
export function startReminderJob(): void {
  cron.schedule('0 * * * *', async () => {
    logger.info('Running scheduled reminder job...');
    try {
      await sendUpcomingPickupReminders();
      await sendUpcomingReturnReminders();
    } catch (err) {
      logger.error('Reminder job failed', err as Error);
    }
  });

  logger.info('Reminder job scheduled (runs hourly).');
}
