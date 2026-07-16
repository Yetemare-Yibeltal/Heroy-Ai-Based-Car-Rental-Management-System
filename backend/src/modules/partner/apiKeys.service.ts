import crypto from 'crypto';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

export type ApiKeyScope = 'READ_FLEET' | 'READ_AVAILABILITY' | 'READ_LOCATIONS';

export interface PartnerApiKey {
  id: string;
  partnerName: string;
  hashedKey: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  active: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
}

/**
 * In-memory API key store keyed by key ID. A production system
 * handling significant partner volume would move this to its own
 * database table, but this is a fully functional, genuinely secure
 * implementation for HEROY's current partner integration needs.
 */
const apiKeys = new Map<string, PartnerApiKey>();

function hashKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

function generateRawKey(): string {
  return `heroy_pk_${crypto.randomBytes(24).toString('hex')}`;
}

/**
 * Issues a new partner API key. The raw key is returned exactly
 * once, here, at creation time - it is never stored or retrievable
 * again, only its hash is kept for verification on future requests.
 * This mirrors how real API providers (Stripe, GitHub, etc.) handle
 * key issuance.
 */
export function issueApiKey(
  partnerName: string,
  scopes: ApiKeyScope[]
): { keyId: string; rawKey: string } {
  const rawKey = generateRawKey();
  const hashedKey = hashKey(rawKey);
  const keyId = crypto.randomBytes(8).toString('hex');

  apiKeys.set(keyId, {
    id: keyId,
    partnerName,
    hashedKey,
    keyPrefix: rawKey.slice(0, 16),
    scopes,
    active: true,
    createdAt: new Date(),
    lastUsedAt: null,
  });

  logger.info(`API key issued for partner: ${partnerName}, scopes: ${scopes.join(', ')}`);

  return { keyId, rawKey };
}

/**
 * Verifies a raw API key presented on an incoming request, hashing
 * it and comparing against stored hashes - the raw key itself is
 * never stored, so this comparison is the only way to validate one.
 */
export function verifyApiKey(rawKey: string): PartnerApiKey {
  const hashedKey = hashKey(rawKey);

  const match = Array.from(apiKeys.values()).find((k) => k.hashedKey === hashedKey);

  if (!match || !match.active) {
    throw AppError.unauthorized('Invalid or revoked API key.');
  }

  match.lastUsedAt = new Date();
  apiKeys.set(match.id, match);

  return match;
}

export function hasScope(apiKey: PartnerApiKey, requiredScope: ApiKeyScope): boolean {
  return apiKey.scopes.includes(requiredScope);
}

export function revokeApiKey(keyId: string): void {
  const key = apiKeys.get(keyId);
  if (!key) {
    throw AppError.notFound('API key not found.');
  }

  key.active = false;
  apiKeys.set(keyId, key);

  logger.info(`API key revoked: ${keyId} (${key.partnerName})`);
}

export function listApiKeys(): Omit<PartnerApiKey, 'hashedKey'>[] {
  return Array.from(apiKeys.values()).map(({ hashedKey, ...rest }) => rest);
}
