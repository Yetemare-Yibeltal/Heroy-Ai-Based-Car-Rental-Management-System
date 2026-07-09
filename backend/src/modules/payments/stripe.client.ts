import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/AppError';

if (!env.chapa?.secretKey) {
  logger.warn(
    'CHAPA_SECRET_KEY is not set. Chapa payment endpoints will fail until it is configured in .env.'
  );
}

const chapaClient = axios.create({
  baseURL: env.chapa?.baseUrl ?? 'https://api.chapa.co/v1',
  headers: {
    Authorization: `Bearer ${env.chapa?.secretKey ?? ''}`,
    'Content-Type': 'application/json',
  },
});

export interface ChapaInitializeInput {
  amount: number;
  currency: 'ETB' | 'USD';
  email: string;
  firstName: string;
  lastName: string;
  txRef: string;
  callbackUrl: string;
  returnUrl: string;
  title: string;
  description: string;
}

interface ChapaInitializeResponse {
  status: string;
  message: string;
  data: { checkout_url: string };
}

interface ChapaVerifyResponse {
  status: string;
  message: string;
  data: {
    status: 'success' | 'failed' | 'pending';
    amount: string;
    currency: string;
    tx_ref: string;
    payment_method?: string;
  };
}

/**
 * Starts a Chapa hosted checkout session. Returns a URL the frontend
 * should redirect the customer to - Chapa itself presents the choice
 * of Telebirr, CBE Birr, HelloCash, or card on that hosted page.
 */
export async function initializeChapaTransaction(input: ChapaInitializeInput): Promise<string> {
  try {
    const response = await chapaClient.post<ChapaInitializeResponse>('/transaction/initialize', {
      amount: input.amount.toString(),
      currency: input.currency,
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      tx_ref: input.txRef,
      callback_url: input.callbackUrl,
      return_url: input.returnUrl,
      customization: {
        title: input.title,
        description: input.description,
      },
    });

    return response.data.data.checkout_url;
  } catch (err) {
    logger.error('Chapa transaction initialization failed', err as Error);
    throw AppError.internal('Unable to start Chapa payment. Please try again.');
  }
}

/**
 * Verifies a transaction's final status directly with Chapa - always
 * call this from the webhook/callback handler rather than trusting
 * the redirect alone, since redirects can be spoofed.
 */
export async function verifyChapaTransaction(txRef: string): Promise<ChapaVerifyResponse['data']> {
  try {
    const response = await chapaClient.get<ChapaVerifyResponse>(`/transaction/verify/${txRef}`);
    return response.data.data;
  } catch (err) {
    logger.error(`Chapa transaction verification failed for ${txRef}`, err as Error);
    throw AppError.internal('Unable to verify Chapa payment status.');
  }
}
