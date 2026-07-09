import Stripe from 'stripe';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

if (!env.stripe.secretKey) {
  logger.warn(
    'STRIPE_SECRET_KEY is not set. Payment endpoints will fail until it is configured in .env.'
  );
}

export const stripe = new Stripe(env.stripe.secretKey ?? 'sk_test_placeholder', {
  apiVersion: '2024-06-20',
  typescript: true,
});

/** Stripe amounts are in the smallest currency unit (cents for USD). */
export function toStripeAmount(dollars: number): number {
  return Math.round(dollars * 100);
}

export function fromStripeAmount(cents: number): number {
  return Math.round(cents) / 100;
}
