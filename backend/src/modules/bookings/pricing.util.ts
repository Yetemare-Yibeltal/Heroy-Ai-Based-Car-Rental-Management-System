import { Coupon, CouponType } from '@prisma/client';
import { AppError } from '../../utils/AppError';
import { calculateRentalDays } from './availability.util';
import { PriceBreakdown } from './bookings.types';

/** Flat daily cost of the optional insurance add-on. */
const INSURANCE_COST_PER_DAY = 8;

/** Flat one-time fee for requesting vehicle delivery instead of branch pickup. */
const DELIVERY_FLAT_FEE = 15;

interface PriceInputs {
  pricePerDay: number;
  startDate: Date;
  endDate: Date;
  insuranceAddOn: boolean;
  deliveryRequested: boolean;
  coupon?: Coupon | null;
}

/**
 * Validates that a coupon is currently usable - active, not expired,
 * and under its max-use limit. Throws an AppError if not.
 */
export function validateCoupon(coupon: Coupon): void {
  if (!coupon.active) {
    throw AppError.badRequest('This coupon is no longer active.');
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw AppError.badRequest('This coupon has expired.');
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw AppError.badRequest('This coupon has reached its usage limit.');
  }
}

function calculateDiscount(subtotal: number, coupon: Coupon): number {
  if (coupon.type === CouponType.PERCENTAGE) {
    return Math.round(subtotal * (coupon.value / 100) * 100) / 100;
  }
  // FIXED discount, capped so it can never make the total negative.
  return Math.min(coupon.value, subtotal);
}

/**
 * Computes the full price breakdown for a booking. This is the
 * single function both the booking creation flow and any "get me a
 * quote" endpoint should call, so the customer always sees the same
 * number they'll actually be charged.
 */
export function calculatePriceBreakdown(inputs: PriceInputs): PriceBreakdown {
  const days = calculateRentalDays(inputs.startDate, inputs.endDate);
  const subtotal = Math.round(inputs.pricePerDay * days * 100) / 100;

  const insuranceCost = inputs.insuranceAddOn ? INSURANCE_COST_PER_DAY * days : 0;
  const deliveryCost = inputs.deliveryRequested ? DELIVERY_FLAT_FEE : 0;

  let discount = 0;
  if (inputs.coupon) {
    validateCoupon(inputs.coupon);
    discount = calculateDiscount(subtotal, inputs.coupon);
  }

  const total = Math.max(subtotal + insuranceCost + deliveryCost - discount, 0);

  return {
    days,
    pricePerDay: inputs.pricePerDay,
    subtotal,
    insuranceCost,
    deliveryCost,
    discount,
    total: Math.round(total * 100) / 100,
  };
}
