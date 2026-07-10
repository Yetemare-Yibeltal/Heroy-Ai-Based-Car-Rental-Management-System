import { PaymentProvider, PaymentStatus, PaymentMethod, BookingStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { stripe, toStripeAmount } from './stripe.client';
import { initializeChapaTransaction } from './chapa.client';
import { env } from '../../config/env';
import { InitiatePaymentInput, InitiatePaymentResult, PaymentOutput } from './payments.types';

function toPaymentOutput(payment: {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  status: PaymentStatus;
  invoiceUrl: string | null;
  createdAt: Date;
}): PaymentOutput {
  return { ...payment };
}

export async function initiatePayment(
  userId: string,
  input: InitiatePaymentInput
): Promise<InitiatePaymentResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: { user: true, payment: true },
  });

  if (!booking) {
    throw AppError.notFound('Booking not found.');
  }

  if (booking.userId !== userId) {
    throw AppError.forbidden('You do not have access to this booking.');
  }

  if (booking.payment && booking.payment.status === PaymentStatus.PAID) {
    throw AppError.conflict('This booking has already been paid for.');
  }

  if (input.provider === PaymentProvider.STRIPE) {
    const amountCents = toStripeAmount(booking.totalPrice);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: { bookingId: booking.id, userId },
      automatic_payment_methods: { enabled: true },
    });

    await prisma.payment.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        amount: booking.totalPrice,
        currency: 'usd',
        provider: PaymentProvider.STRIPE,
        method: PaymentMethod.CARD,
        status: PaymentStatus.PENDING,
        stripePaymentIntentId: paymentIntent.id,
      },
      update: {
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.PENDING,
        stripePaymentIntentId: paymentIntent.id,
        chapaTxRef: null,
      },
    });

    logger.info(`Stripe payment intent created for booking ${booking.id}`);

    return {
      provider: 'STRIPE',
      clientSecret: paymentIntent.client_secret as string,
      paymentIntentId: paymentIntent.id,
      amount: booking.totalPrice,
      currency: 'usd',
    };
  }

  // CHAPA
  const txRef = `heroy-${booking.id}-${Date.now()}`;

  const checkoutUrl = await initializeChapaTransaction({
    amount: booking.totalPrice,
    currency: 'ETB',
    email: booking.user.email,
    firstName: booking.user.firstName,
    lastName: booking.user.lastName,
    txRef,
    callbackUrl: `${env.clientUrl}/api/payments/chapa/webhook`,
    returnUrl: `${env.clientUrl}/booking/${booking.id}/confirmation`,
    title: 'HEROY Car Rental',
    description: `Payment for booking ${booking.id}`,
  });

  await prisma.payment.upsert({
    where: { bookingId: booking.id },
    create: {
      bookingId: booking.id,
      amount: booking.totalPrice,
      currency: 'ETB',
      provider: PaymentProvider.CHAPA,
      method: PaymentMethod.TELEBIRR,
      status: PaymentStatus.PENDING,
      chapaTxRef: txRef,
    },
    update: {
      provider: PaymentProvider.CHAPA,
      status: PaymentStatus.PENDING,
      chapaTxRef: txRef,
      stripePaymentIntentId: null,
    },
  });

  logger.info(`Chapa transaction initialized for booking ${booking.id}: ${txRef}`);

  return {
    provider: 'CHAPA',
    checkoutUrl,
    txRef,
    amount: booking.totalPrice,
    currency: 'ETB',
  };
}

export async function markPaymentPaid(bookingId: string, method: PaymentMethod): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { bookingId },
      data: { status: PaymentStatus.PAID, method },
    });

    await tx.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED },
    });
  });

  logger.info(`Payment confirmed and booking ${bookingId} moved to CONFIRMED.`);
}

export async function markPaymentFailed(bookingId: string): Promise<void> {
  await prisma.payment.update({
    where: { bookingId },
    data: { status: PaymentStatus.FAILED },
  });

  logger.warn(`Payment failed for booking ${bookingId}.`);
}

export async function getPaymentByBooking(bookingId: string): Promise<PaymentOutput | null> {
  const payment = await prisma.payment.findUnique({ where: { bookingId } });
  return payment ? toPaymentOutput(payment) : null;
}

export async function refundPayment(bookingId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({ where: { bookingId } });
  if (!payment) {
    throw AppError.notFound('No payment found for this booking.');
  }
  if (payment.status !== PaymentStatus.PAID) {
    throw AppError.badRequest('Only paid bookings can be refunded.');
  }

  if (payment.provider === PaymentProvider.STRIPE && payment.stripePaymentIntentId) {
    await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });
  } else if (payment.provider === PaymentProvider.CHAPA) {
    // Chapa refunds are currently handled manually through their
    // merchant dashboard rather than a public API endpoint - we
    // record the refund status here and reconcile with Chapa support.
    logger.warn(
      `Chapa refund requested for booking ${bookingId} - process manually via Chapa dashboard.`
    );
  }

  await prisma.payment.update({
    where: { bookingId },
    data: { status: PaymentStatus.REFUNDED },
  });

  logger.info(`Payment refunded for booking ${bookingId}`);
}
