import { CouponType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { createNotification } from '../notifications/notifications.service';

const REFERRER_REWARD_VALUE = 20;
const REFERRED_REWARD_VALUE = 10;

interface ReferralRecord {
  referrerUserId: string;
  referredUserId: string;
  rewarded: boolean;
  createdAt: Date;
}

const referralRecords = new Map<string, ReferralRecord>();

/**
 * Generates a real, stable, shareable referral code for a user
 * derived from their user ID - no separate database field needed,
 * and it's deterministic so the same user always gets the same code.
 */
export function getReferralCode(userId: string): string {
  return `HEROY-${userId.slice(-8).toUpperCase()}`;
}

function resolveUserIdFromCode(code: string): string | null {
  const suffix = code.replace('HEROY-', '').toLowerCase();
  return suffix.length === 8 ? suffix : null;
}

/**
 * Records that a new user signed up using a referral code. Does not
 * issue any reward yet - that only happens once the referred user's
 * first booking is completed, to prevent reward farming via fake
 * sign-ups with no real bookings.
 */
export async function recordReferralSignup(
  referredUserId: string,
  referralCode: string
): Promise<void> {
  const suffix = resolveUserIdFromCode(referralCode);
  if (!suffix) {
    throw AppError.badRequest('Invalid referral code format.');
  }

  const referrer = await prisma.user.findFirst({
    where: { id: { endsWith: suffix } },
  });

  if (!referrer) {
    throw AppError.badRequest('Referral code does not match any existing user.');
  }

  if (referrer.id === referredUserId) {
    throw AppError.badRequest('You cannot refer yourself.');
  }

  referralRecords.set(referredUserId, {
    referrerUserId: referrer.id,
    referredUserId,
    rewarded: false,
    createdAt: new Date(),
  });

  logger.info(`Referral recorded: ${referrer.id} referred ${referredUserId}`);
}

async function createRewardCoupon(userId: string, value: number, label: string): Promise<string> {
  const code = `${label}-${userId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  await prisma.coupon.create({
    data: {
      code,
      type: CouponType.FIXED,
      value,
      maxUses: 1,
      expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    },
  });

  return code;
}

/**
 * Pays out the referral reward once the referred user's first
 * booking reaches COMPLETED status. Both the referrer and the
 * referred customer receive a real, usable discount coupon.
 */
export async function processReferralReward(referredUserId: string): Promise<void> {
  const record = referralRecords.get(referredUserId);
  if (!record || record.rewarded) return;

  const referrerCouponCode = await createRewardCoupon(
    record.referrerUserId,
    REFERRER_REWARD_VALUE,
    'REFER'
  );
  const referredCouponCode = await createRewardCoupon(
    record.referredUserId,
    REFERRED_REWARD_VALUE,
    'WELCOME'
  );

  record.rewarded = true;
  referralRecords.set(referredUserId, record);

  await createNotification({
    userId: record.referrerUserId,
    type: 'PROMOTION',
    title: 'Referral reward earned!',
    message: `Your referral completed their first booking. You've earned a $${REFERRER_REWARD_VALUE} discount coupon: ${referrerCouponCode}`,
  });

  await createNotification({
    userId: record.referredUserId,
    type: 'PROMOTION',
    title: 'Thanks for booking with HEROY!',
    message: `Here's a $${REFERRED_REWARD_VALUE} discount coupon for your next rental: ${referredCouponCode}`,
  });

  logger.info(`Referral reward paid out for ${record.referrerUserId} -> ${referredUserId}`);
}

export function getReferralStats(userId: string) {
  const referrals = Array.from(referralRecords.values()).filter((r) => r.referrerUserId === userId);

  return {
    referralCode: getReferralCode(userId),
    totalReferrals: referrals.length,
    completedReferrals: referrals.filter((r) => r.rewarded).length,
    pendingReferrals: referrals.filter((r) => !r.rewarded).length,
  };
}
