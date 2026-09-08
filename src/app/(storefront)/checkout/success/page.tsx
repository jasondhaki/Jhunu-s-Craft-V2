import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { siteConfig, whatsappUrl } from '@/lib/site-config';
import { buttonClasses } from '@/components/ui/button';
import { ClearCartOnMount } from './clear-cart';

/**
 * Order confirmation — plan §6.6.
 *
 * "Order number (large, copyable), summary of items, delivery address,
 * payment method, estimated delivery window, 'Track your order' link, 'What
 * happens next' in three plain steps, contact details for questions."
 *
 * SECURITY (§13.3): the order is looked up by its unguessable `publicToken`,
 * never by the sequential order number alone. Knowing someone's order number
 * must not reveal their address and phone number — that is the IDOR class of
 * bug §13.3 calls "the most common serious flaw in small ecommerce sites".
 */

export const metadata: Metadata = {
  title: 'Order placed',
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; token?: string }>;
}) {
  const { order: orderNumber, token } = await searchParams;

  // Both required, and the token is what actually authorises the lookup.
  if (!orderNumber || !token) notFound();

  const order = await db.order.findFirst({
    where: { orderNumber, publicToken: token },
    include: { items: true },
  });

  if (!order) notFound();

  const address = order.shippingAddress as Record<string, string | null>;
  const chatHref = whatsappUrl(`Hello — about my order ${order.orderNumber}`);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:py-16">
      {/* The cart is emptied here rather than before navigation, so a failed
          redirect never loses someone's basket (§23.3). */}
      <ClearCartOnMount />

      <div className="flex items-start gap-3">
        <CheckCircle2 className="text-leaf mt-1 size-6 shrink-0" aria-hidden="true" />
        <div>
          <h1 className="font-display text-xl font-semibold md:text-2xl">
            Order placed
          </h1>
          {/* §7.3 — the confirmation matches the button verb */}
          <p className="text-forest-soft mt-2">
            Thank you. We have emailed your confirmation to{' '}
            <span className="font-medium">{order.email}</span>.
          </p>
        </div>
      </div>

      {/* Order number, large and selectable (§6.6) */}
      <div className="border-line bg-paper-sunk mt-8 rounded-md border p-5">
        <p className="text-muted text-sm">Your order number</p>
        <p className="font-display tabular mt-1 text-xl font-semibold select-all">
          {order.orderNumber}
        </p>
        <p className="text-muted mt-2 text-xs">
          Keep this — you will need it to track your order.
        </p>
      </div>

      {/* What happens next, in three plain steps (§6.6) */}
      <section className="mt-10">
        <h2 className="font-display text-md font-semibold">What happens next</h2>
        <ol className="mt-4 space-y-4">
          {[
            {
              title: 'We confirm your order',
              body: 'Usually within a few hours. We will call if anything about the address is unclear.',
            },
            {
              title: 'Your bag is prepared',
              body: `Dispatched in ${siteConfig.promises.dispatchDays}. Made-to-order pieces take longer, and we will tell you if so.`,
            },
            {
              title: 'The courier delivers',
              body:
                order.paymentMethod === 'COD'
                  ? `Pay ${formatMoney(order.grandTotal, order.currency)} in cash when it arrives. The courier will call first.`
                  : 'The courier will call before delivering.',
            },
          ].map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span
                aria-hidden="true"
                className="border-line tabular mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-sm"
              >
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-muted mt-1 text-sm">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Summary (§6.6) */}
      <section className="mt-10">
        <h2 className="font-display text-md font-semibold">Your order</h2>
        <ul className="border-line divide-line mt-4 divide-y border-y">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-baseline gap-3 py-3 text-sm">
              <span className="tabular text-muted">{item.quantity}×</span>
              <span className="flex-1">
                {item.productNameSnapshot}
                <span className="text-muted"> · {item.variantLabelSnapshot}</span>
              </span>
              <span className="tabular">
                {formatMoney(item.lineTotal, order.currency)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular">{formatMoney(order.subtotal, order.currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery — {order.shippingMethod}</dt>
            <dd className="tabular">
              {order.shippingTotal === 0
                ? 'Free'
                : formatMoney(order.shippingTotal, order.currency)}
            </dd>
          </div>
          <div className="border-line flex justify-between border-t pt-2 text-base font-medium">
            <dt>Total</dt>
            <dd className="tabular">{formatMoney(order.grandTotal, order.currency)}</dd>
          </div>
        </dl>

        <p className="text-muted mt-3 text-sm">
          {order.paymentMethod === 'COD'
            ? 'Paying by cash on delivery.'
            : 'Payment method: ' + order.paymentMethod.toLowerCase()}
        </p>
      </section>

      {/* Delivery address (§6.6) */}
      <section className="mt-10">
        <h2 className="font-display text-md font-semibold">Delivering to</h2>
        <address className="text-forest-soft mt-3 text-sm not-italic">
          {address.recipientName}
          <br />
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ''}
          <br />
          {[address.area, address.city, address.region].filter(Boolean).join(', ')}
          {address.postcode ? ` ${address.postcode}` : ''}
          <br />
          {address.country}
          <br />
          {address.phone}
        </address>
      </section>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href={`/track-order?order=${encodeURIComponent(order.orderNumber)}&token=${encodeURIComponent(order.publicToken)}`}
          className={buttonClasses('primary', 'md')}
        >
          Track your order
        </Link>
        <Link href="/shop" className={buttonClasses('secondary', 'md')}>
          Continue shopping
        </Link>
      </div>

      {/* §14.4 — contact details for questions, right where doubt appears */}
      <p className="text-muted mt-10 text-sm">
        Questions about this order? Call{' '}
        <a href={`tel:${siteConfig.contact.phone}`} className="underline">
          {siteConfig.contact.phoneDisplay}
        </a>
        {chatHref && (
          <>
            {' '}or{' '}
            <a
              href={chatHref}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              message us on WhatsApp
            </a>
          </>
        )}
        .
      </p>
    </div>
  );
}
