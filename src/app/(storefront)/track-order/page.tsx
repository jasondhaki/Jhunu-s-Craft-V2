import type { Metadata } from 'next';
import Link from 'next/link';
import { findOrderForGuest } from '@/lib/customer-orders';
import { rateLimit } from '@/lib/customer-auth';
import { headers } from 'next/headers';
import { OrderDetail } from '@/components/commerce/order-detail';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/site-config';

/**
 * Guest order tracking — plan §6.9 and §14.4.
 *
 * §6.9: "order number + email or phone, no login needed."
 * §14.4 lists "order tracking that works without an account" as a core
 * transaction-trust measure, and §28 warns against forcing registration.
 *
 * SECURITY (§13.3): an order number alone is never enough. Order numbers are
 * sequential by design so a customer can read one out over the phone, which
 * makes them guessable — so either the unguessable token from the
 * confirmation email, or the order number PLUS a contact detail that matches
 * the order, is required.
 */

export const metadata: Metadata = {
  title: 'Track your order',
  description:
    'Check where your order is. No account needed — just your order number and the email or phone you used.',
};

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; token?: string; contact?: string }>;
}) {
  const { order: orderNumber, token, contact } = await searchParams;

  let result: Awaited<ReturnType<typeof findOrderForGuest>> = null;
  let notFoundMessage: string | null = null;

  if (orderNumber && (token || contact)) {
    // §13.6 — rate limited per IP, so this cannot be used to walk through
    // order numbers testing contact details.
    const ip =
      (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const { allowed } = rateLimit(`track:${ip}`, 10, 15 * 60 * 1000);

    if (!allowed) {
      notFoundMessage =
        'Too many attempts. Please wait a few minutes, or call us and we will look it up for you.';
    } else {
      result = await findOrderForGuest({
        orderNumber,
        token,
        emailOrPhone: contact,
      });

      if (!result) {
        // §7.3 — one message for both "no such order" and "details do not
        // match", so this cannot confirm whether an order number is real.
        notFoundMessage =
          'We could not find an order with those details. Check the order number and the email or phone you used, or call us.';
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      {result ? (
        <>
          <p className="mb-8">
            <Link
              href="/track-order"
              className="text-jute-deep text-sm underline underline-offset-4"
            >
              ← Track another order
            </Link>
          </p>
          <OrderDetail order={result} />
        </>
      ) : (
        <>
          <h1 className="font-display text-xl font-semibold md:text-2xl">
            Track your order
          </h1>
          <p className="text-forest-soft mt-3">
            No account needed. Enter your order number and the email address or
            phone number you used when ordering.
          </p>

          {notFoundMessage && (
            <p
              role="alert"
              className="border-clay text-clay mt-6 rounded-md border px-4 py-3 text-sm"
            >
              {notFoundMessage}
            </p>
          )}

          {/* A plain GET form: it works without JavaScript, and the result is
              a shareable URL the customer can bookmark. */}
          <form action="/track-order" method="get" className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="order"
                className="mb-1.5 block text-sm font-medium"
              >
                Order number
              </label>
              <input
                id="order"
                name="order"
                required
                defaultValue={orderNumber ?? ''}
                placeholder="BD-2026-00042"
                className="border-line-strong bg-paper tabular min-h-11 w-full rounded-sm border px-3"
              />
              <p className="text-muted mt-1.5 text-xs">
                On your confirmation email, and on the page you saw after
                ordering.
              </p>
            </div>

            <div>
              <label
                htmlFor="contact"
                className="mb-1.5 block text-sm font-medium"
              >
                Email or phone
              </label>
              <input
                id="contact"
                name="contact"
                required
                defaultValue={contact ?? ''}
                autoComplete="email"
                className="border-line-strong bg-paper min-h-11 w-full rounded-sm border px-3"
              />
              <p className="text-muted mt-1.5 text-xs">
                Whichever you gave when you ordered.
              </p>
            </div>

            <Button type="submit" size="lg">
              Find my order
            </Button>
          </form>

          <p className="text-muted mt-8 text-sm">
            Cannot find it? Call{' '}
            <a href={`tel:${siteConfig.contact.phone}`} className="underline">
              {siteConfig.contact.phoneDisplay}
            </a>{' '}
            and we will look it up.
          </p>
        </>
      )}
    </div>
  );
}
