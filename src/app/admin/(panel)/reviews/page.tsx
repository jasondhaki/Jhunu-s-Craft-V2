import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Star } from 'lucide-react';
import { ReviewStatus } from '@prisma/client';
import { requireAdmin, auditLog } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';

/**
 * Review moderation — plan §11.4.
 *
 * "Reviews — moderation queue: approve, reject, reply publicly."
 *
 * §14.3 sets the editorial rule this screen has to serve: publish the critical
 * ones. Rejection is for spam, abuse, and things that are not reviews — not
 * for low ratings. The copy on this page says so, because the person using it
 * will be tempted otherwise and a wall of five stars reads as fake anyway.
 */

export const metadata = { title: 'Reviews' };

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; saved?: string }>;
}) {
  await requireAdmin();
  const { status, saved } = await searchParams;

  const filter =
    status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status.toUpperCase())
      ? (status.toUpperCase() as ReviewStatus)
      : ReviewStatus.PENDING;

  const [reviews, counts] = await Promise.all([
    db.review.findMany({
      where: { status: filter },
      include: { product: { select: { slug: true, nameEn: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.review.groupBy({ by: ['status'], _count: true }),
  ]);

  const countFor = (s: ReviewStatus) =>
    counts.find((c) => c.status === s)?._count ?? 0;

  async function moderate(formData: FormData) {
    'use server';

    // §13.3 — publishing customer-visible content is MANAGER level.
    const admin = await requireAdmin('MANAGER');

    const parsed = z
      .object({
        id: z.string().trim().min(1).max(64),
        action: z.enum(['approve', 'reject', 'reply']),
        reply: z.string().trim().max(2000).optional().or(z.literal('')),
      })
      .safeParse({
        id: formData.get('id'),
        action: formData.get('action'),
        reply: formData.get('reply') ?? '',
      });

    if (!parsed.success) redirect('/admin/reviews');
    const { id, action, reply } = parsed.data;

    const before = await db.review.findUnique({ where: { id } });
    if (!before) redirect('/admin/reviews');

    const data =
      action === 'approve'
        ? { status: ReviewStatus.APPROVED }
        : action === 'reject'
          ? { status: ReviewStatus.REJECTED }
          : { adminReply: reply || null };

    await db.review.update({ where: { id }, data });

    // §13.7 — every admin action recorded with before and after.
    await auditLog({
      adminUserId: admin.id,
      action: `review.${action}`,
      entityType: 'Review',
      entityId: id,
      before: { status: before.status, adminReply: before.adminReply },
      after: data,
    });

    // An approved review changes the product page and the aggregate rating.
    const product = await db.product.findUnique({
      where: { id: before.productId },
      select: { slug: true },
    });
    if (product) revalidatePath(`/product/${product.slug}`);
    revalidatePath('/reviews');
    revalidatePath('/admin/reviews');
    revalidatePath('/admin');

    redirect(`/admin/reviews?status=${filter}&saved=1`);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-xl font-semibold">Reviews</h1>
      </div>

      {saved && (
        <p role="status" className="border-leaf text-leaf mb-6 rounded-sm border px-3 py-2 text-sm">
          Saved.
        </p>
      )}

      {/* §14.3, stated where the decision is made. */}
      <p className="border-jute mb-6 rounded-md border p-4 text-sm">
        <strong>Publish the critical ones.</strong> A well-handled three-star
        review builds more trust than a wall of five-star ones, and a page of
        nothing but praise reads as fake. Reject only spam, abuse, and things
        that are not reviews.
      </p>

      <nav aria-label="Filter by status" className="mb-6 flex flex-wrap gap-2">
        {(
          [
            [ReviewStatus.PENDING, 'Waiting'],
            [ReviewStatus.APPROVED, 'Published'],
            [ReviewStatus.REJECTED, 'Rejected'],
          ] as const
        ).map(([value, label]) => (
          <Link
            key={value}
            href={`/admin/reviews?status=${value}`}
            aria-current={filter === value ? 'page' : undefined}
            className={
              filter === value
                ? 'bg-forest text-paper inline-flex min-h-11 items-center rounded-md px-4 text-sm'
                : 'border-line-strong hover:bg-paper-sunk inline-flex min-h-11 items-center rounded-md border px-4 text-sm'
            }
          >
            {label} ({countFor(value)})
          </Link>
        ))}
      </nav>

      {reviews.length === 0 ? (
        <p className="border-line text-muted rounded-md border border-dashed px-4 py-8 text-center text-sm">
          {filter === ReviewStatus.PENDING
            ? 'Nothing waiting. Reviews appear here after a delivered order.'
            : 'Nothing here.'}
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="border-line rounded-md border p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="inline-flex items-center gap-0.5"
                  role="img"
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      aria-hidden="true"
                      className={
                        n <= review.rating
                          ? 'fill-jute text-jute size-4'
                          : 'text-line-strong size-4'
                      }
                    />
                  ))}
                </span>
                {review.verifiedPurchase && (
                  <span className="bg-leaf rounded-full px-2 py-0.5 text-xs text-white">
                    Verified purchase
                  </span>
                )}
                <span className="text-muted text-xs">
                  {review.createdAt.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {review.title && <p className="mt-2 font-medium">{review.title}</p>}
              <p className="text-forest-soft mt-1 text-sm">{review.body}</p>
              <p className="text-muted mt-2 text-sm">
                {review.authorName} on{' '}
                <Link
                  href={`/product/${review.product.slug}`}
                  target="_blank"
                  className="text-jute-deep underline underline-offset-4"
                >
                  {review.product.nameEn}
                </Link>
              </p>

              {review.adminReply && (
                <div className="border-jute mt-3 border-l-2 pl-3">
                  <p className="text-muted text-xs font-medium">Your reply</p>
                  <p className="text-forest-soft mt-1 text-sm">{review.adminReply}</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {review.status !== ReviewStatus.APPROVED && (
                  <form action={moderate}>
                    <input type="hidden" name="id" value={review.id} />
                    <input type="hidden" name="action" value="approve" />
                    <Button type="submit" size="sm">
                      Publish
                    </Button>
                  </form>
                )}
                {review.status !== ReviewStatus.REJECTED && (
                  <form action={moderate}>
                    <input type="hidden" name="id" value={review.id} />
                    <input type="hidden" name="action" value="reject" />
                    <Button type="submit" size="sm" variant="destructive">
                      Reject
                    </Button>
                  </form>
                )}
              </div>

              {/* §14.3 — replying publicly, especially to criticism. */}
              <details className="mt-4">
                <summary className="text-jute-deep min-h-11 cursor-pointer text-sm underline underline-offset-4">
                  {review.adminReply ? 'Edit your reply' : 'Reply publicly'}
                </summary>
                <form action={moderate} className="mt-3 space-y-2">
                  <input type="hidden" name="id" value={review.id} />
                  <input type="hidden" name="action" value="reply" />
                  <label htmlFor={`reply-${review.id}`} className="sr-only">
                    Public reply to {review.authorName}
                  </label>
                  <textarea
                    id={`reply-${review.id}`}
                    name="reply"
                    rows={3}
                    defaultValue={review.adminReply ?? ''}
                    className="border-line-strong bg-paper w-full rounded-sm border px-3 py-2 text-sm"
                  />
                  <Button type="submit" size="sm" variant="secondary">
                    Save reply
                  </Button>
                </form>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
