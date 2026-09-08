'use server';

import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';
import { parseCartCookie, resolveCart } from '@/lib/cart';
import { CART_COOKIE } from '@/lib/cart-cookie';
import { getCurrency } from '@/lib/currency';
import { quoteShipping, codAvailable, dutiesApply } from '@/lib/shipping';
import { codEligibility } from '@/lib/payments/cod';
import { createOrder, InsufficientStockError, PriceMismatchError } from '@/lib/orders';
import { formatMoney } from '@/lib/money';

/**
 * Checkout server actions — plan §6.5, §8.3, §13.4.
 *
 * Everything here re-derives money from the database. The client sends
 * addresses and choices; it never sends prices, and nothing it sends about
 * money would be believed anyway.
 */

// §13.4 — validate every input server-side with a schema.
const addressSchema = z.object({
  recipientName: z.string().trim().min(1, 'Enter the name for delivery.').max(120),
  phone: z
    .string()
    .trim()
    .min(6, 'Enter your phone number so the courier can reach you.')
    .max(30),
  line1: z.string().trim().min(1, 'Enter your street address.').max(200),
  line2: z.string().trim().max(200).optional().or(z.literal('')),
  area: z.string().trim().max(120).optional().or(z.literal('')),
  city: z.string().trim().min(1, 'Enter your district or city.').max(120),
  region: z.string().trim().max(120).optional().or(z.literal('')),
  postcode: z.string().trim().max(20).optional().or(z.literal('')),
  country: z.string().trim().length(2, 'Choose a country.'),
});

export interface ShippingQuoteResult {
  ok: boolean;
  error?: string;
  zoneCode?: string;
  zoneName?: string;
  label?: string;
  /** Formatted for display — the raw minor-unit value stays server-side. */
  priceFormatted?: string;
  priceMinor?: number;
  wasFree?: boolean;
  minDays?: number;
  maxDays?: number;
  codAvailable?: boolean;
  codReason?: string;
  dutiesNotice?: string;
  subtotalFormatted?: string;
  totalFormatted?: string;
  totalMinor?: number;
}

/**
 * Quotes shipping for a partially-filled address.
 *
 * §6.5 / §28: "Show total cost including shipping BEFORE the payment step.
 * Unexpected shipping cost is the number-one abandonment cause worldwide."
 * The country alone is enough to quote, so this is called as soon as one is
 * chosen rather than at the end.
 */
export async function quoteShippingAction(
  country: string,
  region: string,
  city: string,
): Promise<ShippingQuoteResult> {
  const currency = await getCurrency();
  const raw = (await cookies()).get(CART_COOKIE)?.value;
  const cart = await resolveCart(parseCartCookie(raw), currency);

  if (cart.itemCount === 0) {
    return { ok: false, error: 'Your cart is empty.' };
  }

  const quote = await quoteShipping({
    address: { country, region: region || city, city },
    totalWeightGrams: cart.totalWeightGrams,
    subtotal: cart.subtotal,
    currency,
  });

  if (!quote) {
    return {
      ok: false,
      error:
        'We do not have a delivery rate for that country yet. Send us a message and we will arrange it.',
    };
  }

  const total = cart.subtotal + quote.price;
  const cod = codEligibility({
    zoneCode: quote.zoneCode,
    currency,
    grandTotal: total,
  });

  return {
    ok: true,
    zoneCode: quote.zoneCode,
    zoneName: quote.zoneName,
    label: quote.label,
    priceFormatted:
      quote.price === 0 ? 'Free' : formatMoney(quote.price, currency),
    priceMinor: quote.price,
    wasFree: quote.originalPrice !== null,
    minDays: quote.minDays,
    maxDays: quote.maxDays,
    codAvailable: codAvailable(quote.zoneCode) && cod.eligible,
    codReason: cod.eligible ? undefined : cod.reason,
    // §8.4 — prevents a specific and very common dispute.
    dutiesNotice: dutiesApply(quote.zoneCode)
      ? 'Import duties and taxes are not included and are the responsibility of the customer.'
      : undefined,
    subtotalFormatted: formatMoney(cart.subtotal, currency),
    totalFormatted: formatMoney(total, currency),
    totalMinor: total,
  };
}

const placeOrderSchema = z.object({
  email: z.string().trim().email("That email address doesn't look right.").max(200),
  phone: z
    .string()
    .trim()
    .min(6, 'Enter your phone number so the courier can reach you.')
    .max(30),
  shipping: addressSchema,
  billingSameAsShipping: z.boolean(),
  billing: addressSchema.optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  customerNote: z.string().trim().max(1000).optional().or(z.literal('')),
  acceptedTerms: z.literal(true, {
    message: 'Please accept the terms to place your order.',
  }),
  /** §8.3 — generated client-side per checkout attempt. */
  idempotencyKey: z.string().trim().min(8).max(100),
});

