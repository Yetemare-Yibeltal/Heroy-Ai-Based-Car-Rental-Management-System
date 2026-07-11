import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

export const healthRoutes = Router();

healthRoutes.get('/', async (req: Request, res: Response) => {
  const startedAt = Date.now();

  let databaseStatus: 'connected' | 'disconnected' = 'connected';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    databaseStatus = 'disconnected';
    logger.error('Health check: database ping failed.', err as Error);
  }

  const responseTimeMs = Date.now() - startedAt;
  const isHealthy = databaseStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy ? 'HEROY API is healthy.' : 'HEROY API is degraded.',
    data: {
      status: isHealthy ? 'healthy' : 'degraded',
      database: databaseStatus,
      uptimeSeconds: Math.round(process.uptime()),
      responseTimeMs,
      timestamp: new Date().toISOString(),
    },
  });
});
