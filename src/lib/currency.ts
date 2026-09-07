import { cookies, headers } from 'next/headers';
import type { Currency } from '@/lib/money';

/**
 * Currency selection — plan §8.4.
 *
 * Rules from the plan:
 *  - BDT and USD are separate stored fields. Nothing here converts between
 *    them; this module only decides which stored field to READ.
 *  - Default by country, then let the visitor override, then remember the
 *    choice in a cookie.
 *  - Currency is independent of language (§22): a Bangladeshi expat may well
 *    want English + BDT.
 */

export const CURRENCY_COOKIE = 'jc_currency';

/** One year — a returning visitor should not have to choose again. */
export const CURRENCY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isCurrency(value: string | undefined): value is Currency {
  return value === 'BDT' || value === 'USD';
}

/**
 * Country → default currency. Bangladesh gets BDT; everyone else gets USD.
 *
 * Vercel provides the visitor's country in `x-vercel-ip-country`, which is
 * the IP-based detection §8.4 asks for without shipping a geo-IP database.
 * Absent that header (local development, or another host) we fall back to
 * BDT, since Bangladesh is the primary market (§1.2).
 */
export function currencyForCountry(country: string | null): Currency {
  if (!country) return 'BDT';
  return country.toUpperCase() === 'BD' ? 'BDT' : 'USD';
}

/**
 * The currency for the current request: an explicit choice wins, otherwise
 * the country default.
 */
export async function getCurrency(): Promise<Currency> {
  const chosen = (await cookies()).get(CURRENCY_COOKIE)?.value;
  if (isCurrency(chosen)) return chosen;

  const country = (await headers()).get('x-vercel-ip-country');
  return currencyForCountry(country);
}

/**
 * Whether we guessed rather than being told. Drives the dismissible
 * "You're viewing prices in BDT — switch to USD?" prompt §8.4 asks for.
 * We only prompt when the guess might be wrong for this visitor.
 */
export async function currencyWasInferred(): Promise<boolean> {
  const chosen = (await cookies()).get(CURRENCY_COOKIE)?.value;
  return !isCurrency(chosen);
}

/**
 * §8.4 — for international orders, state plainly that duties are the
 * customer's responsibility. Prevents a specific and very common dispute.
 */
export const DUTIES_NOTICE =
  'Import duties and taxes are not included and are the responsibility of the customer.';
