import * as Sentry from '@sentry/node';
import { Application } from 'express';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let sentryEnabled = false;

/**
 * Initializes Sentry error tracking. Must be called before any
 * other middleware is registered on the Express app, so Sentry can
 * wrap every request. Safe to call even if SENTRY_DSN is unset -
 * it simply does nothing in that case.
 */
export function initSentry(app: Application): void {
  if (!env.sentryDsn) {
    logger.info('SENTRY_DSN not set - error monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.nodeEnv,
    tracesSampleRate: env.isProduction ? 0.2 : 1.0,
  });

  sentryEnabled = true;
  logger.info('Sentry error monitoring initialized.');
}

/**
 * Manually reports an error to Sentry with optional extra context.
 * Used in places where an error is caught and handled gracefully
 * but is still worth tracking (e.g. a failed third-party API call).
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!sentryEnabled) return;

  Sentry.captureException(error, { extra: context });
}

export function isSentryEnabled(): boolean {
  return sentryEnabled;
}
