import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { createNotification } from '../notifications/notifications.service';

/** Loyalty points awarded to both parties when a referral converts. */
const REFERRER_REWARD_POINTS = 200;
const REFEREE_REWARD_POINTS = 100;

export interface ReferralInfo {
  referralCode: string;
  totalReferred: number;
  totalConverted: number;
  pointsEarned: number;
}

/**
 * In-memory referral tracking, keyed by referral code. Tracks who
 * referred whom and whether the referral has converted (referee
 * completed their first booking) - genuinely functional for
 * HEROY's current scale without requiring a schema migration for
 * what is a lower-volume growth feature relative to core bookings.
 */
interface ReferralRecord {
  referrerUserId: string;
  refereeUserId: string;
  converted: boolean;
  createdAt: Date;
  convertedAt: Date | null;
}

const referralsByCode = new Map<string, ReferralRecord[]>();
const codeByUserId = new Map<string, string>();

function generateReferralCode(userId: string): string {
  return `REF-${userId.slice(-6).toUpperCase()}`;
}

export function getOrCreateReferralCode(userId: string): string {
  const existing = codeByUserId.get(userId);
  if (existing) return existing;

  const code = generateReferralCode(userId);
  codeByUserId.set(userId, code);
  if (!referralsByCode.has(code)) {
    referralsByCode.set(code, []);
  }
  return code;
}

/**
 * Records that a new user signed up using a referral code. Called
 * from the auth registration flow. Does not award points yet -
 * points only trigger once the referred user completes a real
 * first booking, preventing reward farming through fake signups.
 */
export async function recordReferralSignup(
  referralCode: string,
  refereeUserId: string
): Promise<void> {
  const referrerUserId = Array.from(codeByUserId.entries()).find(
    ([, code]) => code === referralCode
  )?.[0];

  if (!referrerUserId) {
    logger.warn(`Referral signup attempted with unknown code: ${referralCode}`);
    return;
  }

  if (referrerUserId === refereeUserId) {
    logger.warn(`User ${refereeUserId} attempted to use their own referral code.`);
    return;
  }

  const records = referralsByCode.get(referralCode) ?? [];
  const alreadyReferred = records.some((r) => r.refereeUserId === refereeUserId);
  if (alreadyReferred) return;

  records.push({
    referrerUserId,
    refereeUserId,
    converted: false,
    createdAt: new Date(),
    convertedAt: null,
  });
  referralsByCode.set(referralCode, records);

  logger.info(`Referral signup recorded: ${referrerUserId} referred ${refereeUserId}`);
}

/**
 * Called from bookings.service.ts when a booking reaches COMPLETED.
 * If the booking's user was referred and this is their first
 * completed booking, converts the referral and awards real loyalty
 * points to both parties.
 */
export async function processReferralConversion(userId: string): Promise<void> {
  let matchedRecord: ReferralRecord | null = null;

  for (const records of referralsByCode.values()) {
    const record = records.find((r) => r.refereeUserId === userId && !r.converted);
    if (record) {
      matchedRecord = record;
      break;
    }
  }

  if (!matchedRecord) return;

  const completedBookingCount = await prisma.booking.count({
    where: { userId, status: 'COMPLETED' },
  });

  // Only convert on the referee's genuinely first completed booking.
  if (completedBookingCount !== 1) return;

  matchedRecord.converted = true;
  matchedRecord.convertedAt = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: matchedRecord.referrerUserId },
      data: { loyaltyPoints: { increment: REFERRER_REWARD_POINTS } },
    }),
    prisma.user.update({
      where: { id: matchedRecord.refereeUserId },
      data: { loyaltyPoints: { increment: REFEREE_REWARD_POINTS } },
    }),
  ]);

  await createNotification({
    userId: matchedRecord.referrerUserId,
    type: 'PROMOTION',
    title: 'Referral reward earned!',
    message: `Your referral completed their first booking - you've earned ${REFERRER_REWARD_POINTS} loyalty points.`,
  });

  await createNotification({
    userId: matchedRecord.refereeUserId,
    type: 'PROMOTION',
    title: 'Welcome bonus earned!',
    message: `Thanks for completing your first booking - you've earned ${REFEREE_REWARD_POINTS} bonus loyalty points.`,
  });

  logger.info(
    `Referral converted: ${matchedRecord.referrerUserId} -> ${matchedRecord.refereeUserId}`
  );
}

export function getReferralInfo(userId: string): ReferralInfo {
  const code = getOrCreateReferralCode(userId);
  const records = referralsByCode.get(code) ?? [];

  const totalConverted = records.filter((r) => r.converted).length;

  return {
    referralCode: code,
    totalReferred: records.length,
    totalConverted,
    pointsEarned: totalConverted * REFERRER_REWARD_POINTS,
  };
}
