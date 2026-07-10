import { Request, Response } from 'express';
import crypto from 'crypto';
import Stripe from 'stripe';
import { PaymentMethod } from '@prisma/client';
import { stripe } from './stripe.client';
import { verifyChapaTransaction } from './chapa.client';
import { markPaymentPaid, markPaymentFailed } from './payments.service';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/prisma';

/**
 * Handles Stripe's webhook. Stripe signs every webhook payload with
 * a secret only Stripe and our server know - constructEvent throws
 * if the signature doesn't match, which protects against forged
 * "payment succeeded" requests from anyone else.
 */
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.headers['stripe-signature'] as string | undefined;

  if (!signature || !env.stripe.webhookSecret) {
    res.status(400).send('Missing Stripe signature or webhook secret.');
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.stripe.webhookSecret);
  } catch (err) {
    logger.error('Stripe webhook signature verification failed.', err as Error);
    res.status(400).send('Webhook signature verification failed.');
    return;
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent;
      const bookingId = intent.metadata?.bookingId;
      if (bookingId) {
        await markPaymentPaid(bookingId, PaymentMethod.CARD);
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent;
      const bookingId = intent.metadata?.bookingId;
      if (bookingId) {
        await markPaymentFailed(bookingId);
      }
      break;
    }
    default:
      logger.info(`Unhandled Stripe webhook event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
}

/**
 * Handles Chapa's webhook/callback. Chapa signs its webhook payload
 * with an HMAC-SHA256 hash of the raw body using your webhook secret.
 * We verify that signature first, then independently re-verify the
 * transaction status directly with Chapa's API (rather than trusting
 * the webhook body's status field alone) before marking it paid.
 */
export async function handleChapaWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.headers['chapa-signature'] as string | undefined;

  if (env.chapa?.webhookSecret) {
    if (!signature) {
      res.status(400).send('Missing Chapa signature.');
      return;
    }

    const expectedSignature = crypto
      .createHmac('sha256', env.chapa.webhookSecret)
      .update(req.body)
      .digest('hex');

    if (signature !== expectedSignature) {
      logger.error('Chapa webhook signature verification failed.');
      res.status(400).send('Webhook signature verification failed.');
      return;
    }
  } else {
    logger.warn(
      'CHAPA_WEBHOOK_SECRET not set - skipping signature verification. Set this in production.'
    );
  }

  let payload: { tx_ref?: string };
  try {
    payload = JSON.parse(req.body.toString());
  } catch {
    res.status(400).send('Invalid webhook payload.');
    return;
  }

  const txRef = payload.tx_ref;
  if (!txRef) {
    res.status(400).send('Missing transaction reference.');
    return;
  }

  const payment = await prisma.payment.findUnique({ where: { chapaTxRef: txRef } });
  if (!payment) {
    logger.warn(`Chapa webhook received for unknown tx_ref: ${txRef}`);
    res.status(200).json({ received: true });
    return;
  }

  // Always re-verify directly with Chapa rather than trusting the
  // webhook body's own status field.
  const verification = await verifyChapaTransaction(txRef);

  if (verification.status === 'success') {
    const method = mapChapaMethod(verification.payment_method);
    await markPaymentPaid(payment.bookingId, method);
  } else if (verification.status === 'failed') {
    await markPaymentFailed(payment.bookingId);
  } else {
    logger.info(`Chapa transaction ${txRef} still pending.`);
  }

  res.status(200).json({ received: true });
}

function mapChapaMethod(chapaMethod?: string): PaymentMethod {
  switch (chapaMethod?.toLowerCase()) {
    case 'telebirr':
      return PaymentMethod.TELEBIRR;
    case 'cbebirr':
    case 'cbe_birr':
      return PaymentMethod.CBE_BIRR;
    case 'hellocash':
      return PaymentMethod.HELLOCASH;
    default:
      return PaymentMethod.CARD;
  }
}
