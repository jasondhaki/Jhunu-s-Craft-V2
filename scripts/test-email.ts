/**
 * Email templates and delivery — plan §10.
 *
 *   npm run test:email            render only, no network
 *   npm run test:email -- --send  actually send to EMAIL_REPLY_TO
 *
 * Renders against a real order shape so the assertions mean something, then
 * optionally performs one live send. Nothing is written to the database.
 */

import 'dotenv/config';
import type { Order, OrderItem } from '@prisma/client';
import {
  orderConfirmationEmail,
  orderShippedEmail,
  orderCancelledEmail,
} from '../src/lib/email/templates';
import { sendEmail, emailEnabled } from '../src/lib/email/send';

const results: [string, boolean, string][] = [];
const check = (name: string, pass: boolean, detail = '') =>
  results.push([name, pass, detail]);

const now = new Date();

const fixture = {
  id: 'test-order',
  orderNumber: 'BD-2026-09999',
  publicToken: 'test-token-abc123',
  customerId: null,
  email: process.env.EMAIL_REPLY_TO ?? 'test@example.com',
  phone: '+8801700000000',
  status: 'PENDING',
  paymentStatus: 'UNPAID',
  paymentMethod: 'COD',
  paymentProvider: 'cod',
  paymentReference: null,
  currency: 'BDT',
  subtotal: 285_000,
  discountTotal: 0,
  shippingTotal: 6_000,
  taxTotal: 0,
  grandTotal: 291_000,
  couponCode: null,
  shippingAddress: {
    recipientName: 'Ayesha Rahman',
    phone: '+8801711111111',
    line1: 'House 42, Road 7',
    line2: null,
    area: 'Mohammadpur',
    city: 'Dhaka',
    region: 'Dhaka',
    postcode: '1207',
    country: 'BD',
  },
  billingAddress: {},
  shippingMethod: 'Inside Dhaka — Standard courier',
  courierName: 'Pathao Courier',
  trackingNumber: 'PTH-99887766',
  trackingUrl: null,
  customerNote: null,
  internalNote: null,
  ipAddress: null,
  userAgent: null,
  idempotencyKey: 'test-key',
  placedAt: now,
  confirmedAt: null,
  shippedAt: null,
  deliveredAt: null,
  cancelledAt: null,
} as unknown as Order;

const items = [
  {
    id: 'i1',
    orderId: 'test-order',
    productId: 'p1',
    variantId: 'v1',
    productNameSnapshot: 'Natural Jute Shopping Bag',
    skuSnapshot: 'JUT-SHP-NAT-010',
    variantLabelSnapshot: 'Natural',
    imageUrlSnapshot: null,
    unitPrice: 85_000,
    quantity: 1,
    lineTotal: 85_000,
    personalizationNote: null,
  },
  {
    id: 'i2',
    orderId: 'test-order',
    productId: 'p2',
    variantId: 'v2',
    // Deliberately contains characters that must be escaped, to prove the
    // template does not allow HTML injection through product data (§13.4).
    productNameSnapshot: 'Chestnut <Leather> & "Crossbody"',
    skuSnapshot: 'LEA-CRS-CHE-100',
    variantLabelSnapshot: 'Chestnut',
    imageUrlSnapshot: null,
    unitPrice: 200_000,
    quantity: 1,
    lineTotal: 200_000,
    personalizationNote: null,
  },
] as unknown as OrderItem[];

const order = { ...fixture, items } as Order & { items: OrderItem[] };

async function main() {
  // --- Confirmation -------------------------------------------------------
  const confirmation = orderConfirmationEmail(order);

  check('Confirmation has a subject with the order number',
    confirmation.subject.includes('BD-2026-09999'), confirmation.subject);
  check('Confirmation has BOTH html and plain text (§10.2)',
    confirmation.html.length > 500 && confirmation.text.length > 200,
    `html ${confirmation.html.length}b, text ${confirmation.text.length}b`);
  check('Total is formatted in taka, from minor units',
    confirmation.html.includes('৳2,910') && confirmation.text.includes('৳2,910'),
    '৳2,910 = 291000 poisha');
  check('Free-vs-paid delivery line renders',
    confirmation.text.includes('৳60'), 'delivery ৳60');
  check('COD instruction tells the customer what to have ready',
    confirmation.text.includes('cash ready for the courier'));
  check('Delivery address is included',
    confirmation.text.includes('Mohammadpur') && confirmation.text.includes('Ayesha Rahman'));
  check('Tracking link uses the unguessable token, not just the order number (§13.3)',
    confirmation.html.includes('token=test-token-abc123'));
  check('Natural-variation note is present (§6.3.12)',
    confirmation.text.includes('made by hand'));

  // §13.4 — product data must not be able to inject markup.
  check('Product names are HTML-escaped in the template',
    confirmation.html.includes('&lt;Leather&gt;') &&
      !confirmation.html.includes('<Leather>'),
    'raw <Leather> absent, escaped form present');

  // §10.2 — no unsubscribe link in transactional mail.
  check('No unsubscribe link in a transactional email (§10.2)',
    !/unsubscribe/i.test(confirmation.html));

  check('Viewport meta present so it reads at 320px (§10.2)',
    confirmation.html.includes('width=device-width'));
  check('Dark-mode hint present (§10.2)',
    confirmation.html.includes('color-scheme'));

  // --- Shipped ------------------------------------------------------------
  const shipped = orderShippedEmail(order);
  check('Shipped email carries the tracking number (§10.1)',
    shipped.text.includes('PTH-99887766'), 'PTH-99887766');
  check('Shipped email names the courier',
    shipped.text.includes('Pathao Courier'));

  // --- Cancelled ----------------------------------------------------------
  const cancelledUnpaid = orderCancelledEmail(order, 'Out of stock.');
  check('Cancelling an UNPAID order says nothing was charged',
    cancelledUnpaid.text.includes('Nothing was charged'));

  const paidOrder = { ...order, paymentStatus: 'PAID' } as typeof order;
  const cancelledPaid = orderCancelledEmail(paidOrder, null);
  check('Cancelling a PAID order gives a refund timeline (§10.1)',
    cancelledPaid.text.includes('5–10 working days'));

  // --- Live send ----------------------------------------------------------
  check('RESEND_API_KEY is configured', emailEnabled,
    emailEnabled ? 'yes' : 'no — sends will be skipped');

  if (process.argv.includes('--send')) {
    if (!emailEnabled) {
      check('Live send', false, 'skipped: no API key');
    } else {
      const result = await sendEmail(confirmation);
      check(
        `Live send to ${confirmation.to}`,
        result.sent,
        result.sent ? `id ${result.id}` : (result.error ?? 'unknown error'),
      );
    }
  }

  console.log('');
  for (const [name, pass, detail] of results) {
    console.log(
      `${(pass ? 'PASS' : '**FAIL**').padEnd(10)} ${name}${detail ? '  —  ' + detail : ''}`,
    );
  }
  const failed = results.filter((r) => !r[1]).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exitCode = failed ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
