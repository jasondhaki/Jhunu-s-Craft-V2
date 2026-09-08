import 'server-only';

import type {
  PaymentProvider,
  PaymentIntent,
  PaymentInitiation,
  WebhookVerification,
} from './provider';

/**
 * Cash on delivery — plan §8.1.
 *
 * "Essential. Likely the majority of local orders."
 *
 * COD is the one method where no money moves online, so the order is placed
 * immediately with `payment_status: UNPAID` and stays that way until the
 * courier hands over cash and an admin marks it paid. That is not a loophole
 * in the webhook rule (§8.3) — there is simply no gateway involved, and the
 * state transition is a deliberate human action recorded in the audit log.
 *
 * §8.1 also warns about abuse: "verify phone via OTP for first-time COD, or
 * cap COD order value". The cap is implemented here; OTP is Phase 3 and is
 * tracked in CONTEXT.md.
 */

/**
 * §8.1 COD abuse control. ৳15,000 in poisha.
 *
 * A refused COD parcel costs the workshop the courier fee both ways plus the
 * tied-up stock, so the exposure per order is capped until phone verification
 * exists. Above this the customer is asked to pay online instead — which is
 * a real limitation to state plainly, not an error to hide.
 */
export const COD_MAX_ORDER_VALUE_BDT = 1_500_000;

export const codProvider: PaymentProvider = {
  id: 'cod',
  label: 'Cash on delivery',

  supports({ zoneCode, currency }) {
    // Domestic only, and BDT only. Asking a courier in Berlin to collect
    // taka is not a thing.
    return zoneCode.startsWith('BD_') && currency === 'BDT';
  },

  async initiate(intent: PaymentIntent): Promise<PaymentInitiation> {
    // Nothing to redirect to. The order is already placed; the customer goes
    // straight to the confirmation page.
    return {
      kind: 'no_online_payment',
      reference: `COD-${intent.orderNumber}`,
    };
  },

  async verifyWebhook(): Promise<WebhookVerification> {
    // COD has no gateway, so any webhook claiming to be COD is bogus.
    // Rejecting rather than ignoring means it shows up in logs.
    return {
      status: 'invalid',
      reason: 'COD has no webhook endpoint; this request should not exist.',
    };
  },

  async handleReturn() {
    // Nothing redirects back for COD either.
    return { display: 'pending', orderNumber: null };
  },
};

/**
 * Whether COD may be offered for this basket. Returns the reason when it may
 * not, so the checkout can explain rather than silently hiding the option —
 * §7.3: errors say what happened and what to do next.
 */
export function codEligibility(params: {
  zoneCode: string;
  currency: string;
  grandTotal: number;
}): { eligible: true } | { eligible: false; reason: string } {
  if (!params.zoneCode.startsWith('BD_') || params.currency !== 'BDT') {
    return {
      eligible: false,
      reason: 'Cash on delivery is only available for orders inside Bangladesh.',
    };
  }
  if (params.grandTotal > COD_MAX_ORDER_VALUE_BDT) {
    return {
      eligible: false,
      reason:
        'Cash on delivery is available on orders up to ৳15,000. For larger orders, please pay online or contact us to arrange it.',
    };
  }
  return { eligible: true };
}
