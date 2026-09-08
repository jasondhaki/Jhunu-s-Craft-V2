/**
 * Review eligibility — plan §6.3.14, §14.3, §13.3.
 *
 *   npm run test:reviews
 *
 * The "verified purchase" badge is only worth anything if it cannot be
 * obtained without a verified purchase, so these tests try to get one without
 * a delivered order, without the product being in the order, and twice for
 * the same order. All should fail.
 */

import 'dotenv/config';
import { PrismaClient, OrderStatus, ReviewStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  createReview,
  reviewableProductsForOrder,
  getRatingSummary,
  getProductReviews,
  ReviewNotPermittedError,
} from '../src/lib/reviews';

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL!,
  }),
});

const results: [string, boolean, string][] = [];
const check = (name: string, pass: boolean, detail = '') =>
  results.push([name, pass, detail]);

const stamp = Date.now();

async function expectRefused(
  label: string,
  fn: () => Promise<unknown>,
): Promise<void> {
  try {
    await fn();
    check(label, false, '!!! ALLOWED — should have been refused');
  } catch (error) {
    check(
      label,
      error instanceof ReviewNotPermittedError,
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function main() {
  // --- Fixtures -----------------------------------------------------------
  const product = await db.product.create({
    data: {
      slug: `__test-review-${stamp}`,
      nameEn: 'Test Review Bag',
      shortDescriptionEn: 'Fixture.',
      descriptionEn: 'Fixture.',
      material: 'JUTE',
      bagType: 'TOTE',
      basePriceBdt: 100_000,
      basePriceUsd: 2_000,
      lengthCm: 30, widthCm: 20, heightCm: 10, weightGrams: 400,
      capacityNoteEn: 'Fixture.',
      materialsDetailEn: 'Fixture.',
      careInstructionsEn: 'Fixture.',
      status: 'ACTIVE',
      publishedAt: new Date(),
    },
  });

  const otherProduct = await db.product.create({
    data: {
      slug: `__test-review-other-${stamp}`,
      nameEn: 'Test Other Bag',
      shortDescriptionEn: 'Fixture.',
      descriptionEn: 'Fixture.',
      material: 'JUTE',
      bagType: 'TOTE',
      basePriceBdt: 100_000,
      basePriceUsd: 2_000,
      lengthCm: 30, widthCm: 20, heightCm: 10, weightGrams: 400,
      capacityNoteEn: 'Fixture.',
      materialsDetailEn: 'Fixture.',
      careInstructionsEn: 'Fixture.',
      status: 'ACTIVE',
      publishedAt: new Date(),
    },
  });

  const address = {
    recipientName: 'Test', phone: '+8801700000000',
    line1: '1 Test Road', city: 'Dhaka', region: 'Dhaka', country: 'BD',
  };

  const baseOrder = {
    email: 'test@example.invalid',
    phone: '+8801700000000',
    paymentMethod: 'COD' as const,
    currency: 'BDT' as const,
    subtotal: 100_000,
    grandTotal: 106_000,
    shippingTotal: 6_000,
    shippingAddress: address,
    billingAddress: address,
    shippingMethod: 'Test',
  };

  const item = {
    productNameSnapshot: 'Test Review Bag',
    skuSnapshot: `TEST-REV-${stamp}`,
    variantLabelSnapshot: 'Natural',
    unitPrice: 100_000,
    quantity: 1,
    lineTotal: 100_000,
  };

  // An order that has NOT been delivered.
  const pendingOrder = await db.order.create({
    data: {
      ...baseOrder,
      orderNumber: `TEST-REV-P-${stamp}`,
      publicToken: `tok-rev-p-${stamp}`,
      status: OrderStatus.PENDING,
      items: { create: { ...item, productId: product.id } },
    },
  });

  // A delivered order containing the product.
  const deliveredOrder = await db.order.create({
    data: {
      ...baseOrder,
      orderNumber: `TEST-REV-D-${stamp}`,
      publicToken: `tok-rev-d-${stamp}`,
      status: OrderStatus.DELIVERED,
      items: { create: { ...item, productId: product.id } },
    },
  });

  try {
    // === Eligibility ======================================================
    const nothingYet = await reviewableProductsForOrder(pendingOrder.id);
    check(
      'An undelivered order offers nothing to review',
      nothingYet.length === 0,
      `${nothingYet.length} reviewable`,
    );

    const canReview = await reviewableProductsForOrder(deliveredOrder.id);
    check(
      'A delivered order offers its products for review',
      canReview.length === 1 && canReview[0].productId === product.id,
      `${canReview.length} reviewable`,
    );

    // === The attacks ======================================================
    await expectRefused('Cannot review before delivery', () =>
      createReview({
        orderId: pendingOrder.id,
        productId: product.id,
        rating: 5,
        body: 'Trying to review a bag I have not received.',
        authorName: 'Impatient',
      }),
    );

    await expectRefused('Cannot review a product that was not in the order', () =>
      createReview({
        orderId: deliveredOrder.id,
        productId: otherProduct.id,
        rating: 5,
        body: 'Reviewing something I never bought.',
        authorName: 'Chancer',
      }),
    );

    await expectRefused('Cannot review against a nonexistent order', () =>
      createReview({
        orderId: 'no-such-order-id',
        productId: product.id,
        rating: 5,
        body: 'Reviewing with a made-up order id.',
        authorName: 'Ghost',
      }),
    );

    await expectRefused('A rating outside 1–5 is refused', () =>
      createReview({
        orderId: deliveredOrder.id,
        productId: product.id,
        rating: 6,
        body: 'Six stars please.',
        authorName: 'Optimist',
      }),
    );

    // === The legitimate path ==============================================
    await createReview({
      orderId: deliveredOrder.id,
      productId: product.id,
      rating: 4,
      title: 'Holds up well',
      body: 'Carried it daily for a month. The stitching has not moved.',
      authorName: 'Real Buyer',
    });

    const created = await db.review.findFirst({
      where: { orderId: deliveredOrder.id, productId: product.id },
    });
    check('A delivered purchaser CAN review', created !== null);
    check(
      'The review is marked as a verified purchase',
      created?.verifiedPurchase === true,
    );
    check(
      'It arrives PENDING, not published (§11.4 moderation)',
      created?.status === ReviewStatus.PENDING,
      created?.status ?? '',
    );

    await expectRefused('Cannot review the same product twice from one order', () =>
      createReview({
        orderId: deliveredOrder.id,
        productId: product.id,
        rating: 1,
        body: 'Second review from the same order.',
        authorName: 'Double Dipper',
      }),
    );

    // === Aggregation ======================================================
    const beforeApproval = await getRatingSummary(product.id);
    check(
      'A pending review does NOT count toward the public rating',
      beforeApproval === null,
      beforeApproval === null ? 'no rating shown' : '!!! LEAKED',
    );

    const publicBefore = await getProductReviews(product.id);
    check('A pending review is not publicly visible', publicBefore.length === 0);

    await db.review.update({
      where: { id: created!.id },
      data: { status: ReviewStatus.APPROVED },
    });

    const afterApproval = await getRatingSummary(product.id);
    check(
      'Once approved it counts',
      afterApproval?.count === 1 && afterApproval.average === 4,
      `count ${afterApproval?.count}, average ${afterApproval?.average}`,
    );
    check(
      'The distribution is right',
      afterApproval?.distribution[4] === 1 && afterApproval?.distribution[5] === 0,
    );

    const noReviews = await getRatingSummary(otherProduct.id);
    check(
      'A product with no reviews returns null, not a zero rating (§14.3)',
      noReviews === null,
      'so no empty star row and no aggregateRating is emitted',
    );

    const reviewedAgain = await reviewableProductsForOrder(deliveredOrder.id);
    check(
      'An already-reviewed product is flagged as such',
      reviewedAgain[0]?.alreadyReviewed === true,
    );
  } finally {
    await db.review.deleteMany({
      where: { orderId: { in: [pendingOrder.id, deliveredOrder.id] } },
    });
    await db.order.deleteMany({
      where: { id: { in: [pendingOrder.id, deliveredOrder.id] } },
    });
    await db.product.deleteMany({
      where: { id: { in: [product.id, otherProduct.id] } },
    });
  }

  console.log('');
  for (const [name, pass, detail] of results) {
    console.log(
      `${(pass ? 'PASS' : '**FAIL**').padEnd(10)} ${name}${detail ? '  —  ' + detail : ''}`,
    );
  }
  const failed = results.filter((r) => !r[1]).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exitCode = failed ? 1 : 0;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
