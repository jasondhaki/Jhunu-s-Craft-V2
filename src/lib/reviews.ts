import 'server-only';

import { OrderStatus, ReviewStatus } from '@prisma/client';
import { db } from '@/lib/db';

/**
 * Reviews — plan §6.3.14, §14.3.
 *
 * §6.3.14: "a 'Write a review' entry point (VERIFIED PURCHASERS ONLY)."
 * §14.3: "Verified-purchase reviews with a badge... Don't fake reviews."
 *
 * The verification is structural rather than a checkbox: a review can only be
 * created against an order that (a) actually contains the product, and (b) has
 * been delivered. There is no code path that produces a `verifiedPurchase`
 * review without both being true, which is what makes the badge mean anything.
 *
 * Reviews arrive PENDING and are published by a human (§11.4 moderation
 * queue). That is not censorship — §14.3 requires critical reviews to be
 * published too — it is spam control.
 */

export interface ReviewableProduct {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  alreadyReviewed: boolean;
}

/**
 * Which products in an order the customer may review.
 *
 * Returns nothing unless the order is DELIVERED: reviewing a bag you have not
 * received yet is not a verified purchase in any useful sense.
 */
export async function reviewableProductsForOrder(
  orderId: string,
): Promise<ReviewableProduct[]> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              nameEn: true,
              images: { orderBy: { position: 'asc' }, take: 1 },
            },
          },
        },
      },
      reviews: { select: { productId: true } },
    },
  });

  if (!order) return [];
  if (order.status !== OrderStatus.DELIVERED) return [];

  const reviewed = new Set(order.reviews.map((r) => r.productId));
  const seen = new Set<string>();
  const result: ReviewableProduct[] = [];

  for (const item of order.items) {
    // Snapshot-only lines (product since deleted) cannot be reviewed —
    // there is nothing left to attach the review to.
    if (!item.product) continue;
    if (seen.has(item.product.id)) continue;
    seen.add(item.product.id);

    result.push({
      productId: item.product.id,
      slug: item.product.slug,
      name: item.product.nameEn,
      imageUrl: item.product.images[0]?.url ?? null,
      alreadyReviewed: reviewed.has(item.product.id),
    });
  }

  return result;
}

export class ReviewNotPermittedError extends Error {}

/**
 * Creates a review, verifying eligibility inside the same call.
 *
 * The caller passes the order id it already proved access to (via session
 * ownership or the guest token), and this re-checks that the order really
 * contains the product and really was delivered. Neither check is left to the
 * caller (§13.3 — the UI hiding a form is not a permission check).
 */
export async function createReview(params: {
  orderId: string;
  productId: string;
  rating: number;
  title?: string | null;
  body: string;
  authorName: string;
}): Promise<void> {
  if (!Number.isInteger(params.rating) || params.rating < 1 || params.rating > 5) {
    throw new ReviewNotPermittedError('A rating must be between 1 and 5 stars.');
  }

  const order = await db.order.findUnique({
    where: { id: params.orderId },
    include: { items: { select: { productId: true } } },
  });

  if (!order) {
    throw new ReviewNotPermittedError('We could not find that order.');
  }
  if (order.status !== OrderStatus.DELIVERED) {
    throw new ReviewNotPermittedError(
      'You can leave a review once your order has been delivered.',
    );
  }
  if (!order.items.some((item) => item.productId === params.productId)) {
    throw new ReviewNotPermittedError('That bag was not part of this order.');
  }

  // One review per product per order. `createMany` with skipDuplicates would
  // hide the double-submit rather than report it, and the customer should be
  // told their review is already in.
  const existing = await db.review.findFirst({
    where: { orderId: params.orderId, productId: params.productId },
  });
  if (existing) {
    throw new ReviewNotPermittedError(
      'You have already reviewed this bag from this order. Thank you.',
    );
  }

  await db.review.create({
    data: {
      productId: params.productId,
      orderId: params.orderId,
      customerId: order.customerId,
      authorName: params.authorName.trim().slice(0, 120),
      rating: params.rating,
      title: params.title?.trim() || null,
      body: params.body.trim(),
      // Every path into this function has verified the order contains the
      // product and was delivered, so the badge is earned.
      verifiedPurchase: true,
      status: ReviewStatus.PENDING,
    },
  });
}

/** Approved reviews for a product, newest first. */
export async function getProductReviews(productId: string) {
  return db.review.findMany({
    where: { productId, status: ReviewStatus.APPROVED },
    orderBy: { createdAt: 'desc' },
  });
}

export interface RatingSummary {
  count: number;
  average: number;
  /** How many reviews gave each star rating, for the distribution bars. */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

/**
 * Aggregate rating for a product.
 *
 * Returns null when there are no approved reviews, and callers must treat
 * that as "show nothing" rather than "show zero stars". §14.3 forbids
 * inventing social proof, and an empty five-star row reads as exactly that —
 * it is also a Google structured-data violation to emit an aggregateRating
 * with no reviews behind it.
 */
export async function getRatingSummary(
  productId: string,
): Promise<RatingSummary | null> {
  const rows = await db.review.groupBy({
    by: ['rating'],
    where: { productId, status: ReviewStatus.APPROVED },
    _count: { rating: true },
  });

  const count = rows.reduce((n, r) => n + r._count.rating, 0);
  if (count === 0) return null;

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as RatingSummary['distribution'];
  let total = 0;

  for (const row of rows) {
    const star = row.rating as 1 | 2 | 3 | 4 | 5;
    distribution[star] = row._count.rating;
    total += row.rating * row._count.rating;
  }

  return { count, average: total / count, distribution };
}
