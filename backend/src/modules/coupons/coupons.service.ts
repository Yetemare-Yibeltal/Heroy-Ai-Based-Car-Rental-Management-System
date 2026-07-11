import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { validateCoupon } from '../bookings/pricing.util';
import { CreateCouponSchema, UpdateCouponSchema } from './coupons.validation';

export async function createCoupon(input: CreateCouponSchema) {
  const existing = await prisma.coupon.findUnique({ where: { code: input.code } });
  if (existing) {
    throw AppError.conflict('A coupon with this code already exists.');
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: input.code,
      type: input.type,
      value: input.value,
      maxUses: input.maxUses,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    },
  });

  logger.info(`Coupon created: ${coupon.code}`);
  return coupon;
}

export async function listCoupons(page: number, limit: number) {
  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.coupon.count(),
  ]);

  return { coupons, total };
}

export async function getCouponByCode(code: string) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });
  if (!coupon) {
    throw AppError.notFound('Coupon not found.');
  }
  return coupon;
}

export async function checkCouponValidity(code: string) {
  const coupon = await getCouponByCode(code);
  validateCoupon(coupon);
  return coupon;
}

export async function updateCoupon(couponId: string, input: UpdateCouponSchema) {
  const existing = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!existing) {
    throw AppError.notFound('Coupon not found.');
  }

  const coupon = await prisma.coupon.update({
    where: { id: couponId },
    data: {
      value: input.value,
      maxUses: input.maxUses,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      active: input.active,
    },
  });

  logger.info(`Coupon updated: ${coupon.code}`);
  return coupon;
}

export async function deactivateCoupon(couponId: string) {
  const existing = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!existing) {
    throw AppError.notFound('Coupon not found.');
  }

  const coupon = await prisma.coupon.update({ where: { id: couponId }, data: { active: false } });
  logger.info(`Coupon deactivated: ${coupon.code}`);
  return coupon;
}

export async function deleteCoupon(couponId: string): Promise<void> {
  const existing = await prisma.coupon.findUnique({
    where: { id: couponId },
    include: { _count: { select: { bookings: true } } },
  });

  if (!existing) {
    throw AppError.notFound('Coupon not found.');
  }

  if (existing._count.bookings > 0) {
    throw AppError.conflict(
      'This coupon has been used on existing bookings and cannot be deleted. Deactivate it instead.'
    );
  }

  await prisma.coupon.delete({ where: { id: couponId } });
  logger.info(`Coupon deleted: ${existing.code}`);
}
