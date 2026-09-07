/**
 * Money.
 *
 * THE RULE (CONTEXT.md D1): every amount in this codebase is an INTEGER in
 * minor units — poisha for BDT, cents for USD. ৳3,450.00 is `345000`.
 * There is no float anywhere in pricing, discount, shipping, or tax. Floats
 * accumulate error across a cart and produce totals that don't reconcile
 * against gateway settlement reports (§8.3).
 *
 * Values are converted to a display string only at the very edge, by
 * `formatMoney`. Nothing downstream of that should do arithmetic.
 *
 * NEVER convert between currencies here. BDT and USD are separate,
 * manually-set fields on the product; live conversion produces ugly prices
 * and unpredictable margins (§8.4, §28).
 */

export type Currency = 'BDT' | 'USD';

/** Minor units per major unit. Both currencies happen to be 100. */
const MINOR_PER_MAJOR: Record<Currency, number> = {
  BDT: 100,
  USD: 100,
};

const SYMBOL: Record<Currency, string> = {
  BDT: '৳',
  USD: '$',
};

/**
 * A branded integer, so a raw number can't be passed where minor units are
 * expected without going through `toMinor` or a database field.
 */
export type Minor = number;

export class MoneyError extends Error {}

function assertInteger(amount: number, label = 'amount'): void {
  if (!Number.isInteger(amount)) {
    throw new MoneyError(
      `${label} must be an integer in minor units, received ${amount}. ` +
        'See src/lib/money.ts — no floats in money arithmetic.',
    );
  }
  if (!Number.isSafeInteger(amount)) {
    throw new MoneyError(`${label} exceeds the safe integer range: ${amount}`);
  }
}

// ---------------------------------------------------------------------------
// Conversion at the boundary
// ---------------------------------------------------------------------------

/**
 * Major units → minor units. Use ONLY when reading human input (an admin
 * typing a price) or a seed file. `toMinor(3450)` → `345000`.
 */
export function toMinor(major: number, currency: Currency = 'BDT'): Minor {
  const factor = MINOR_PER_MAJOR[currency];
  const minor = Math.round(major * factor);
  assertInteger(minor);
  return minor;
}

/**
 * Minor → major, as a number. For display use `formatMoney` instead; this is
 * for analytics payloads (GA4 wants a decimal `value`) and gateway APIs that
 * expect major units (§18.2).
 */
export function toMajor(minor: Minor, currency: Currency = 'BDT'): number {
  assertInteger(minor);
  return minor / MINOR_PER_MAJOR[currency];
}

// ---------------------------------------------------------------------------
// Arithmetic
// ---------------------------------------------------------------------------

export function addMoney(...amounts: Minor[]): Minor {
  return amounts.reduce<Minor>((total, a) => {
    assertInteger(a);
    return total + a;
  }, 0);
}

export function subtractMoney(a: Minor, b: Minor): Minor {
  assertInteger(a);
  assertInteger(b);
  return a - b;
}

/** Line total for a quantity. Integer × integer stays exact. */
export function multiplyMoney(unitPrice: Minor, quantity: number): Minor {
  assertInteger(unitPrice, 'unitPrice');
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new MoneyError(`quantity must be a non-negative integer, got ${quantity}`);
  }
  return unitPrice * quantity;
}

/**
 * Percentage of an amount, expressed in BASIS POINTS to avoid a float
 * percentage sneaking in — 1000 bp = 10%, 750 bp = 7.5%.
 *
 * This is how `Coupon.value` is stored for PERCENT coupons. Rounds half-up,
 * which favours the customer on a discount and is the conventional retail
 * behaviour.
 */
export function percentOf(amount: Minor, basisPoints: number): Minor {
  assertInteger(amount);
  if (!Number.isInteger(basisPoints) || basisPoints < 0) {
    throw new MoneyError(
      `basisPoints must be a non-negative integer (1000 = 10%), got ${basisPoints}`,
    );
  }
  return Math.round((amount * basisPoints) / 10_000);
}

/** Clamps to zero. A discount can never make an order negative (§23.3). */
export function clampToZero(amount: Minor): Minor {
  assertInteger(amount);
  return amount < 0 ? 0 : amount;
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

export interface FormatOptions {
  /**
   * 'en' uses Western grouping and Latin digits (৳3,450).
   * 'bn' uses Bengali digits and South-Asian lakh/crore grouping (৳৩,৪৫০).
   *
   * §22 asks for an explicit, consistent decision on lakh/crore grouping.
   * Ours: group by locale — Bangla readers get lakh/crore, English readers
   * get thousands. Never mixed within one page.
   */
  locale?: 'en' | 'bn';
  /**
   * Show the ISO code after the symbol ($45 USD). §8.4 requires this for
   * international users, to disambiguate from other dollar currencies.
   * Defaults to true for USD, false for BDT.
   */
  showCode?: boolean;
  /**
   * Hide `.00` on whole amounts. Default true for BDT (৳3,450 is how prices
   * are written in Bangladesh), false for USD ($45.00).
   */
  trimZeroDecimals?: boolean;
}

const LOCALE_TAG: Record<'en' | 'bn', Record<Currency, string>> = {
  en: { BDT: 'en-US', USD: 'en-US' },
  bn: { BDT: 'bn-BD', USD: 'bn-BD' },
};

/**
 * The only place a money value becomes a string. Everything upstream stays
 * an integer.
 */
export function formatMoney(
  minor: Minor,
  currency: Currency = 'BDT',
  options: FormatOptions = {},
): string {
  assertInteger(minor);

  const {
    locale = 'en',
    showCode = currency === 'USD',
    trimZeroDecimals = currency === 'BDT',
  } = options;

  const major = toMajor(minor, currency);
  const isWhole = minor % MINOR_PER_MAJOR[currency] === 0;
  const fractionDigits = trimZeroDecimals && isWhole ? 0 : 2;

  const digits = new Intl.NumberFormat(LOCALE_TAG[locale][currency], {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(major);

  const base = `${SYMBOL[currency]}${digits}`;
  return showCode ? `${base} ${currency}` : base;
}

/**
 * The amount for an analytics event. GA4 expects a decimal in major units
 * (§18.2), which is the one place a float is correct — it leaves our
 * arithmetic entirely.
 */
export function analyticsValue(minor: Minor, currency: Currency): number {
  return toMajor(minor, currency);
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

/**
 * Picks the right stored price for a currency. Variant overrides win over the
 * product base price. Never derives one currency from the other (§8.4).
 */
export function resolvePrice(
  currency: Currency,
  base: { basePriceBdt: number; basePriceUsd: number },
  override?: { priceOverrideBdt: number | null; priceOverrideUsd: number | null } | null,
): Minor {
  if (currency === 'BDT') {
    return override?.priceOverrideBdt ?? base.basePriceBdt;
  }
  return override?.priceOverrideUsd ?? base.basePriceUsd;
}

/** Savings against a compare-at price, or null when there is no discount. */
export function savingsAgainst(price: Minor, compareAt: Minor | null): Minor | null {
  if (compareAt === null) return null;
  assertInteger(price);
  assertInteger(compareAt);
  if (compareAt <= price) return null;
  return compareAt - price;
}
