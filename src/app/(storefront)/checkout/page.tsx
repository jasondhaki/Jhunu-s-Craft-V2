import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { parseCartCookie, resolveCart } from '@/lib/cart';
import { CART_COOKIE } from '@/lib/cart-cookie';
import { getCurrency } from '@/lib/currency';
import { formatMoney } from '@/lib/money';
import { siteConfig } from '@/lib/site-config';
import { CheckoutForm } from './checkout-form';

/**
 * Checkout — plan §6.5.
 *
 * The order summary is a persistent right column on desktop and a collapsible
 * bar at the top on mobile, per §6.5. It renders server-side from real prices
 * so the customer and the server never disagree about the total.
 */

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false }, // §17.1 — never indexed
};

export default async function CheckoutPage() {
  const currency = await getCurrency();
  const cart = await resolveCart(
    parseCartCookie((await cookies()).get(CART_COOKIE)?.value),
    currency,
  );

  // Nothing to check out. Sending them to the cart explains why, rather than
  // rendering an empty form.
  if (cart.itemCount === 0) redirect('/cart');

  const country = (await headers()).get('x-vercel-ip-country') ?? 'BD';
  const defaultCountry = ['BD', 'IN', 'GB', 'US', 'CA', 'AU'].includes(country)
    ? country
    : 'BD';

  const summary = (
    <>
      <ul className="space-y-4">
        {cart.lines
          .filter((l) => l.quantity > 0)
          .map((line) => (
            <li key={line.variantId} className="flex gap-3">
              <div className="bg-paper-sunk relative size-16 shrink-0 overflow-hidden">
                {line.imageUrl && (
                  <Image
                    src={line.imageUrl}
                    alt={line.imageAlt}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="bg-forest text-paper tabular absolute -top-1 -right-1 inline-flex size-5 items-center justify-center rounded-full text-[11px]"
                >
                  {line.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{line.name}</p>
                <p className="text-muted text-xs">{line.variantLabel}</p>
                {line.madeToOrder && (
                  <p className="text-muted text-xs">Made to order</p>
                )}
              </div>
              <p className="tabular text-sm">
                {formatMoney(line.lineTotal, currency)}
              </p>
            </li>
          ))}
      </ul>

      <dl className="border-line mt-6 space-y-3 border-t pt-4 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="tabular">{formatMoney(cart.subtotal, currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Delivery</dt>
          <dd className="text-muted">Shown once you choose a country</dd>
        </div>
      </dl>

      <p className="text-muted mt-6 text-xs">
        {siteConfig.promises.returnWindowDays}-day returns · Dispatched in{' '}
        {siteConfig.promises.dispatchDays} · Questions?{' '}
        <a href={`tel:${siteConfig.contact.phone}`} className="underline">
          {siteConfig.contact.phoneDisplay}
        </a>
      </p>
    </>
  );

  return (
    <div className="mx-auto max-w-(--container-page) px-4 py-8 md:py-12">
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-xl font-semibold md:text-2xl">Checkout</h1>
        <Link
          href="/cart"
          className="text-jute-deep text-sm underline underline-offset-4 hover:no-underline"
        >
          Back to cart
        </Link>
      </div>

      {/* Mobile: collapsible summary at the top (§6.5) */}
      <details className="border-line mb-8 rounded-md border lg:hidden">
        <summary className="flex min-h-12 cursor-pointer items-center justify-between px-4 text-sm font-medium">
          <span>
            Show order summary ({cart.itemCount}{' '}
            {cart.itemCount === 1 ? 'item' : 'items'})
          </span>
          <span className="tabular">{formatMoney(cart.subtotal, currency)}</span>
        </summary>
        <div className="border-line border-t p-4">{summary}</div>
      </details>

      <div className="grid gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
        <CheckoutForm
          subtotalFormatted={formatMoney(cart.subtotal, currency)}
          itemCount={cart.itemCount}
          defaultCountry={defaultCountry}
        />

        {/* Desktop: persistent summary column (§6.5) */}
        <aside className="hidden lg:sticky lg:top-32 lg:block lg:self-start">
          <h2 className="font-display mb-5 text-md font-semibold">Order summary</h2>
          {summary}
        </aside>
      </div>
    </div>
  );
}
