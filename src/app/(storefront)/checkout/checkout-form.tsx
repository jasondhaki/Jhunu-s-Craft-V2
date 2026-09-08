'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Truck, Banknote, Lock } from 'lucide-react';
import { useCart } from '@/lib/cart-store';
import { Button } from '@/components/ui/button';
import {
  BD_DIVISIONS,
  districtsForDivision,
  addressLabels,
  SHIPPING_COUNTRIES,
} from '@/lib/bd-geography';
import {
  quoteShippingAction,
  placeOrderAction,
  type ShippingQuoteResult,
} from './actions';

/**
 * Checkout form — plan §6.5.
 *
 * "Single-page accordion checkout (three collapsible steps on one page) is
 * the right shape for a small store — fewer page loads, less abandonment."
 *
 * Rules from §6.5 implemented here:
 *  - Guest is the default. There is no account wall anywhere on this page.
 *  - Country sits at the TOP of the address block, because it determines the
 *    shipping methods and currency shown.
 *  - Shipping cost is quoted as soon as a country is known, well before the
 *    payment step (§28's number-one abandonment cause).
 *  - Correct `autocomplete` attributes on every field.
 *  - `inputmode="numeric"` for phone and postcode.
 *  - Inline validation on blur, not on every keystroke.
 *  - The submit button disables and shows a spinner, and the order carries an
 *    idempotency key, so a double-click cannot create two orders.
 */

interface Props {
  subtotalFormatted: string;
  itemCount: number;
  defaultCountry: string;
}

type Errors = Record<string, string>;

