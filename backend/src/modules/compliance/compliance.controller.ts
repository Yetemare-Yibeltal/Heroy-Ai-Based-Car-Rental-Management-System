import { Request, Response } from 'express';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import * as auditLogService from './auditLog.service';
import * as gdprService from './gdpr.service';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../constants/enums';

export async function exportMyData(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const data = await gdprService.exportUserData(req.user.userId);
  sendSuccess(res, 200, 'Your data export is ready.', data);
}

export async function requestMyDeletion(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  await gdprService.anonymizeUserData(req.user.userId);
  sendSuccess(res, 200, 'Your account data has been anonymized as requested.', null);
}

export async function adminAnonymizeUser(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  await gdprService.anonymizeUserData(req.params.userId, req.user.userId);
  sendSuccess(res, 200, 'User data anonymized by administrator.', null);
}

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const page = Math.max(parseInt(String(req.query.page ?? DEFAULT_PAGE), 10), 1);
  const limit = Math.min(
    Math.max(parseInt(String(req.query.limit ?? DEFAULT_PAGE_SIZE), 10), 1),
    MAX_PAGE_SIZE
  );

  const result = await auditLogService.listAuditLogs({
    page,
    limit,
    action: req.query.action as string | undefined,
    entityType: req.query.entityType as string | undefined,
    userId: req.query.userId as string | undefined,
    dateFrom: req.query.dateFrom as string | undefined,
    dateTo: req.query.dateTo as string | undefined,
  });

  sendPaginated(res, 'Audit logs fetched.', result.logs, { page, limit, total: result.total });
}

export async function getAuditLogsForEntity(req: Request, res: Response): Promise<void> {
  const logs = await auditLogService.getAuditLogsForEntity(
    req.params.entityType,
    req.params.entityId
  );
  sendSuccess(res, 200, 'Entity audit history fetched.', logs);
}
