import axios from 'axios';
import { logger } from '../../utils/logger';

export const SUPPORTED_CURRENCIES = ['USD', 'ETB', 'EUR', 'GBP'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

interface ExchangeRateCache {
  rates: Record<string, number>;
  fetchedAt: number;
}

let cache: ExchangeRateCache | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Conservative fallback rates used only if the live API is unreachable. */
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  ETB: 123.5,
  EUR: 0.92,
  GBP: 0.79,
};

async function fetchLiveRates(): Promise<Record<string, number>> {
  try {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', {
      timeout: 5000,
    });
    return response.data.rates as Record<string, number>;
  } catch (err) {
    logger.warn('Failed to fetch live exchange rates, using fallback rates.', err as Error);
    return FALLBACK_RATES;
  }
}

async function getRates(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rates;
  }

  const rates = await fetchLiveRates();
  cache = { rates, fetchedAt: Date.now() };
  return rates;
}

export function isSupportedCurrency(value: string): value is Currency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

/**
 * Converts an amount from USD (HEROY's base storage currency) into
 * the target currency, using real live exchange rates with a
 * 1-hour cache to avoid hammering the external API on every request.
 */
export async function convertFromUsd(amountUsd: number, targetCurrency: Currency): Promise<number> {
  if (targetCurrency === 'USD') return Math.round(amountUsd * 100) / 100;

  const rates = await getRates();
  const rate = rates[targetCurrency] ?? FALLBACK_RATES[targetCurrency];

  return Math.round(amountUsd * rate * 100) / 100;
}

/**
 * Converts an amount from a given currency back into USD - used
 * when a payment comes in via a non-USD provider (e.g. Chapa
 * charging in ETB) and needs to be reconciled against USD-based
 * internal pricing and reporting.
 */
export async function convertToUsd(amount: number, sourceCurrency: Currency): Promise<number> {
  if (sourceCurrency === 'USD') return Math.round(amount * 100) / 100;

  const rates = await getRates();
  const rate = rates[sourceCurrency] ?? FALLBACK_RATES[sourceCurrency];

  return Math.round((amount / rate) * 100) / 100;
}

export function formatCurrency(amount: number, currency: Currency): string {
  const formatters: Record<Currency, Intl.NumberFormat> = {
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    ETB: new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }),
    EUR: new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }),
    GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
  };

  return formatters[currency].format(amount);
}
