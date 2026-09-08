import 'server-only';

import { db } from '@/lib/db';
import type { Currency, Minor } from '@/lib/money';

/**
 * Shipping zones and rates — plan §9.
 *
 * §9.1 (domestic): flat rate per zone — "simplest and easiest to communicate".
 * §9.2 (international): weight-banded rates per zone.
 *
 * §6.5 is emphatic that the total cost including shipping is shown BEFORE the
 * payment step: "Unexpected shipping cost is the number-one abandonment cause
 * worldwide." So this must be resolvable from a partial address — as soon as
 * we know the country, we can quote.
 */

export interface ShippingAddressLike {
  country: string;
  /** Division/district for BD, state for others. Optional — country alone
   *  is enough for a first quote. */
  region?: string | null;
  city?: string | null;
}

export interface ShippingQuote {
  rateId: string;
  zoneCode: string;
  zoneName: string;
  label: string;
  /** Minor units in the requested currency. Zero when free. */
  price: Minor;
  /** The undiscounted price, when the free-shipping threshold applied. */
  originalPrice: Minor | null;
  minDays: number;
  maxDays: number;
  courierName: string | null;
  /** Additional fee for cash on delivery, shown explicitly (§6.5). */
  codFee: Minor | null;
  /**
   * How much more the customer needs to spend to qualify for free shipping,
   * or null when there is no threshold or it is already met. Drives the
   * cart progress bar (§6.4, §9.1).
   */
  freeShippingShortfall: Minor | null;
}

/** Fallback zone code when nothing else matches (§9.2). */
const REST_OF_WORLD = 'INTL_REST';

/**
 * Picks the most specific zone for an address.
 *
 * Precedence: a zone that names both the country AND the region beats one
 * that names only the country, which beats rest-of-world. That is what makes
 * "Inside Dhaka" win over "Outside Dhaka" for a Dhaka address, while both
 * remain plain database rows the owner can edit.
 */
export async function resolveZone(address: ShippingAddressLike) {
  const country = address.country.trim().toUpperCase();
  const region = address.region?.trim().toLowerCase() ?? '';

  const zones = await db.shippingZone.findMany({
    where: { isActive: true },
    include: { rates: { where: { isActive: true }, orderBy: { minWeightGrams: 'asc' } } },
    orderBy: { position: 'asc' },
  });

  const inCountry = zones.filter((z) => z.countries.includes(country));

  // Most specific: country + region both matched.
  const regionMatch = region
    ? inCountry.find((z) => z.regions.some((r) => r.toLowerCase() === region))
    : undefined;
  if (regionMatch) return regionMatch;

  // Next: a country zone with no region restrictions ("Outside Dhaka").
  const countryWide = inCountry.find((z) => z.regions.length === 0);
  if (countryWide) return countryWide;

  // A country zone exists but only lists other regions — still better than
  // quoting international rates to a domestic customer.
  if (inCountry.length > 0) return inCountry[inCountry.length - 1];

  return (
    zones.find((z) => z.code === REST_OF_WORLD) ??
    zones.find((z) => z.countries.length === 0) ??
    null
  );
}

/**
 * Quotes shipping for a basket.
 *
 * `totalWeightGrams` comes from summing each line's `weight_grams` × quantity.
 * §9.2 and §28 are blunt that a missing weight means wrong international
 * rates and an absorbed loss, which is why the column is required.
 */
export async function quoteShipping(params: {
  address: ShippingAddressLike;
  totalWeightGrams: number;
  subtotal: Minor;
  currency: Currency;
}): Promise<ShippingQuote | null> {
  const zone = await resolveZone(params.address);
  if (!zone || zone.rates.length === 0) return null;

  // First rate whose weight band contains this basket; fall back to the
  // heaviest band so an unusually heavy order still quotes something rather
  // than silently failing.
  const rate =
    zone.rates.find(
      (r) =>
        params.totalWeightGrams >= r.minWeightGrams &&
        (r.maxWeightGrams === null || params.totalWeightGrams <= r.maxWeightGrams),
    ) ?? zone.rates[zone.rates.length - 1];

  const isBdt = params.currency === 'BDT';
  const listPrice = isBdt ? rate.priceBdt : rate.priceUsd;
  const freeAbove = isBdt ? rate.freeAboveBdt : rate.freeAboveUsd;

  const qualifiesFree = freeAbove !== null && params.subtotal >= freeAbove;

  return {
    rateId: rate.id,
    zoneCode: zone.code,
    zoneName: zone.nameEn,
    label: rate.nameEn,
    price: qualifiesFree ? 0 : listPrice,
    originalPrice: qualifiesFree ? listPrice : null,
    minDays: rate.minDays,
    maxDays: rate.maxDays,
    courierName: rate.courierName,
    // COD is domestic-only in practice; the fee is null on international zones.
    codFee: rate.codFeeBdt !== null && isBdt ? rate.codFeeBdt : null,
    freeShippingShortfall:
      freeAbove !== null && !qualifiesFree ? freeAbove - params.subtotal : null,
  };
}

/**
 * Every rate for a zone, for the delivery-method chooser at checkout (§6.5).
 */
export async function listShippingOptions(params: {
  address: ShippingAddressLike;
  totalWeightGrams: number;
  subtotal: Minor;
  currency: Currency;
}): Promise<ShippingQuote[]> {
  const zone = await resolveZone(params.address);
  if (!zone) return [];

  const isBdt = params.currency === 'BDT';

  return zone.rates
    .filter(
      (r) =>
        params.totalWeightGrams >= r.minWeightGrams &&
        (r.maxWeightGrams === null || params.totalWeightGrams <= r.maxWeightGrams),
    )
    .map((rate) => {
      const listPrice = isBdt ? rate.priceBdt : rate.priceUsd;
      const freeAbove = isBdt ? rate.freeAboveBdt : rate.freeAboveUsd;
      const qualifiesFree = freeAbove !== null && params.subtotal >= freeAbove;

      return {
        rateId: rate.id,
        zoneCode: zone.code,
        zoneName: zone.nameEn,
        label: rate.nameEn,
        price: qualifiesFree ? 0 : listPrice,
        originalPrice: qualifiesFree ? listPrice : null,
        minDays: rate.minDays,
        maxDays: rate.maxDays,
        courierName: rate.courierName,
        codFee: rate.codFeeBdt !== null && isBdt ? rate.codFeeBdt : null,
        freeShippingShortfall:
          freeAbove !== null && !qualifiesFree ? freeAbove - params.subtotal : null,
      };
    });
}

/** Whether COD is offered at all for this destination (§8.1 — domestic only). */
export function codAvailable(zoneCode: string): boolean {
  return zoneCode.startsWith('BD_');
}

/**
 * §8.4 — international orders must carry this line. It prevents a specific
 * and very common dispute.
 */
export function dutiesApply(zoneCode: string): boolean {
  return !zoneCode.startsWith('BD_');
}
