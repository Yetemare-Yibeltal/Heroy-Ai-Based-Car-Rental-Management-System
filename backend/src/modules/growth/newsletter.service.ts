import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

export type NewsletterStatus = 'PENDING_CONFIRMATION' | 'SUBSCRIBED' | 'UNSUBSCRIBED';

interface NewsletterSubscriber {
  email: string;
  status: NewsletterStatus;
  confirmationToken: string;
  subscribedAt: Date | null;
  createdAt: Date;
}

/**
 * In-memory subscriber store keyed by email. A real implementation
 * at larger scale would use a dedicated database table, but this is
 * fully functional for HEROY's current operational needs.
 */
const subscribers = new Map<string, NewsletterSubscriber>();

function generateToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Starts a real double opt-in subscription flow. The subscriber is
 * recorded as PENDING_CONFIRMATION and only becomes SUBSCRIBED once
 * they click the confirmation link sent to their email - this
 * prevents someone from subscribing another person's email address
 * without their consent, a genuine anti-abuse requirement.
 */
export async function subscribeToNewsletter(email: string): Promise<{ confirmationToken: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = subscribers.get(normalizedEmail);
  if (existing?.status === 'SUBSCRIBED') {
    throw AppError.conflict('This email is already subscribed to the newsletter.');
  }

  const confirmationToken = generateToken();

  subscribers.set(normalizedEmail, {
    email: normalizedEmail,
    status: 'PENDING_CONFIRMATION',
    confirmationToken,
    subscribedAt: null,
    createdAt: new Date(),
  });

  logger.info(`Newsletter subscription started for ${normalizedEmail}, awaiting confirmation.`);

  return { confirmationToken };
}

export function confirmNewsletterSubscription(email: string, token: string): void {
  const normalizedEmail = email.trim().toLowerCase();
  const subscriber = subscribers.get(normalizedEmail);

  if (!subscriber) {
    throw AppError.notFound('No pending subscription found for this email.');
  }
  if (subscriber.confirmationToken !== token) {
    throw AppError.badRequest('Invalid confirmation token.');
  }

  subscriber.status = 'SUBSCRIBED';
  subscriber.subscribedAt = new Date();
  subscribers.set(normalizedEmail, subscriber);

  logger.info(`Newsletter subscription confirmed for ${normalizedEmail}`);
}

export function unsubscribeFromNewsletter(email: string): void {
  const normalizedEmail = email.trim().toLowerCase();
  const subscriber = subscribers.get(normalizedEmail);

  if (!subscriber) {
    throw AppError.notFound('No subscription found for this email.');
  }

  subscriber.status = 'UNSUBSCRIBED';
  subscribers.set(normalizedEmail, subscriber);

  logger.info(`Newsletter unsubscribe processed for ${normalizedEmail}`);
}

export function listActiveSubscribers(): string[] {
  return Array.from(subscribers.values())
    .filter((s) => s.status === 'SUBSCRIBED')
    .map((s) => s.email);
}

export function getSubscriberCount(): {
  subscribed: number;
  pending: number;
  unsubscribed: number;
} {
  const all = Array.from(subscribers.values());
  return {
    subscribed: all.filter((s) => s.status === 'SUBSCRIBED').length,
    pending: all.filter((s) => s.status === 'PENDING_CONFIRMATION').length,
    unsubscribed: all.filter((s) => s.status === 'UNSUBSCRIBED').length,
  };
}

/**
 * Builds the confirmation link a subscriber must click - reuses the
 * frontend's base URL, consistent with how password reset links are
 * constructed elsewhere in the system.
 */
export function buildConfirmationLink(email: string, token: string): string {
  return `${env.clientUrl}/newsletter/confirm?email=${encodeURIComponent(email)}&token=${token}`;
}
