import cron from 'node-cron';
import { BookingStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { updateBookingStatus } from '../modules/bookings/bookings.service';
import { LATE_RETURN_GRACE_MINUTES } from '../constants/enums';

/**
 * Finds bookings that are still ACTIVE but whose return date passed
 * more than the grace period ago, and auto-completes them. This
 * reuses updateBookingStatus so vehicle status updates and loyalty
 * point awarding (wired in Phase 9) happen exactly the same way as
 * a manual staff completion would.
 */
async function autoCompleteOverdueBookings(): Promise<void> {
  const cutoff = new Date(Date.now() - LATE_RETURN_GRACE_MINUTES * 60 * 1000);

  const overdueBookings = await prisma.booking.findMany({
    where: {
      status: BookingStatus.ACTIVE,
      endDate: { lt: cutoff },
    },
    select: { id: true },
  });

  for (const booking of overdueBookings) {
    try {
      await updateBookingStatus(booking.id, BookingStatus.COMPLETED);
      logger.info(`Auto-completed overdue booking ${booking.id}`);
    } catch (err) {
      logger.error(`Failed to auto-complete booking ${booking.id}`, err as Error);
    }
  }

  if (overdueBookings.length > 0) {
    logger.info(`Auto-completed ${overdueBookings.length} overdue booking(s).`);
  }
}

/**
 * Registers the cron schedule. Runs every 15 minutes - frequent
 * enough to close out overdue rentals promptly, without hammering
 * the database constantly.
 */
export function startAutoCompleteJob(): void {
  cron.schedule('*/15 * * * *', async () => {
    logger.info('Running auto-complete job for overdue bookings...');
    try {
      await autoCompleteOverdueBookings();
    } catch (err) {
      logger.error('Auto-complete job failed', err as Error);
    }
  });

  logger.info('Auto-complete job scheduled (runs every 15 minutes).');
}
