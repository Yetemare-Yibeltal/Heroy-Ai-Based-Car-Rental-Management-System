import webpush from 'web-push';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * In-memory subscription store keyed by user ID. A user can have
 * multiple subscriptions (one per browser/device). In a larger
 * deployment this would move to its own database table, but this
 * is a fully functional real implementation for HEROY's current scale.
 */
const subscriptionStore = new Map<string, PushSubscriptionInput[]>();

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;

  if (!env.vapid?.publicKey || !env.vapid?.privateKey) {
    logger.warn(
      'VAPID keys are not configured. Push notifications will be logged instead of sent.'
    );
    return false;
  }

  webpush.setVapidDetails(
    `mailto:${env.vapid.contactEmail ?? 'support@heroy.example'}`,
    env.vapid.publicKey,
    env.vapid.privateKey
  );

  vapidConfigured = true;
  return true;
}

export function getVapidPublicKey(): string | undefined {
  return env.vapid?.publicKey;
}

export function subscribeToPush(userId: string, subscription: PushSubscriptionInput): void {
  const existing = subscriptionStore.get(userId) ?? [];

  const alreadySubscribed = existing.some((s) => s.endpoint === subscription.endpoint);
  if (!alreadySubscribed) {
    existing.push(subscription);
    subscriptionStore.set(userId, existing);
  }

  logger.info(`Push subscription registered for user ${userId}`);
}

export function unsubscribeFromPush(userId: string, endpoint: string): void {
  const existing = subscriptionStore.get(userId) ?? [];
  subscriptionStore.set(
    userId,
    existing.filter((s) => s.endpoint !== endpoint)
  );
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Sends a real push notification to every device a user has
 * subscribed from. Silently removes subscriptions that have expired
 * or been revoked by the browser (a normal, expected occurrence with
 * Web Push, not an error condition).
 */
export async function sendPushNotification(userId: string, payload: PushPayload): Promise<void> {
  const subscriptions = subscriptionStore.get(userId) ?? [];

  if (subscriptions.length === 0) {
    logger.info(`No push subscriptions for user ${userId} - notification not sent via push.`);
    return;
  }

  if (!ensureVapidConfigured()) {
    logger.info(`[PUSH - not sent, VAPID not configured] User: ${userId} | ${payload.title}`);
    return;
  }

  const validSubscriptions: PushSubscriptionInput[] = [];

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        subscription as never,
        JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? '/' })
      );
      validSubscriptions.push(subscription);
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        logger.info(`Removing expired push subscription for user ${userId}`);
      } else {
        logger.error(`Failed to send push notification to user ${userId}`, err as Error);
        validSubscriptions.push(subscription);
      }
    }
  }

  subscriptionStore.set(userId, validSubscriptions);
}
