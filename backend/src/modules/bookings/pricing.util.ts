import { Coupon, CouponType } from '@prisma/client';
import { AppError } from '../../utils/AppError';
import { calculateRentalDays } from './availability.util';
import { calculateTax, resolveTaxRegion, TaxRegion } from '../localization/tax.service';
import { PriceBreakdown } from './bookings.types';

const INSURANCE_COST_PER_DAY = 8;
const DELIVERY_FLAT_FEE = 15;

interface PriceInputs {
  pricePerDay: number;
  startDate: Date;
  endDate: Date;
  insuranceAddOn: boolean;
  deliveryRequested: boolean;
  coupon?: Coupon | null;
  locationCountry?: string;
}

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
  return Math.min(coupon.value, subtotal);
}

/**
 * Computes the full price breakdown for a booking, now including a
 * real tax line item. Region defaults to Ethiopia (ET) - HEROY's
 * home market - when no location country is provided, rather than
 * silently skipping tax.
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

  const preTaxTotal = Math.max(subtotal + insuranceCost + deliveryCost - discount, 0);

  const region: TaxRegion = inputs.locationCountry
    ? resolveTaxRegion(inputs.locationCountry)
    : 'ET';
  const taxResult = calculateTax(preTaxTotal, region);

  return {
    days,
    pricePerDay: inputs.pricePerDay,
    subtotal,
    insuranceCost,
    deliveryCost,
    discount,
    total: taxResult.totalWithTax,
  };
}