export type PlaceOrderInput = z.input<typeof placeOrderSchema>;

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; publicToken: string }
  | { ok: false; error: string; field?: string };

/**
 * Places the order.
 *
 * The cart is read from the cookie and re-priced from the database; the
 * shipping cost is re-quoted server-side rather than trusted from the form.
 * A tampered client can therefore change what it *asks* for, but not what it
 * *pays* (§13.4).
 */
export async function placeOrderAction(
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue.message,
      field: issue.path.join('.'),
    };
  }
  const data = parsed.data;

  const currency = await getCurrency();
  const jar = await cookies();
  const cart = await resolveCart(parseCartCookie(jar.get(CART_COOKIE)?.value), currency);

  if (cart.itemCount === 0) {
    return { ok: false, error: 'Your cart is empty.' };
  }

  // §6.4 — stock is re-validated at checkout, not just at add-time.
  if (cart.hasIssues) {
    return {
      ok: false,
      error:
        'Something in your cart changed while you were checking out. Please review it and try again.',
    };
  }

  // Re-quote server-side. Never trust a shipping cost from the form.
  const quote = await quoteShipping({
    address: {
      country: data.shipping.country,
      region: data.shipping.region || data.shipping.city,
      city: data.shipping.city,
    },
    totalWeightGrams: cart.totalWeightGrams,
    subtotal: cart.subtotal,
    currency,
  });

  if (!quote) {
    return {
      ok: false,
      error: 'We could not work out delivery for that address. Please check the country.',
    };
  }

  const grandTotal = cart.subtotal + quote.price;

  // COD eligibility is enforced here too, not just hidden in the UI (§13.3).
  if (data.paymentMethod === PaymentMethod.COD) {
    const cod = codEligibility({
      zoneCode: quote.zoneCode,
      currency,
      grandTotal,
    });
    if (!cod.eligible) return { ok: false, error: cod.reason };
  } else {
    // §8.2 is unresolved — no online gateway is wired up yet. Saying so
    // plainly beats a broken redirect (§7.3).
    return {
      ok: false,
      error:
        'Online payment is not available yet. Please choose cash on delivery, or call us to arrange another method.',
    };
  }

  const billing =
    data.billingSameAsShipping || !data.billing ? data.shipping : data.billing;

  const hdrs = await headers();

  try {
    const order = await createOrder({
      email: data.email,
      phone: data.phone,
      currency,
      lines: cart.lines
        .filter((l) => l.quantity > 0)
        .map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      shippingAddress: {
        recipientName: data.shipping.recipientName,
        phone: data.shipping.phone,
        line1: data.shipping.line1,
        line2: data.shipping.line2 || null,
        area: data.shipping.area || null,
        city: data.shipping.city,
        region: data.shipping.region || null,
        postcode: data.shipping.postcode || null,
        country: data.shipping.country,
      },
      billingAddress: {
        recipientName: billing.recipientName,
        phone: billing.phone,
        line1: billing.line1,
        line2: billing.line2 || null,
        area: billing.area || null,
        city: billing.city,
        region: billing.region || null,
        postcode: billing.postcode || null,
        country: billing.country,
      },
      shippingMethod: `${quote.zoneName} — ${quote.label}`,
      shippingTotal: quote.price,
      paymentMethod: data.paymentMethod,
      paymentProvider: 'cod',
      customerNote: data.customerNote || null,
      idempotencyKey: data.idempotencyKey,
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent') ?? null,
    });

    // Clear the server-side cart mirror. The client store is cleared by the
    // success page, so a back-button press cannot resubmit a full cart
    // (§23.3, "back button after order placement must not re-submit").
    jar.delete(CART_COOKIE);

    return {
      ok: true,
      orderNumber: order.orderNumber,
      publicToken: order.publicToken,
    };
  } catch (error) {
    // §7.3 — say what happened and what to do next.
    if (error instanceof InsufficientStockError) {
      return {
        ok: false,
        error:
          'Someone bought the last one while you were checking out. Please review your cart.',
      };
    }
    if (error instanceof PriceMismatchError) {
      return { ok: false, error: error.message };
    }
    console.error('Order creation failed', error);
    return {
      ok: false,
      error:
        "Something broke on our end and your order wasn't placed. Nothing was charged. Try again in a moment, or call us.",
    };
  }
}
