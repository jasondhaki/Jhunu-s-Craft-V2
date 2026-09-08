'use client';

import { useId, useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitReviewAction } from '@/app/(storefront)/review/actions';

/**
 * Review form — plan §6.3.14, §14.3, §20.
 *
 * The star input is a real radio group, not a row of clickable icons. That
 * makes it keyboard-operable with arrow keys, announced correctly as "3 of 5
 * stars", and submittable without JavaScript — none of which a div-with-onClick
 * gives you (§20).
 *
 * §14.5: there is no nudge toward a high rating anywhere here. The prompt asks
 * what the customer actually thinks, and the copy says a critical review is
 * welcome, because §14.3 is explicit that a well-handled 3-star review builds
 * more trust than a wall of 5s.
 */

interface Props {
  orderId: string;
  productId: string;
  productName: string;
  defaultAuthorName?: string;
  /**
   * The order's public token, on the guest-tracking path. A signed-in
   * customer does not need it — the action proves ownership from the session
   * instead. Either way the proof is checked server-side (§13.3).
   */
  guestToken?: string;
}

export function ReviewForm({
  orderId,
  productId,
  productName,
  defaultAuthorName,
  guestToken,
}: Props) {
  const uid = useId();
  const [rating, setRating] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setError(null);
    setPending(true);
    const result = await submitReviewAction(new FormData(event.currentTarget));
    setPending(false);

    if (result.ok) setDone(true);
    else setError(result.error);
  }

  if (done) {
    return (
      <div role="status" className="border-leaf rounded-md border px-4 py-4">
        <p className="text-sm font-medium">Thank you — your review is in.</p>
        <p className="text-muted mt-1 text-sm">
          We read every one before publishing, so it may take a day or two to
          appear. We publish the critical ones too.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="productId" value={productId} />
      {guestToken && <input type="hidden" name="token" value={guestToken} />}

      {error && (
        <p role="alert" className="border-clay text-clay rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {/* A real radio group — keyboard-operable and announced properly (§20) */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">
          Your rating for {productName}
        </legend>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className="tap-target inline-flex cursor-pointer items-center justify-center rounded-full"
            >
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                required
                className="sr-only"
              />
              <Star
                aria-hidden="true"
                className={
                  value <= rating
                    ? 'fill-jute text-jute size-7'
                    : 'text-line-strong size-7'
                }
              />
              <span className="sr-only">
                {value} {value === 1 ? 'star' : 'stars'}
              </span>
            </label>
          ))}
          {rating > 0 && (
            <span className="text-muted ml-2 text-sm" aria-live="polite">
              {rating} of 5
            </span>
          )}
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${uid}-name`} className="mb-1.5 block text-sm font-medium">
          Your name, as it should appear
        </label>
        <input
          id={`${uid}-name`}
          name="authorName"
          required
          defaultValue={defaultAuthorName}
          maxLength={120}
          className="border-line-strong bg-paper min-h-11 w-full rounded-sm border px-3"
        />
      </div>

      <div>
        <label htmlFor={`${uid}-title`} className="mb-1.5 block text-sm font-medium">
          Headline (optional)
        </label>
        <input
          id={`${uid}-title`}
          name="title"
          maxLength={120}
          className="border-line-strong bg-paper min-h-11 w-full rounded-sm border px-3"
        />
      </div>

      <div>
        <label htmlFor={`${uid}-body`} className="mb-1.5 block text-sm font-medium">
          What did you think?
        </label>
        <textarea
          id={`${uid}-body`}
          name="body"
          rows={5}
          required
          minLength={10}
          maxLength={3000}
          aria-describedby={`${uid}-body-hint`}
          className="border-line-strong bg-paper w-full rounded-sm border px-3 py-2"
        />
        <p id={`${uid}-body-hint`} className="text-muted mt-1.5 text-xs">
          What you use it for and how it has held up is more useful to the next
          person than whether you liked it. If something disappointed you, say
          so — we publish those too.
        </p>
      </div>

      <Button type="submit" loading={pending} loadingLabel="Sending…">
        Submit review
      </Button>
    </form>
  );
}
