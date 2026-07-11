import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { httpLogStream } from './utils/logger';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { routes } from './routes';
import { setupSwagger } from './docs/swagger';

export function createApp(): Application {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS - only allow requests from the configured frontend URL
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );

  // Stripe and Chapa webhooks need the raw request body to verify
  // signatures, so these routes are registered with express.raw()
  // before the global express.json() parser below.
  app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));
  app.use('/api/payments/chapa/webhook', express.raw({ type: 'application/json' }));

  // Body parsing for everything else
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request ID assignment and structured per-request logging
  app.use(requestLogger);

  // HTTP request logging piped into Winston
  app.use(morgan(env.isDevelopment ? 'dev' : 'combined', { stream: httpLogStream }));

  // API documentation
  setupSwagger(app);

  // General rate limiting across the whole API
  app.use('/api', generalLimiter);

  // All application routes
  app.use('/api', routes);

  // 404 handler for unmatched routes
  app.use(notFoundHandler);

  // Global error handler - must be registered last
  app.use(errorHandler);

  return app;
}
