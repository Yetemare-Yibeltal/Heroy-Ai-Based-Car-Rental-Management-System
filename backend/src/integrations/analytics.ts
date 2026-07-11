import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

export type AnalyticsEventName =
  | 'user_signed_up'
  | 'user_logged_in'
  | 'vehicle_viewed'
  | 'booking_created'
  | 'booking_cancelled'
  | 'payment_completed'
  | 'ai_chat_started'
  | 'review_submitted'
  | 'coupon_redeemed';

export async function trackEvent(
  eventName: AnalyticsEventName,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventName,
        userId,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    logger.error(`Failed to track analytics event: ${eventName}`, err as Error);
  }
}

export async function getEventCounts(
  eventName: AnalyticsEventName,
  daysBack: number = 30
): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  return prisma.analyticsEvent.count({
    where: { eventName, createdAt: { gte: since } },
  });
}

export async function getEventTimeline(
  eventName: AnalyticsEventName,
  daysBack: number = 30
): Promise<{ date: string; count: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const events = await prisma.analyticsEvent.findMany({
    where: { eventName, createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();

  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }

  for (const event of events) {
    const key = event.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}
