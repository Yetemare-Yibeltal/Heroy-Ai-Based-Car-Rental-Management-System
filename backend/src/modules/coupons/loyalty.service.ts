import { CouponType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

/** Points earned per dollar spent on a completed booking. */
const POINTS_PER_DOLLAR = 1;

/** How many points are required to redeem a $10-equivalent discount coupon. */
const POINTS_PER_REDEMPTION = 500;
const REDEMPTION_DISCOUNT_VALUE = 10;

/**
 * Awards loyalty points to a user based on a completed booking's
 * total price. Called from bookings.service.ts when a booking's
 * status transitions to COMPLETED.
 */
export async function awardPointsForBooking(userId: string, bookingTotal: number): Promise<void> {
  const pointsEarned = Math.floor(bookingTotal * POINTS_PER_DOLLAR);

  if (pointsEarned <= 0) return;

  await prisma.user.update({
    where: { id: userId },
    data: { loyaltyPoints: { increment: pointsEarned } },
  });

  logger.info(`Awarded ${pointsEarned} loyalty points to user ${userId}`);
}

export async function getLoyaltyBalance(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loyaltyPoints: true },
  });

  if (!user) {
    throw AppError.notFound('User not found.');
  }

  return {
    points: user.loyaltyPoints,
    pointsPerRedemption: POINTS_PER_REDEMPTION,
    redemptionValue: REDEMPTION_DISCOUNT_VALUE,
    redemptionsAvailable: Math.floor(user.loyaltyPoints / POINTS_PER_REDEMPTION),
  };
}

/**
 * Redeems POINTS_PER_REDEMPTION points for a one-time-use fixed
 * discount coupon, generated on the fly and tied to no one else.
 */
export async function redeemPointsForCoupon(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound('User not found.');
  }

  if (user.loyaltyPoints < POINTS_PER_REDEMPTION) {
    throw AppError.badRequest(
      `You need at least ${POINTS_PER_REDEMPTION} points to redeem a discount. You currently have ${user.loyaltyPoints}.`
    );
  }

  const code = `LOYALTY-${userId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const coupon = await prisma.$transaction(async (tx) => {
    const created = await tx.coupon.create({
      data: {
        code,
        type: CouponType.FIXED,
        value: REDEMPTION_DISCOUNT_VALUE,
        maxUses: 1,
        expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { decrement: POINTS_PER_REDEMPTION } },
    });

    return created;
  });

  logger.info(`User ${userId} redeemed ${POINTS_PER_REDEMPTION} points for coupon ${code}`);

  return coupon;
}
