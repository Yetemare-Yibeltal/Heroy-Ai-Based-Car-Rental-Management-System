import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma, disconnectPrisma } from './config/prisma';
import { initSentry, captureException } from './integrations/sentry';
import { startReminderJob } from './jobs/reminderJob';
import { startAutoCompleteJob } from './jobs/autoCompleteJob';

async function bootstrap() {
  // Verify the database connection before accepting traffic.
  try {
    await prisma.$connect();
    logger.info('Database connection established.');
  } catch (err) {
    logger.error('Failed to connect to the database on startup.', err as Error);
    process.exit(1);
  }

  const app = createApp();
  initSentry(app);

  const server = http.createServer(app);

  server.listen(env.port, () => {
    logger.info(`HEROY backend running in ${env.nodeEnv} mode on port ${env.port}`);
    logger.info(`Health check: http://localhost:${env.port}/api/health`);

    startReminderJob();
    startAutoCompleteJob();
  });

  async function shutdown(signal: string) {
    logger.info(`${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectPrisma();
      logger.info('Database connection closed.');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10_000).unref();
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection:', reason as Error);
    captureException(reason);
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    captureException(err);
    process.exit(1);
  });
}

bootstrap();
