import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { AlertTriangle } from 'lucide-react';
import { parseCartCookie, resolveCart } from '@/lib/cart';
import { CART_COOKIE } from '@/lib/cart-cookie';
import { getCurrency } from '@/lib/currency';
import { formatMoney } from '@/lib/money';
import { siteConfig } from '@/lib/site-config';
import { buttonClasses } from '@/components/ui/button';
import { ProductGrid } from '@/components/commerce/product-grid';
import { getFeaturedProducts } from '@/lib/catalog';
import {
  QuantityStepper,
  RemoveLineButton,
  PruneRemovedLines,
} from '@/components/commerce/cart-controls';

/**
 * Cart page — plan §6.4.
 *
 * Server-rendered: every price and every stock figure is read from the
 * database here, not from the client store. The cookie only says WHICH
 * variants to look up (§13.4).
 */

export const metadata: Metadata = {
  title: 'Your cart',
  robots: { index: false, follow: false }, // §17.1 — /cart is not indexed
};

export default async function CartPage() {
  const currency = await getCurrency();
  const raw = (await cookies()).get(CART_COOKIE)?.value;
  const cart = await resolveCart(parseCartCookie(raw), currency);

  if (cart.itemCount === 0 && cart.lines.length === 0) {
    return <EmptyCart currency={currency} />;
  }

  const threshold = siteConfig.freeShippingThreshold[currency];
  const shortfall = threshold - cart.subtotal;

  return (
    <div className="mx-auto max-w-(--container-page) px-4 py-8 md:py-12">
      <h1 className="font-display text-xl font-semibold md:text-2xl">Your cart</h1>

      {/* §23.3 — a product deleted while it sat in someone's cart */}
      {cart.removedVariantIds.length > 0 && (
        <div
          role="status"
          className="border-clay mt-6 flex flex-wrap items-center gap-3 rounded-md border px-4 py-3 text-sm"
        >
          <AlertTriangle className="text-clay size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">
            {cart.removedVariantIds.length === 1 ? 'An item is' : 'Some items are'}{' '}
            no longer available and cannot be ordered.
          </span>
          <PruneRemovedLines variantIds={cart.removedVariantIds} />
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
        {/* --- Line items --------------------------------------------- */}
        <ul className="border-line divide-line divide-y border-y">
          {cart.lines.map((line) => (
            <li key={line.variantId} className="flex gap-4 py-5">
              <Link
                href={`/product/${line.slug}`}
                className="bg-paper-sunk relative size-24 shrink-0 overflow-hidden sm:size-28"
              >
                {line.imageUrl && (
                  <Image
                    src={line.imageUrl}
                    alt={line.imageAlt}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <h2 className="text-base font-medium">
                    <Link href={`/product/${line.slug}`} className="hover:underline">
                      {line.name}
                    </Link>
                  </h2>
                  <p className="tabular text-jute-deep font-medium">
                    {formatMoney(line.lineTotal, currency)}
                  </p>
                </div>

                <p className="text-muted mt-1 text-sm">
                  {line.variantLabel}
                  {line.quantity > 1 && (
                    <>
                      {' · '}
                      <span className="tabular">
                        {formatMoney(line.unitPrice, currency)} each
                      </span>
                    </>
                  )}
                </p>

                {line.madeToOrder && (
                  <p className="text-muted mt-1 text-xs">Made to order</p>
                )}

                {/* §7.3 — say what happened and what to do next */}
                {line.issue && (
                  <p role="status" className="text-clay mt-2 text-sm">
                    {line.issue}
                  </p>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-4 pt-3">
                  {line.quantity > 0 && (
                    <QuantityStepper
                      variantId={line.variantId}
                      quantity={line.quantity}
                      max={Math.min(line.available, 20)}
                      productName={line.name}
                    />
                  )}
                  <RemoveLineButton
                    variantId={line.variantId}
                    productName={line.name}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* --- Order summary ------------------------------------------ */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <h2 className="font-display text-md font-semibold">Order summary</h2>

          {/* §9.1 — free-shipping progress reliably lifts average order value.
              Real threshold, real remaining amount; no invented urgency. */}
          {shortfall > 0 ? (
            <div className="border-line mt-4 rounded-md border p-4">
              <p className="text-sm">
                Add{' '}
                <span className="tabular font-medium">
                  {formatMoney(shortfall, currency)}
                </span>{' '}
                more for free delivery inside Dhaka.
              </p>
              <div
                className="bg-paper-sunk mt-3 h-1.5 overflow-hidden rounded-full"
                role="progressbar"
                aria-valuenow={Math.min(100, Math.round((cart.subtotal / threshold) * 100))}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progress towards free delivery"
              >
                <div
                  className="bg-leaf h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (cart.subtotal / threshold) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            cart.subtotal > 0 && (
              <p className="text-leaf border-line mt-4 rounded-md border px-4 py-3 text-sm">
                Your order qualifies for free delivery inside Dhaka.
              </p>
            )
          )}

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="tabular">{formatMoney(cart.subtotal, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery</dt>
              {/* §6.5 / §28 — shipping is never hidden until the last step.
                  It cannot be exact until we know the address, and saying so
                  is better than showing a number that later changes. */}
              <dd className="text-muted">Calculated at checkout</dd>
            </div>
            <div className="border-line flex justify-between border-t pt-3 text-base font-medium">
              <dt>Total</dt>
              <dd className="tabular">{formatMoney(cart.subtotal, currency)}</dd>
            </div>
          </dl>

          <Link
            href="/checkout"
            aria-disabled={cart.itemCount === 0}
            className={`${buttonClasses('primary', 'lg', true)} mt-6 ${
              cart.itemCount === 0 ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            Proceed to checkout
          </Link>

          <Link
            href="/shop"
            className={`${buttonClasses('secondary', 'md', true)} mt-3`}
          >
            Continue shopping
          </Link>

          <p className="text-muted mt-6 text-xs">
            {siteConfig.promises.returnWindowDays}-day returns. Dispatched in{' '}
            {siteConfig.promises.dispatchDays}. Questions? Call{' '}
            <a href={`tel:${siteConfig.contact.phone}`} className="underline">
              {siteConfig.contact.phoneDisplay}
            </a>
            .
          </p>
        </aside>
      </div>
    </div>
  );
}

/** §6.4 — "friendly line + Shop all bags button + 4 best sellers." */
async function EmptyCart({ currency }: { currency: 'BDT' | 'USD' }) {
  const suggestions = await getFeaturedProducts(4);

  return (
    <div className="mx-auto max-w-(--container-page) px-4 py-12 md:py-16">
      <h1 className="font-display text-xl font-semibold md:text-2xl">Your cart</h1>
      <p className="text-forest-soft mt-4">
        Nothing in it yet. Everything here is made by hand, a few at a time —
        have a look at what is ready now.
      </p>
      <Link href="/shop" className={`${buttonClasses('primary', 'lg')} mt-6`}>
        Shop all bags
      </Link>

      {suggestions.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-lg font-semibold">Popular right now</h2>
          <ProductGrid
            products={suggestions}
            currency={currency}
            locale="en"
            className="mt-8"
          />
        </section>
      )}
    </div>
  );
}
