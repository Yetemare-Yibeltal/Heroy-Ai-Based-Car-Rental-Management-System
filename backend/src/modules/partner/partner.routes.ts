import { Router } from 'express';
import * as partnerController from './partner.controller';
import { requireApiKey } from './apiKey.middleware';
import { authenticate, authorize } from '../../middleware/auth';
import { catchAsync } from '../../utils/catchAsync';
import { ADMIN_ROLES } from '../../constants/enums';

export const partnerRoutes = Router();

// ---------------------------------------------
// Partner-facing, scoped API-key-authenticated endpoints
// ---------------------------------------------

partnerRoutes.get(
  '/fleet',
  requireApiKey('READ_FLEET'),
  catchAsync(partnerController.getPartnerFleet)
);

partnerRoutes.get(
  '/availability',
  requireApiKey('READ_AVAILABILITY'),
  catchAsync(partnerController.getPartnerAvailability)
);

partnerRoutes.get(
  '/locations',
  requireApiKey('READ_LOCATIONS'),
  catchAsync(partnerController.getPartnerLocations)
);

// ---------------------------------------------
// Admin-only, internal key management endpoints
// ---------------------------------------------

partnerRoutes.post(
  '/keys',
  authenticate,
  authorize(...ADMIN_ROLES),
  catchAsync(partnerController.issueApiKey)
);

partnerRoutes.get(
  '/keys',
  authenticate,
  authorize(...ADMIN_ROLES),
  catchAsync(partnerController.listApiKeys)
);

partnerRoutes.delete(
  '/keys/:keyId',
  authenticate,
  authorize(...ADMIN_ROLES),
  catchAsync(partnerController.revokeApiKey)
);
