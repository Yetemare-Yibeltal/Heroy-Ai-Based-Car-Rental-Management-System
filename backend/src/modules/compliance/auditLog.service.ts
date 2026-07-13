import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { SensitiveAction } from '../../middleware/roles.middleware';

export interface RecordAuditLogInput {
  userId?: string;
  action: SensitiveAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogOutput {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface ListAuditLogsQuery {
  page: number;
  limit: number;
  action?: string;
  entityType?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Records a sensitive action to the audit trail. Never throws on
 * failure - a logging failure should never break the actual
 * business operation that triggered it, so errors are caught and
 * logged internally instead.
 */
export async function recordAuditLog(input: RecordAuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    logger.error(`Failed to record audit log for action ${input.action}`, err as Error);
  }
}

function toOutput(log: {
  id: string;
  userId: string | null;
  user: { firstName: string; lastName: string } | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}): AuditLogOutput {
  return {
    id: log.id,
    userId: log.userId,
    userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : null,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: (log.metadata as Record<string, unknown> | null) ?? null,
    createdAt: log.createdAt,
  };
}

export async function listAuditLogs(query: ListAuditLogsQuery) {
  const where: Prisma.AuditLogWhereInput = {};

  if (query.action) where.action = query.action;
  if (query.entityType) where.entityType = query.entityType;
  if (query.userId) where.userId = query.userId;

  if (query.dateFrom || query.dateTo) {
    where.createdAt = {
      ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
      ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
    };
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs: logs.map(toOutput), total };
}

export async function getAuditLogsForEntity(
  entityType: string,
  entityId: string
): Promise<AuditLogOutput[]> {
  const logs = await prisma.auditLog.findMany({
    where: { entityType, entityId },
    include: { user: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return logs.map(toOutput);
}
