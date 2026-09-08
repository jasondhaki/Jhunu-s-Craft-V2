import 'server-only';

import type { Currency, Minor } from '@/lib/money';

/**
 * Payment provider interface — plan §8.3.
 *
 * §8.2 is explicit that international payment acceptance from Bangladesh is
 * unresolved and "could change the plan structurally", and it instructs:
 * "Build the checkout so the payment provider is a swappable module — don't
 * hard-couple your order logic to one gateway's SDK."
 *
 * This is that seam. Order creation, stock, and email know only about this
 * interface. Swapping SSLCommerz for aamarPay, or adding bKash alongside,
 * is a new file implementing `PaymentProvider` plus a registry entry — never
 * an edit to order logic.
 *
 * THE NON-NEGOTIABLE (§8.3, §28): an order becomes paid ONLY through
 * `verifyWebhook`. `handleReturn` exists to render "we're checking your
 * payment", never to mark anything paid. A browser redirect can be forged,
 * replayed, or simply abandoned by a customer closing the tab.
 */

export interface PaymentIntent {
  orderId: string;
  orderNumber: string;
  amount: Minor;
  currency: Currency;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  /** Where the gateway sends the customer back to. */
  returnUrl: string;
  cancelUrl: string;
}

/** What the checkout does next after an order is created. */
export type PaymentInitiation =
  | {
      /** Nothing to pay online — COD. The order is placed immediately. */
      kind: 'no_online_payment';
      reference: string;
    }
  | {
      /** Send the customer to the gateway's hosted page (§13.5 — keeps us in
       *  PCI-DSS SAQ-A, because our server never sees card data). */
      kind: 'redirect';
      url: string;
      reference: string;
    };

/** The outcome of verifying an inbound webhook. */
export type WebhookVerification =
  | {
      status: 'valid';
      /** Gateway's unique id for this event, used for idempotency (§8.3). */
      eventId: string;
      orderNumber: string;
      /** What the gateway says happened. */
      outcome: 'paid' | 'failed' | 'cancelled' | 'refunded';
      /** Amount the gateway actually took, in minor units. Compared against
       *  the order total before marking it paid — a mismatch means tampering
       *  or a partial capture and must not silently pass. */
      amount: Minor;
      currency: Currency;
      reference: string;
      raw: unknown;
    }
  | {
      status: 'invalid';
      /** Never expose this to the caller's response body — log it only. */
      reason: string;
    };

export interface PaymentProvider {
  /** Stable identifier stored on the order, so a refund years later knows
   *  which gateway handled it. */
  readonly id: string;
  readonly label: string;

  /** Whether this provider can serve a given destination and currency. */
  supports(params: { zoneCode: string; currency: Currency }): boolean;

  /** Called after the order row exists, before the customer is sent anywhere. */
  initiate(intent: PaymentIntent): Promise<PaymentInitiation>;

  /**
   * Verifies a webhook's signature and parses it. MUST reject anything
   * unsigned, wrongly signed, or stale (§8.3, §13.5).
   *
   * Given the raw body — not a parsed object — because signature schemes are
   * computed over exact bytes and re-serialising JSON breaks them.
   */
  verifyWebhook(params: {
    rawBody: string;
    headers: Headers;
  }): Promise<WebhookVerification>;

  /**
   * Interprets the browser redirect back from the gateway. Returns only what
   * to SHOW the customer. It must never change payment state — see the note
   * at the top of this file.
   */
  handleReturn(params: {
    searchParams: URLSearchParams;
  }): Promise<{ display: 'pending' | 'failed' | 'cancelled'; orderNumber: string | null }>;
}

/** Thrown when a provider is asked for something it cannot do. */
export class PaymentProviderError extends Error {
  constructor(
    message: string,
    readonly providerId: string,
  ) {
    super(message);
    this.name = 'PaymentProviderError';
  }
}
