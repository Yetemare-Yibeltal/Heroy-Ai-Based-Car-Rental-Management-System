import { Prisma, SubscriptionPlan, SubscriptionStatus, VehicleStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { CreateSubscriptionInput, SubscriptionOutput } from './subscription.types';

/** Discount applied to the daily rate for committing to a longer period. */
const WEEKLY_DISCOUNT = 0.15;
const MONTHLY_DISCOUNT = 0.3;

function calculatePricePerPeriod(dailyRate: number, plan: SubscriptionPlan): number {
  if (plan === SubscriptionPlan.WEEKLY) {
    return Math.round(dailyRate * 7 * (1 - WEEKLY_DISCOUNT) * 100) / 100;
  }
  return Math.round(dailyRate * 30 * (1 - MONTHLY_DISCOUNT) * 100) / 100;
}

function calculateNextBillingDate(startDate: Date, plan: SubscriptionPlan): Date {
  const next = new Date(startDate);
  if (plan === SubscriptionPlan.WEEKLY) {
    next.setDate(next.getDate() + 7);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

function toOutput(sub: {
  id: string;
  userId: string;
  vehicleId: string;
  vehicle: { name: string; plate: string };
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  pricePerPeriod: number;
  startDate: Date;
  nextBillingDate: Date;
  createdAt: Date;
}): SubscriptionOutput {
  return {
    id: sub.id,
    userId: sub.userId,
    vehicleId: sub.vehicleId,
    vehicleName: sub.vehicle.name,
    vehiclePlate: sub.vehicle.plate,
    plan: sub.plan,
    status: sub.status,
    pricePerPeriod: sub.pricePerPeriod,
    startDate: sub.startDate,
    nextBillingDate: sub.nextBillingDate,
    createdAt: sub.createdAt,
  };
}

const subscriptionInclude = {
  vehicle: { select: { name: true, plate: true } },
} as const;

export async function createSubscription(
  userId: string,
  input: CreateSubscriptionInput
): Promise<SubscriptionOutput> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle) {
    throw AppError.notFound('Vehicle not found.');
  }

  if (vehicle.status !== VehicleStatus.AVAILABLE) {
    throw AppError.badRequest('This vehicle is not currently available for a subscription plan.');
  }

  const existingActive = await prisma.subscription.findFirst({
    where: { vehicleId: input.vehicleId, status: SubscriptionStatus.ACTIVE },
  });
  if (existingActive) {
    throw AppError.conflict('This vehicle already has an active subscription.');
  }

  const startDate = new Date(input.startDate);
  const pricePerPeriod = calculatePricePerPeriod(vehicle.pricePerDay, input.plan);
  const nextBillingDate = calculateNextBillingDate(startDate, input.plan);

  const subscription = await prisma.$transaction(async (tx) => {
    const created = await tx.subscription.create({
      data: {
        userId,
        vehicleId: input.vehicleId,
        plan: input.plan,
        pricePerPeriod,
        startDate,
        nextBillingDate,
      },
      include: subscriptionInclude,
    });

    await tx.vehicle.update({
      where: { id: input.vehicleId },
      data: { status: VehicleStatus.RESERVED },
    });

    return created;
  });

  logger.info(`Subscription created: user ${userId}, vehicle ${vehicle.plate}, plan ${input.plan}`);

  return toOutput(subscription);
}

export async function listMySubscriptions(userId: string): Promise<SubscriptionOutput[]> {
  const subs = await prisma.subscription.findMany({
    where: { userId },
    include: subscriptionInclude,
    orderBy: { createdAt: 'desc' },
  });

  return subs.map(toOutput);
}

export async function listSubscriptions(status?: SubscriptionStatus) {
  const where: Prisma.SubscriptionWhereInput = status ? { status } : {};

  const subs = await prisma.subscription.findMany({
    where,
    include: subscriptionInclude,
    orderBy: { createdAt: 'desc' },
  });

  return subs.map(toOutput);
}

export async function pauseSubscription(
  subscriptionId: string,
  userId: string
): Promise<SubscriptionOutput> {
  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub || sub.userId !== userId) {
    throw AppError.notFound('Subscription not found.');
  }
  if (sub.status !== SubscriptionStatus.ACTIVE) {
    throw AppError.badRequest('Only an active subscription can be paused.');
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: SubscriptionStatus.PAUSED },
    include: subscriptionInclude,
  });

  logger.info(`Subscription ${subscriptionId} paused.`);

  return toOutput(updated);
}

export async function resumeSubscription(
  subscriptionId: string,
  userId: string
): Promise<SubscriptionOutput> {
  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub || sub.userId !== userId) {
    throw AppError.notFound('Subscription not found.');
  }
  if (sub.status !== SubscriptionStatus.PAUSED) {
    throw AppError.badRequest('Only a paused subscription can be resumed.');
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: SubscriptionStatus.ACTIVE,
      nextBillingDate: calculateNextBillingDate(new Date(), sub.plan),
    },
    include: subscriptionInclude,
  });

  logger.info(`Subscription ${subscriptionId} resumed.`);

  return toOutput(updated);
}

export async function cancelSubscription(
  subscriptionId: string,
  userId: string
): Promise<SubscriptionOutput> {
  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub || sub.userId !== userId) {
    throw AppError.notFound('Subscription not found.');
  }
  if (sub.status === SubscriptionStatus.CANCELLED) {
    throw AppError.badRequest('This subscription is already cancelled.');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const cancelled = await tx.subscription.update({
      where: { id: subscriptionId },
      data: { status: SubscriptionStatus.CANCELLED },
      include: subscriptionInclude,
    });

    await tx.vehicle.update({
      where: { id: sub.vehicleId },
      data: { status: VehicleStatus.AVAILABLE },
    });

    return cancelled;
  });

  logger.info(`Subscription ${subscriptionId} cancelled.`);

  return toOutput(updated);
}

/**
 * Advances every active subscription whose billing date has passed
 * to its next period. Intended to be called from a scheduled job
 * (wired in during Phase 25's remaining steps) rather than on-demand.
 */
export async function advanceDueBillingCycles(): Promise<number> {
  const dueSubscriptions = await prisma.subscription.findMany({
    where: { status: SubscriptionStatus.ACTIVE, nextBillingDate: { lte: new Date() } },
  });

  for (const sub of dueSubscriptions) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { nextBillingDate: calculateNextBillingDate(sub.nextBillingDate, sub.plan) },
    });
  }

  if (dueSubscriptions.length > 0) {
    logger.info(`Advanced billing cycle for ${dueSubscriptions.length} subscription(s).`);
  }

  return dueSubscriptions.length;
}
