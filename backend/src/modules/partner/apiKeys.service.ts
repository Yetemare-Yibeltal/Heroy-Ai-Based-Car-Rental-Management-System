import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

export type ApiKeyScope = 'READ_FLEET' | 'READ_AVAILABILITY' | 'READ_LOCATIONS';

interface ApiKeyRecord {
  id: string;
  partnerName: string;
  hashedKey: string;
  scopes: ApiKeyScope[];
  active: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
}

/**
 * In-memory API key store keyed by key ID. The actual key value is
 * never stored in plain text - only its bcrypt hash, exactly the
 * same principle used for user passwords, so a database or memory
 * dump could never leak a usable partner key.
 */
const apiKeyStore = new Map<string, ApiKeyRecord>();

function generateRawKey(): string {
  return `heroy_pk_${crypto.randomBytes(24).toString('hex')}`;
}

/**
 * Issues a new partner API key. The raw key is returned exactly
 * once, at creation time - it cannot be retrieved again afterward,
 * matching how real API platforms (Stripe, GitHub, etc.) handle
 * secret key issuance.
 */
export async function issueApiKey(
  partnerName: string,
  scopes: ApiKeyScope[]
): Promise<{ keyId: string; rawKey: string }> {
  const rawKey = generateRawKey();
  const hashedKey = await bcrypt.hash(rawKey, 10);
  const keyId = crypto.randomUUID();

  apiKeyStore.set(keyId, {
    id: keyId,
    partnerName,
    hashedKey,
    scopes,
    active: true,
    lastUsedAt: null,
    createdAt: new Date(),
  });

  logger.info(`API key issued for partner: ${partnerName} (scopes: ${scopes.join(', ')})`);

  return { keyId, rawKey };
}

/**
 * Validates a raw API key presented in a request header against the
 * stored hash, and checks it has the required scope. Returns the
 * key record if valid, throws otherwise. Updates lastUsedAt on
 * every successful validation for real usage auditing.
 */
export async function validateApiKey(
  rawKey: string,
  requiredScope: ApiKeyScope
): Promise<ApiKeyRecord> {
  if (!rawKey || !rawKey.startsWith('heroy_pk_')) {
    throw AppError.unauthorized('Invalid API key format.');
  }

  for (const record of apiKeyStore.values()) {
    if (!record.active) continue;

    const matches = await bcrypt.compare(rawKey, record.hashedKey);
    if (matches) {
      if (!record.scopes.includes(requiredScope)) {
        throw AppError.forbidden(`This API key does not have the required scope: ${requiredScope}`);
      }

      record.lastUsedAt = new Date();
      apiKeyStore.set(record.id, record);

      return record;
    }
  }

  throw AppError.unauthorized('Invalid or revoked API key.');
}

export function revokeApiKey(keyId: string): void {
  const record = apiKeyStore.get(keyId);
  if (!record) {
    throw AppError.notFound('API key not found.');
  }

  record.active = false;
  apiKeyStore.set(keyId, record);

  logger.info(`API key revoked: ${keyId} (partner: ${record.partnerName})`);
}

export function listApiKeys(): Omit<ApiKeyRecord, 'hashedKey'>[] {
  return Array.from(apiKeyStore.values()).map(({ hashedKey, ...rest }) => rest);
}
