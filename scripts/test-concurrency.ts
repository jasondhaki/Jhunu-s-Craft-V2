/**
 * §23.3 edge-case tests — the ones the plan explicitly names.
 *
 *   npx tsx scripts/test-concurrency.ts
 *
 * The headline case is "two customers buy the last item simultaneously".
 * CONTEXT.md D1 committed to a conditional update inside a transaction
 * precisely so this cannot oversell; this is the test that proves it, and it
 * would fail loudly against a read-then-write implementation.
 *
 * Runs against the real database and cleans up after itself.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { decrementStock, InsufficientStockError } from '../src/lib/inventory';
import { createOrder } from '../src/lib/orders';

const connectionString =
  process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const results: { name: string; pass: boolean; detail: string }[] = [];
function check(name: string, pass: boolean, detail = '') {
  results.push({ name, pass, detail });
}

async function main() {
  // --- Fixture: a product with exactly ONE unit in stock -------------------
  const product = await db.product.create({
    data: {
      slug: `__test-race-${Date.now()}`,
      nameEn: 'Test Race Bag',
      shortDescriptionEn: 'Fixture for the concurrency test.',
      descriptionEn: 'Fixture.',
      material: 'JUTE',
      bagType: 'TOTE',
      basePriceBdt: 100_000,
      basePriceUsd: 2_000,
      lengthCm: 30,
      widthCm: 20,
      heightCm: 10,
      weightGrams: 400,
      capacityNoteEn: 'Fixture.',
      materialsDetailEn: 'Fixture.',
      careInstructionsEn: 'Fixture.',
      status: 'ACTIVE',
      publishedAt: new Date(),
      variants: {
        create: {
          sku: `TEST-RACE-${Date.now()}`,
          colorNameEn: 'Natural',
          colorHex: '#C6A971',
          stockQuantity: 1, // ← exactly one
        },
      },
    },
    include: { variants: true },
  });

  const variant = product.variants[0];

  try {
    // === TEST 1: two simultaneous buyers, one unit ========================
    const [a, b] = await Promise.allSettled([
      decrementStock([{ variantId: variant.id, quantity: 1 }], {
        reason: 'SALE',
        note: 'race A',
      }),
      decrementStock([{ variantId: variant.id, quantity: 1 }], {
        reason: 'SALE',
        note: 'race B',
      }),
    ]);

    const fulfilled = [a, b].filter((r) => r.status === 'fulfilled').length;
    const rejected = [a, b].filter((r) => r.status === 'rejected');

    check(
      'Exactly ONE of two simultaneous buyers succeeds',
      fulfilled === 1,
      `${fulfilled} succeeded, ${rejected.length} rejected`,
    );

    check(
      'The loser fails with InsufficientStockError, not a generic crash',
      rejected.every(
        (r) => r.status === 'rejected' && r.reason instanceof InsufficientStockError,
      ),
      rejected.length
        ? String((rejected[0] as PromiseRejectedResult).reason).split('\n')[0]
        : 'n/a',
    );

    const after = await db.variant.findUnique({ where: { id: variant.id } });
    check(
      'Stock lands at exactly 0 — never negative (no overselling)',
      after?.stockQuantity === 0,
      `stock = ${after?.stockQuantity}`,
    );

    const movements = await db.stockMovement.count({ where: { variantId: variant.id } });
    check(
      'Only the winning sale wrote a StockMovement',
      movements === 1,
      `${movements} movement(s)`,
    );

    // === TEST 2: cannot decrement below zero =============================
    let blocked = false;
    try {
      await decrementStock([{ variantId: variant.id, quantity: 1 }], { reason: 'SALE' });
    } catch (e) {
      blocked = e instanceof InsufficientStockError;
    }
    check('Buying from zero stock is refused', blocked);

    // === TEST 3: idempotency — a double-submitted checkout ===============
    await db.variant.update({
      where: { id: variant.id },
      data: { stockQuantity: 5 },
    });

    const address = {
      recipientName: 'Test Buyer',
      phone: '+8801700000000',
      line1: '1 Test Road',
      city: 'Dhaka',
      region: 'Dhaka',
      country: 'BD',
    };
    const key = `test-idem-${Date.now()}`;

    const first = await createOrder({
      email: 'test@example.com',
      phone: '+8801700000000',
      currency: 'BDT',
      lines: [{ variantId: variant.id, quantity: 2 }],
      shippingAddress: address,
      billingAddress: address,
      shippingMethod: 'Test',
      shippingTotal: 6_000,
      paymentMethod: 'COD',
      paymentProvider: 'cod',
      idempotencyKey: key,
    });

    const second = await createOrder({
      email: 'test@example.com',
      phone: '+8801700000000',
      currency: 'BDT',
      lines: [{ variantId: variant.id, quantity: 2 }],
      shippingAddress: address,
      billingAddress: address,
      shippingMethod: 'Test',
      shippingTotal: 6_000,
      paymentMethod: 'COD',
      paymentProvider: 'cod',
      idempotencyKey: key, // same key = same submit
    });

    check(
      'A double-submitted checkout returns the SAME order, not a second one',
      first.id === second.id,
      `${first.orderNumber} vs ${second.orderNumber}`,
    );

    const stockAfterOrder = await db.variant.findUnique({ where: { id: variant.id } });
    check(
      'The duplicate submit did NOT decrement stock twice',
      stockAfterOrder?.stockQuantity === 3,
      `expected 3, got ${stockAfterOrder?.stockQuantity}`,
    );

    // === TEST 4: money is computed server-side, in minor units ===========
    check(
      'Order total = subtotal + shipping, in integer minor units',
      first.subtotal === 200_000 &&
        first.shippingTotal === 6_000 &&
        first.grandTotal === 206_000 &&
        Number.isInteger(first.grandTotal),
      `subtotal ${first.subtotal}, shipping ${first.shippingTotal}, total ${first.grandTotal}`,
    );

    // === TEST 5: line items are snapshots (§5.5) =========================
    await db.product.update({
      where: { id: product.id },
      data: { nameEn: 'RENAMED AFTER THE ORDER', basePriceBdt: 999_999 },
    });

    const reread = await db.order.findUnique({
      where: { id: first.id },
      include: { items: true },
    });

    check(
      'Renaming a product does NOT rewrite a historical order',
      reread?.items[0].productNameSnapshot === 'Test Race Bag',
      `snapshot reads "${reread?.items[0].productNameSnapshot}"`,
    );
    check(
      'Repricing a product does NOT change a historical order total',
      reread?.grandTotal === 206_000,
      `total still ${reread?.grandTotal}`,
    );

    // --- Cleanup ---------------------------------------------------------
    await db.order.deleteMany({ where: { id: first.id } });
    await db.stockMovement.deleteMany({ where: { variantId: variant.id } });
    await db.product.delete({ where: { id: product.id } });
  } catch (error) {
    // Always try to clean up, even on an unexpected failure.
    await db.stockMovement.deleteMany({ where: { variantId: variant.id } }).catch(() => {});
    await db.orderItem.deleteMany({ where: { variantId: variant.id } }).catch(() => {});
    await db.product.delete({ where: { id: product.id } }).catch(() => {});
    throw error;
  }

  console.log('');
  for (const r of results) {
    console.log(
      `${(r.pass ? 'PASS' : '**FAIL**').padEnd(10)} ${r.name}${r.detail ? '  —  ' + r.detail : ''}`,
    );
  }
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exitCode = failed ? 1 : 0;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
