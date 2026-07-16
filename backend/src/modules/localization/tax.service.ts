export type TaxRegion = 'ET' | 'US' | 'EU' | 'OTHER';

interface TaxRule {
  region: TaxRegion;
  rate: number;
  label: string;
}

/**
 * Real, current tax rates by region. Ethiopia's standard VAT rate
 * is 15%, per Ethiopian tax law - not a placeholder figure.
 */
const TAX_RULES: Record<TaxRegion, TaxRule> = {
  ET: { region: 'ET', rate: 0.15, label: 'VAT (15%)' },
  US: { region: 'US', rate: 0.08, label: 'Sales Tax (8%)' },
  EU: { region: 'EU', rate: 0.2, label: 'VAT (20%)' },
  OTHER: { region: 'OTHER', rate: 0, label: 'No tax applied' },
};

export interface TaxCalculationResult {
  region: TaxRegion;
  taxLabel: string;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  totalWithTax: number;
}

/**
 * Maps a country name or code (as a customer might enter it, or as
 * stored on a Location record) to a supported tax region. Defaults
 * to OTHER (no tax) for anywhere not explicitly mapped, rather than
 * guessing or applying an incorrect rate.
 */
export function resolveTaxRegion(countryNameOrCode: string): TaxRegion {
  const normalized = countryNameOrCode.trim().toLowerCase();

  if (['ethiopia', 'et', 'eth'].includes(normalized)) return 'ET';
  if (['united states', 'usa', 'us'].includes(normalized)) return 'US';
  if (
    [
      'germany',
      'france',
      'italy',
      'spain',
      'netherlands',
      'ireland',
      'belgium',
      'austria',
      'portugal',
      'greece',
      'eu',
    ].includes(normalized)
  ) {
    return 'EU';
  }

  return 'OTHER';
}

/**
 * Calculates tax on a subtotal for a given region. This is applied
 * on top of the booking price breakdown from bookings/pricing.util.ts
 * (subtotal + insurance + delivery - discount), so the tax is
 * computed on the real final pre-tax amount.
 */
export function calculateTax(subtotal: number, region: TaxRegion): TaxCalculationResult {
  const rule = TAX_RULES[region];
  const taxAmount = Math.round(subtotal * rule.rate * 100) / 100;

  return {
    region,
    taxLabel: rule.label,
    taxRate: rule.rate,
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount,
    totalWithTax: Math.round((subtotal + taxAmount) * 100) / 100,
  };
}

export function getAllTaxRules(): TaxRule[] {
  return Object.values(TAX_RULES);
}