import type { Metadata } from 'next';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { ProsePage, P } from '@/components/prose-page';
import { buttonClasses } from '@/components/ui/button';
import { db } from '@/lib/db';

/**
 * All reviews — plan §14.3.
 *
 * §14.3 is unambiguous: "Don't fake reviews. Beyond being unethical and
 * illegal in many markets, they read as fake and destroy the credibility of
 * the real ones." §28 repeats it.
 *
 * So this page ships EMPTY, and says so. Only APPROVED reviews are ever
 * shown, and the "verified purchase" badge is only set when the review is
 * genuinely tied to a delivered order containing that product — it is not a
 * decoration we can apply at will.
 */

export const metadata: Metadata = {
  title: 'Reviews',
  description:
    'What customers say about their bags. Every review here is from a real, verified order.',
  alternates: { canonical: '/reviews' },
};

export default async function ReviewsPage() {
  const reviews = await db.review.findMany({
    where: { status: 'APPROVED' },
    include: { product: { select: { slug: true, nameEn: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <ProsePage
      title="Reviews"
      intro={
        reviews.length > 0
          ? `${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'} from real orders.`
          : undefined
      }
      crumbs={[{ label: 'Reviews' }]}
    >
      {reviews.length === 0 ? (
        <div className="border-line rounded-md border border-dashed px-5 py-10 text-center">
          <p className="font-display text-md font-semibold">
            No reviews yet
          </p>
          <p className="text-forest-soft mx-auto mt-3 max-w-md text-sm">
            The shop is new, so nobody has left one. We could fill this page
            with invented praise and nobody would immediately know — but you
            would eventually, and it would make every real review here
            worthless.
          </p>
          <p className="text-muted mx-auto mt-3 max-w-md text-sm">
            When customers do write, only reviews tied to a genuine delivered
            order appear here, and we will publish the critical ones too.
          </p>
          <Link href="/shop" className={`${buttonClasses('primary', 'md')} mt-6`}>
            See the bags
          </Link>
        </div>
      ) : (
        <>
          <div className="border-line flex items-center gap-4 rounded-md border p-5">
            <span className="font-display tabular text-2xl font-semibold">
              {average.toFixed(1)}
            </span>
            <span>
              <Stars rating={Math.round(average)} />
              <span className="text-muted block text-sm">
                from {reviews.length} verified{' '}
                {reviews.length === 1 ? 'order' : 'orders'}
              </span>
            </span>
          </div>

          <ul className="space-y-6">
            {reviews.map((review) => (
              <li key={review.id} className="border-line border-b pb-6">
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
                  <h2 className="mt-2 font-medium">{review.title}</h2>
                )}
                <p className="text-forest-soft mt-1 leading-relaxed">
                  {review.body}
                </p>

                <p className="text-muted mt-2 text-sm">
                  {review.authorName} on{' '}
                  <Link
                    href={`/product/${review.product.slug}`}
                    className="text-jute-deep underline underline-offset-4"
                  >
                    {review.product.nameEn}
                  </Link>
                </p>

                {/* §14.3 — "Publicly reply to reviews, especially negative
                    ones. A well-handled 3-star review builds more trust than
                    a wall of 5-stars." */}
                {review.adminReply && (
                  <div className="border-jute mt-3 border-l-2 pl-4">
                    <p className="text-muted text-xs font-medium">
                      Our reply
                    </p>
                    <p className="text-forest-soft mt-1 text-sm">
                      {review.adminReply}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <P>
        Bought something? We will email you a few days after it arrives so you
        can say what you actually think. Only people who have received an order
        can review it.
      </P>
    </ProsePage>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      // §20 — the rating must be readable, not inferred from icon shapes.
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={
            n <= rating
              ? 'fill-jute text-jute size-4'
              : 'text-line size-4'
          }
        />
      ))}
    </span>
  );
}
