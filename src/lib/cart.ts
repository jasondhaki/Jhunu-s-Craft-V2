import 'server-only';

import { db } from '@/lib/db';
import {
  addMoney,
  multiplyMoney,
  type Currency,
  type Minor,
} from '@/lib/money';

/**
 * Cart resolution — plan §6.4.
 *
 * The client cart (src/lib/cart-store.ts) holds only variant ids and
 * quantities. This module turns that into real, priced lines by reading the
 * database. Nothing about money, naming, or availability is ever taken from
 * the client (§13.4).
 *
 * §6.4 also requires re-validating stock at checkout, not just at add-time —
 * `issues` below is how the cart surfaces that before the customer commits.
 */

export interface CartLineInput {
  variantId: string;
  quantity: number;
  personalizationNote?: string;
}

export interface ResolvedCartLine {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantLabel: string;
  colorHex: string;
  sku: string;
  imageUrl: string | null;
  imageAlt: string;
  unitPrice: Minor;
  quantity: number;
  lineTotal: Minor;
  weightGrams: number;
  /** Stock actually available right now. */
  available: number;
  madeToOrder: boolean;
  /** Set when the requested quantity cannot be met (§7.3). */
  issue: string | null;
}

export interface ResolvedCart {
  lines: ResolvedCartLine[];
  subtotal: Minor;
  totalWeightGrams: number;
  itemCount: number;
  currency: Currency;
  /** Lines that vanished entirely — deleted or deactivated products (§23.3). */
  removedVariantIds: string[];
  /** True when anything needs the customer's attention before checkout. */
  hasIssues: boolean;
}

const EMPTY: Omit<ResolvedCart, 'currency'> = {
  lines: [],
  subtotal: 0,
  totalWeightGrams: 0,
  itemCount: 0,
  removedVariantIds: [],
  hasIssues: false,
};

/**
 * Resolves client cart lines against the database.
 *
 * Quantities are clamped to what is actually in stock rather than rejected,
 * which matches §7.3's "Only 1 left in stock. We've updated your cart." — the
 * customer is told and can continue, instead of being blocked.
 */
export async function resolveCart(
  input: CartLineInput[],
  currency: Currency,
): Promise<ResolvedCart> {
  if (input.length === 0) return { ...EMPTY, currency };

  const variants = await db.variant.findMany({
    where: {
      id: { in: input.map((l) => l.variantId) },
      isActive: true,
      product: { status: 'ACTIVE', publishedAt: { not: null } },
    },
    include: {
      product: {
        include: { images: { orderBy: { position: 'asc' }, take: 1 } },
      },
    },
  });

  const removedVariantIds = input
    .filter((l) => !variants.some((v) => v.id === l.variantId))
    .map((l) => l.variantId);

  const isBdt = currency === 'BDT';

  const lines: ResolvedCartLine[] = [];

  for (const entry of input) {
    const variant = variants.find((v) => v.id === entry.variantId);
    if (!variant) continue;

    const product = variant.product;
    const image = product.images[0];

    const unitPrice = isBdt
      ? (variant.priceOverrideBdt ?? product.basePriceBdt)
      : (variant.priceOverrideUsd ?? product.basePriceUsd);

    // Made-to-order items are built on demand and are not stock-limited.
    const available = product.madeToOrder
      ? Number.MAX_SAFE_INTEGER
      : variant.stockQuantity;

    const quantity = Math.max(0, Math.min(entry.quantity, available));

    let issue: string | null = null;
    if (available === 0) {
      issue = 'Sold out. He makes these in small batches — remove it to continue.';
    } else if (quantity < entry.quantity) {
      issue = `Only ${available} left. We've updated the quantity.`;
    }

    if (quantity === 0 && available === 0) {
      // Keep the line visible so the customer understands why the total
      // changed, rather than silently deleting it.
      lines.push({
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.nameEn,
        variantLabel: [variant.colorNameEn, variant.sizeLabel].filter(Boolean).join(' / '),
        colorHex: variant.colorHex,
        sku: variant.sku,
        imageUrl: image?.url ?? null,
        imageAlt: image?.altTextEn ?? product.nameEn,
        unitPrice,
        quantity: 0,
        lineTotal: 0,
        weightGrams: product.weightGrams,
        available: 0,
        madeToOrder: product.madeToOrder,
        issue,
      });
      continue;
    }

    lines.push({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name: product.nameEn,
      variantLabel: [variant.colorNameEn, variant.sizeLabel].filter(Boolean).join(' / '),
      colorHex: variant.colorHex,
      sku: variant.sku,
      imageUrl: image?.url ?? null,
      imageAlt: image?.altTextEn ?? product.nameEn,
      unitPrice,
      quantity,
      lineTotal: multiplyMoney(unitPrice, quantity),
      weightGrams: product.weightGrams,
      available: product.madeToOrder ? available : variant.stockQuantity,
      madeToOrder: product.madeToOrder,
      issue,
    });
  }

  const payable = lines.filter((l) => l.quantity > 0);

  return {
    lines,
    subtotal: payable.length ? addMoney(...payable.map((l) => l.lineTotal)) : 0,
    totalWeightGrams: payable.reduce(
      (sum, l) => sum + l.weightGrams * l.quantity,
      0,
    ),
    itemCount: payable.reduce((sum, l) => sum + l.quantity, 0),
    currency,
    removedVariantIds,
    hasIssues: removedVariantIds.length > 0 || lines.some((l) => l.issue !== null),
  };
}

/**
 * Parses the cart cookie written by the client store.
 *
 * Treated as fully untrusted input (§13.4): anything malformed yields an
 * empty cart rather than throwing, and every id is re-checked against the
 * database by `resolveCart` anyway.
 *
 * The value arrives PERCENT-ENCODED. `document.cookie` requires it (a raw
 * JSON payload contains commas and semicolons, which terminate a cookie), and
 * Next.js hands back the stored value without decoding it. Skipping the
 * decode here made `JSON.parse` throw on every request, which the catch below
 * then swallowed into an empty cart — the cart worked on the client and was
 * silently empty at checkout. Decode first, and keep the raw path as a
 * fallback so a hand-set cookie still works.
 */
export function parseCartCookie(raw: string | undefined): CartLineInput[] {
  if (!raw) return [];

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // Malformed percent-encoding — fall through and try the raw value.
  }

  try {
    const parsed: unknown = JSON.parse(decoded);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (entry): entry is { variantId: string; quantity: number } =>
          typeof entry === 'object' &&
          entry !== null &&
          typeof (entry as { variantId?: unknown }).variantId === 'string' &&
          typeof (entry as { quantity?: unknown }).quantity === 'number',
      )
      .map((entry) => ({
        variantId: entry.variantId.slice(0, 64),
        quantity: Math.min(20, Math.max(1, Math.floor(entry.quantity))),
      }))
      .slice(0, 50); // a cart with 50+ distinct lines is abuse, not shopping
  } catch {
    return [];
  }
}
