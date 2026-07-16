import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/AppError';
import { verifyApiKey, hasScope, ApiKeyScope, PartnerApiKey } from './apiKeys.service';

declare global {
  namespace Express {
    interface Request {
      partnerApiKey?: PartnerApiKey;
    }
  }
}

/**
 * Authenticates a partner API request using the X-API-Key header,
 * and ensures the key has the required scope for this endpoint.
 * Used in place of the customer/staff JWT authenticate middleware
 * on partner-facing routes.
 */
export function requireApiKey(requiredScope: ApiKeyScope) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const rawKey = req.headers['x-api-key'] as string | undefined;

    if (!rawKey) {
      throw AppError.unauthorized('Missing API key. Provide it via the X-API-Key header.');
    }

    const apiKey = verifyApiKey(rawKey);

    if (!hasScope(apiKey, requiredScope)) {
      throw AppError.forbidden(`This API key does not have the required "${requiredScope}" scope.`);
    }

    req.partnerApiKey = apiKey;
    next();
  };
}
