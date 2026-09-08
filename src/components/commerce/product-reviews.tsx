import { Star } from 'lucide-react';
import type { Review } from '@prisma/client';
import type { RatingSummary } from '@/lib/reviews';

/**
 * Product reviews section — plan §6.3.14.
 *
 * "Average rating, distribution bars, individual reviews with photos,
 * sorting, and a 'Write a review' entry point (verified purchasers only)."
 *
 * Renders NOTHING when there are no approved reviews. §14.3 forbids inventing
 * social proof, and an empty "0 reviews, ☆☆☆☆☆" block reads as exactly that —
 * worse than the section simply not being there yet.
 *
 * The write-a-review entry point is deliberately not here: it lives on the
 * customer's own order page, because only a verified purchaser may write one
 * and that is where we know who they are.
 */

export function Stars({
  rating,
  size = 'sm',
}: {
  rating: number;
  size?: 'sm' | 'md';
}) {
  const cls = size === 'md' ? 'size-5' : 'size-4';
  return (
    <span
      className="inline-flex items-center gap-0.5"
      // §20 — the value must be readable, not inferred from icon shapes.
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={
            n <= Math.round(rating)
              ? `fill-jute text-jute ${cls}`
              : `text-line-strong ${cls}`
          }
        />
      ))}
    </span>
  );
}

export function ProductReviews({
  summary,
  reviews,
}: {
  summary: RatingSummary | null;
  reviews: Review[];
}) {
  if (!summary || reviews.length === 0) return null;

  return (
    <section id="reviews" className="mt-20 scroll-mt-24">
      <h2 className="font-display text-lg font-semibold md:text-xl">
        Reviews
      </h2>

      <div className="mt-6 grid gap-8 md:grid-cols-[220px_1fr] md:gap-12">
        {/* Average + distribution */}
        <div>
          <p className="flex items-baseline gap-2">
            <span className="font-display tabular text-2xl font-semibold">
              {summary.average.toFixed(1)}
            </span>
            <span className="text-muted text-sm">out of 5</span>
          </p>
          <Stars rating={summary.average} size="md" />
          <p className="text-muted mt-1 text-sm">
            {summary.count} verified {summary.count === 1 ? 'review' : 'reviews'}
          </p>

          <ul className="mt-4 space-y-1.5">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const n = summary.distribution[star];
              const pct = summary.count > 0 ? (n / summary.count) * 100 : 0;
              return (
                <li key={star} className="flex items-center gap-2 text-xs">
                  <span className="tabular text-muted w-8">{star}★</span>
                  <span
                    className="bg-paper-sunk h-1.5 flex-1 overflow-hidden rounded-full"
                    role="img"
                    aria-label={`${n} of ${summary.count} reviews gave ${star} stars`}
                  >
                    <span
                      className="bg-jute block h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="tabular text-muted w-6 text-right">{n}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Individual reviews */}
        <ul className="space-y-6">
          {reviews.map((review) => (
            <li key={review.id} className="border-line border-b pb-6 last:border-0">
              <div className="flex flex-wrap items-center gap-3">
                <Stars rating={review.rating} />
                {review.verifiedPurchase && (
                  <span className="bg-leaf rounded-full px-2 py-0.5 text-xs text-white">
                    Verified purchase
                  </span>
                )}
                <span className="text-muted text-xs">
                  {review.createdAt.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {review.title && (
                <h3 className="mt-2 font-medium">{review.title}</h3>
              )}
              <p className="text-forest-soft mt-1 leading-relaxed">{review.body}</p>
              <p className="text-muted mt-2 text-sm">{review.authorName}</p>

              {/* §14.3 — replying publicly, especially to criticism, builds
                  more trust than a wall of five-star reviews. */}
              {review.adminReply && (
                <div className="border-jute mt-3 border-l-2 pl-4">
                  <p className="text-muted text-xs font-medium">Our reply</p>
                  <p className="text-forest-soft mt-1 text-sm">{review.adminReply}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
