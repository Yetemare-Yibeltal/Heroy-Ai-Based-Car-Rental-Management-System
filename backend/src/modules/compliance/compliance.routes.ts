import { Router } from 'express';
import * as complianceController from './compliance.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { catchAsync } from '../../utils/catchAsync';
import { ADMIN_ROLES } from '../../constants/enums';

export const complianceRoutes = Router();

complianceRoutes.get(
  '/my-data/export',
  authenticate,
  catchAsync(complianceController.exportMyData)
);

complianceRoutes.post(
  '/my-data/delete',
  authenticate,
  catchAsync(complianceController.requestMyDeletion)
);

complianceRoutes.post(
  '/users/:userId/anonymize',
  authenticate,
  authorize(...ADMIN_ROLES),
  catchAsync(complianceController.adminAnonymizeUser)
);

complianceRoutes.get(
  '/audit-logs',
  authenticate,
  authorize(...ADMIN_ROLES),
  catchAsync(complianceController.listAuditLogs)
);

complianceRoutes.get(
  '/audit-logs/:entityType/:entityId',
  authenticate,
  authorize(...ADMIN_ROLES),
  catchAsync(complianceController.getAuditLogsForEntity)
);