export function CheckoutForm({ subtotalFormatted, defaultCountry }: Props) {
  const router = useRouter();
  const clearCart = useCart((s) => s.clear);

  const [country, setCountry] = useState(defaultCountry);
  const [division, setDivision] = useState('Dhaka');
  const [quote, setQuote] = useState<ShippingQuoteResult | null>(null);
  const [quoting, startQuoting] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [billingSame, setBillingSame] = useState(true);

  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  /**
   * One idempotency key per mounted checkout (§8.3). Regenerated only after a
   * successful order, so retrying a failed submit reuses the same key and
   * cannot produce a duplicate.
   */
  const idempotencyKey = useRef(crypto.randomUUID());

  const labels = addressLabels(country);
  const isBD = country === 'BD';
  const districts = districtsForDivision(division);

  // Re-quote whenever the destination changes.
  const [city, setCity] = useState('Dhaka');
  useEffect(() => {
    startQuoting(async () => {
      const result = await quoteShippingAction(country, isBD ? division : '', city);
      setQuote(result);
    });
  }, [country, division, city, isBD]);

  function validateField(name: string, value: string): string | null {
    switch (name) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? null
          : "That email address doesn't look right.";
      case 'phone':
      case 'shipping.phone':
        return value.trim().length >= 6
          ? null
          : 'Enter your phone number so the courier can reach you.';
      case 'shipping.recipientName':
        return value.trim() ? null : 'Enter the name for delivery.';
      case 'shipping.line1':
        return value.trim() ? null : 'Enter your street address.';
      case 'shipping.city':
        return value.trim() ? null : `Enter your ${labels.city.toLowerCase()}.`;
      default:
        return null;
    }
  }

  // §6.5 — inline validation on blur, not on every keystroke.
  function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
    const message = validateField(event.target.name, event.target.value);
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[event.target.name] = message;
      else delete next[event.target.name];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return; // belt and braces against a double submit

    setFormError(null);
    setSubmitting(true);

    const fd = new FormData(event.currentTarget);
    const get = (name: string) => String(fd.get(name) ?? '');

    const payload = {
      email: get('email'),
      phone: get('phone'),
      shipping: {
        recipientName: get('shipping.recipientName'),
        phone: get('shipping.phone') || get('phone'),
        line1: get('shipping.line1'),
        line2: get('shipping.line2'),
        area: get('shipping.area'),
        city: get('shipping.city'),
        region: get('shipping.region'),
        postcode: get('shipping.postcode'),
        country: get('shipping.country'),
      },
      billingSameAsShipping: billingSame,
      billing: billingSame
        ? undefined
        : {
            recipientName: get('billing.recipientName'),
            phone: get('billing.phone') || get('phone'),
            line1: get('billing.line1'),
            line2: get('billing.line2'),
            area: get('billing.area'),
            city: get('billing.city'),
            region: get('billing.region'),
            postcode: get('billing.postcode'),
            country: get('billing.country') || get('shipping.country'),
          },
      paymentMethod: 'COD' as const,
      customerNote: get('customerNote'),
      acceptedTerms: fd.get('acceptedTerms') === 'on',
      idempotencyKey: idempotencyKey.current,
    };

    const result = await placeOrderAction(payload as never);

    if (result.ok) {
      // Clear the client cart before navigating, so the back button lands on
      // an empty cart rather than a stale one (§23.3).
      clearCart();
      router.push(
        `/checkout/success?order=${encodeURIComponent(result.orderNumber)}&token=${encodeURIComponent(result.publicToken)}`,
      );
      return;
    }

    setSubmitting(false);
    setFormError(result.error);
    if (result.field) setErrors((p) => ({ ...p, [result.field!]: result.error }));
    // Move focus to the message so it is not missed (§20).
    requestAnimationFrame(() => errorRef.current?.focus());
  }

  const canPlaceOrder = Boolean(quote?.ok && quote.codAvailable && !quoting);

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-10">
      {formError && (
        <p
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="border-clay text-clay rounded-md border px-4 py-3 text-sm"
        >
          {formError}
        </p>
      )}

      {/* ================= Step 1 — Contact (§6.5) ================= */}
      <Section step={1} title="Contact">
        {/* §6.5, §28 — guest is the default. No account wall, ever. The
            log-in link is an offer, not a gate. */}
        <p className="text-muted mb-4 text-sm">
          No account needed. We only use these to send your order confirmation
          and so the courier can reach you.{' '}
          <Link
            href="/login"
            className="text-jute-deep underline underline-offset-4 hover:no-underline"
          >
            Already have an account? Log in
          </Link>
          .
        </p>

        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={errors.email}
          onBlur={handleBlur}
        />
        <Field
          label="Phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          required
          hint="The courier will call before delivering."
          error={errors.phone}
          onBlur={handleBlur}
        />
      </Section>

      {/* ================= Step 2 — Delivery (§6.5) ================= */}
      <Section step={2} title="Delivery">
        {/* Country first — it decides the shipping methods and currency. */}
        <div>
          <label htmlFor="shipping.country" className="mb-1.5 block text-sm font-medium">
            Country
          </label>
          <select
            id="shipping.country"
            name="shipping.country"
            autoComplete="country"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              if (e.target.value !== 'BD') setCity('');
            }}
            className="border-line-strong bg-paper min-h-11 w-full rounded-sm border px-3"
          >
            {SHIPPING_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <Field
          label="Full name"
          name="shipping.recipientName"
          autoComplete="name"
          required
          error={errors['shipping.recipientName']}
          onBlur={handleBlur}
        />
        <Field
          label="Phone for delivery"
          name="shipping.phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          hint="Leave blank to use the number above."
          error={errors['shipping.phone']}
          onBlur={handleBlur}
        />
        <Field
          label="Address"
          name="shipping.line1"
          autoComplete="address-line1"
          required
          error={errors['shipping.line1']}
          onBlur={handleBlur}
        />
        <Field
          label="Apartment, floor (optional)"
          name="shipping.line2"
          autoComplete="address-line2"
        />

        {isBD ? (
          <>
            {/* §6.5 — cascading Division → District for Bangladesh */}
            <div>
              <label htmlFor="shipping.region" className="mb-1.5 block text-sm font-medium">
                {labels.region}
              </label>
              <select
                id="shipping.region"
                name="shipping.region"
                value={division}
                onChange={(e) => {
                  setDivision(e.target.value);
                  setCity(districtsForDivision(e.target.value)[0] ?? '');
                }}
                className="border-line-strong bg-paper min-h-11 w-full rounded-sm border px-3"
              >
                {BD_DIVISIONS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="shipping.city" className="mb-1.5 block text-sm font-medium">
                {labels.city}
              </label>
              <select
                id="shipping.city"
                name="shipping.city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="border-line-strong bg-paper min-h-11 w-full rounded-sm border px-3"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <Field
              label={labels.area}
              name="shipping.area"
              autoComplete="address-level3"
              hint="e.g. Mohammadpur, Tejgaon"
            />
          </>
        ) : (
          <>
            <Field
              label={labels.city}
              name="shipping.city"
              autoComplete="address-level2"
              required
              defaultValue={city}
              onChange={(e) => setCity((e.target as HTMLInputElement).value)}
              error={errors['shipping.city']}
              onBlur={handleBlur}
            />
            <Field
              label={labels.region}
              name="shipping.region"
              autoComplete="address-level1"
            />
          </>
        )}

        <Field
          label={labels.postcode}
          name="shipping.postcode"
          inputMode="numeric"
          autoComplete="postal-code"
          required={labels.postcodeRequired}
        />

        {/* §6.5 — checked by default */}
        <label className="flex items-start gap-3 pt-2 text-sm">
          <input
            type="checkbox"
            checked={billingSame}
            onChange={(e) => setBillingSame(e.target.checked)}
            className="mt-0.5 size-4"
          />
          Billing address is the same as delivery
        </label>

        <Field
          label="Order note (optional)"
          name="customerNote"
          hint="Anything the courier or we should know — 'leave with the guard', 'gift, no invoice inside'."
          textarea
        />

        {/* --- Delivery method + cost (§6.5) ------------------------- */}
        <div
          className="border-line mt-2 rounded-md border p-4"
          aria-live="polite"
          aria-busy={quoting}
        >
          {quoting && <p className="text-muted text-sm">Working out delivery…</p>}

          {!quoting && quote?.ok && (
            <div className="flex items-start gap-3">
              <Truck className="text-jute-deep mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {quote.zoneName} — {quote.label}
                </p>
                <p className="text-muted text-sm">
                  {quote.minDays}–{quote.maxDays} days ·{' '}
                  <span className="tabular">{quote.priceFormatted}</span>
                  {quote.wasFree && ' (free delivery applied)'}
                </p>
                {quote.dutiesNotice && (
                  <p className="text-muted mt-2 text-xs">{quote.dutiesNotice}</p>
                )}
              </div>
            </div>
          )}

          {!quoting && quote && !quote.ok && (
            <p role="alert" className="text-clay text-sm">
              {quote.error}
            </p>
          )}
        </div>
      </Section>

      {/* ================= Step 3 — Payment (§6.5) ================= */}
      <Section step={3} title="Payment">
        <fieldset>
          <legend className="sr-only">Payment method</legend>

          <label className="border-jute-deep flex items-start gap-3 rounded-md border-2 p-4">
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              defaultChecked
              className="mt-1 size-4"
            />
            <span className="flex-1">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Banknote className="size-4" aria-hidden="true" />
                Cash on delivery
              </span>
              <span className="text-muted mt-1 block text-sm">
                Pay the courier in cash when your bag arrives. No fee.
              </span>
              {quote?.ok && !quote.codAvailable && quote.codReason && (
                <span role="alert" className="text-clay mt-2 block text-sm">
                  {quote.codReason}
                </span>
              )}
            </span>
          </label>

          {/* §8.2 is unresolved — saying so is better than a dead button. */}
          <div className="border-line mt-3 rounded-md border border-dashed p-4">
            <p className="text-muted text-sm">
              Card, bKash and Nagad are not switched on yet. We are setting up
              the payment gateway — for now, cash on delivery, or{' '}
              <a
                href={`tel:${'+8801730431932'}`}
                className="text-jute-deep underline underline-offset-4"
              >
                call us
              </a>{' '}
              to arrange another way to pay.
            </p>
          </div>
        </fieldset>

        {/* §15.1 — terms acceptance with links */}
        <label className="flex items-start gap-3 pt-2 text-sm">
          <input type="checkbox" name="acceptedTerms" className="mt-0.5 size-4" required />
          <span>
            I accept the{' '}
            <Link href="/policies/terms" className="text-jute-deep underline underline-offset-4">
              terms
            </Link>{' '}
            and{' '}
            <Link href="/policies/refund" className="text-jute-deep underline underline-offset-4">
              refund policy
            </Link>
            .
          </span>
        </label>

        {/* §7.2 — put the amount in the button */}
        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={submitting}
          loadingLabel="Placing order…"
          disabled={!canPlaceOrder}
          className="mt-4"
        >
          {quote?.ok
            ? `Place order — ${quote.totalFormatted}`
            : `Place order — ${subtotalFormatted} + delivery`}
        </Button>

        {/* §6.5 — trust reinforcement in the checkout footer */}
        <p className="text-muted mt-4 flex items-center justify-center gap-2 text-xs">
          <Lock className="size-3.5" aria-hidden="true" />
          Your details are sent over a secure connection.
        </p>
      </Section>
    </form>
  );
}

function Section({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-line border-t pt-8 first:border-t-0 first:pt-0">
      <h2 className="font-display mb-5 flex items-center gap-3 text-md font-semibold">
        <span
          aria-hidden="true"
          className="bg-forest text-paper tabular inline-flex size-7 items-center justify-center rounded-full text-sm"
        >
          {step}
        </span>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  hint,
  error,
  textarea,
  ...props
}: {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  textarea?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const reactId = useId();
  const id = `${name}-${reactId}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const shared = {
    id,
    name,
    // §20 — errors linked to their field, announced via the alert below
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    className: `border w-full rounded-sm px-3 py-2 min-h-11 bg-paper ${
      error ? 'border-clay' : 'border-line-strong'
    }`,
  };

  return (
    <div>
      {/* §20 — a real label; placeholder text is not a label */}
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {props.required && <span className="text-clay"> *</span>}
      </label>

      {textarea ? (
        <textarea {...shared} rows={3} name={name} />
      ) : (
        <input {...shared} {...props} />
      )}

      {hint && (
        <p id={hintId} className="text-muted mt-1.5 text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-clay mt-1.5 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
