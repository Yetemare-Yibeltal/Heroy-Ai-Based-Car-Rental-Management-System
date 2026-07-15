import { BookingStatus, VerificationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AIToolDefinition } from './ai.types';

export const fraudCheckToolDefinition: AIToolDefinition = {
  name: 'check_booking_fraud_risk',
  description:
    'Analyzes a booking for real fraud-risk signals - account age, verification status, booking value relative to account history, and rapid repeat booking attempts. Use this when staff ask to review a booking for suspicious activity, e.g. "does this booking look risky" or "should we flag this reservation".',
  input_schema: {
    type: 'object',
    properties: {
      bookingId: {
        type: 'string',
        description: 'The ID of the booking to analyze.',
      },
    },
    required: ['bookingId'],
  },
};

interface FraudRiskResult {
  bookingId: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  signals: string[];
  recommendation: string;
}

/**
 * Computes a real fraud-risk score out of 100 based on concrete,
 * checkable signals rather than a black-box guess. Each signal that
 * fires adds real weighted points and is named explicitly so staff
 * can see exactly why a booking was flagged.
 */
export async function checkBookingFraudRisk(bookingId: string): Promise<FraudRiskResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { user: true, vehicle: true },
  });

  if (!booking) {
    throw new Error('Booking not found.');
  }

  const signals: string[] = [];
  let riskScore = 0;

  // Signal 1: brand-new account (created within 24 hours) making a booking.
  const accountAgeHours = (Date.now() - booking.user.createdAt.getTime()) / 3600000;
  if (accountAgeHours < 24) {
    riskScore += 25;
    signals.push(`Account created only ${Math.round(accountAgeHours)} hour(s) ago.`);
  }

  // Signal 2: unverified driver making a high-value booking.
  if (booking.user.verificationStatus !== VerificationStatus.APPROVED && booking.totalPrice > 200) {
    riskScore += 20;
    signals.push(
      `Driver is not yet verified, and this booking is high-value ($${booking.totalPrice}).`
    );
  }

  // Signal 3: this is the user's first-ever booking, and it's for a
  // luxury or sports vehicle - a common fraud pattern (steal-and-flip risk).
  const priorBookingCount = await prisma.booking.count({
    where: { userId: booking.userId, id: { not: bookingId } },
  });
  if (priorBookingCount === 0 && ['LUXURY', 'SPORTS'].includes(booking.vehicle.category)) {
    riskScore += 25;
    signals.push(
      `First-ever booking on this account, and it's for a ${booking.vehicle.category.toLowerCase()} vehicle.`
    );
  }

  // Signal 4: multiple booking attempts on different vehicles within
  // a short window - a pattern consistent with card-testing fraud.
  const oneDayAgo = new Date(Date.now() - 86400000);
  const recentAttempts = await prisma.booking.count({
    where: {
      userId: booking.userId,
      createdAt: { gte: oneDayAgo },
    },
  });
  if (recentAttempts >= 3) {
    riskScore += 20;
    signals.push(`${recentAttempts} booking attempts by this account within the last 24 hours.`);
  }

  // Signal 5: delivery requested to an address, but the booking's
  // payment is still pending - combination that can precede chargebacks.
  if (booking.deliveryRequested && booking.status === BookingStatus.PENDING) {
    riskScore += 10;
    signals.push('Delivery requested on a booking with payment still pending.');
  }

  riskScore = Math.min(riskScore, 100);

  let riskLevel: FraudRiskResult['riskLevel'] = 'LOW';
  let recommendation = 'No significant risk signals detected. Safe to proceed normally.';

  if (riskScore >= 60) {
    riskLevel = 'HIGH';
    recommendation =
      'Multiple strong risk signals present. Recommend manual staff review before confirming this booking.';
  } else if (riskScore >= 30) {
    riskLevel = 'MEDIUM';
    recommendation =
      'Some risk signals present. Consider requesting additional verification before confirming.';
  }

  if (signals.length === 0) {
    signals.push('No risk signals detected for this booking.');
  }

  return {
    bookingId,
    riskScore,
    riskLevel,
    signals,
    recommendation,
  };
}
