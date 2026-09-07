import 'server-only';

import type { StockReason } from '@prisma/client';
import { db } from '@/lib/db';

/**
 * Inventory — plan §5.6, §23.3, and CONTEXT.md D1.
 *
 * THE RULE: stock is never read-then-written. Every decrement is a single
 * conditional UPDATE inside a transaction:
 *
 *     UPDATE variants SET stock = stock - n WHERE id = ? AND stock >= n
 *
 * If two requests race for the last bag, the second one matches zero rows and
 * fails cleanly. Reading the count and then writing `count - 1` would let both
 * succeed and oversell — §23.3 lists "two customers buy the last item
 * simultaneously" as a required test, and this is the code it tests.
 *
 * Every movement also writes a StockMovement row, so the stock level is always
 * reconstructable and a mismatch against physical stock can be traced.
 */

export class InsufficientStockError extends Error {
  constructor(
    readonly variantId: string,
    readonly requested: number,
    readonly available: number,
  ) {
    super(
      `Insufficient stock for variant ${variantId}: requested ${requested}, available ${available}`,
    );
    this.name = 'InsufficientStockError';
  }
}

export interface StockLine {
  variantId: string;
  quantity: number;
}

/**
 * Decrements stock for a set of lines atomically. Either every line succeeds
 * or the whole transaction rolls back — a half-decremented order would be
 * worse than a rejected one.
 *
 * Call this at ORDER CREATION, not when an item is added to the cart. §6.4:
 * "Stock is re-validated at checkout, not just at add-time."
 */
export async function decrementStock(
  lines: StockLine[],
  context: { reason: StockReason; orderId?: string; createdBy?: string; note?: string },
): Promise<void> {
  if (lines.length === 0) return;

  await db.$transaction(async (tx) => {
    for (const line of lines) {
      if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
        throw new Error(`Invalid quantity ${line.quantity} for variant ${line.variantId}`);
      }

      // The conditional update. `updateMany` returns a count rather than
      // throwing, which is exactly what lets us detect the race.
      const result = await tx.variant.updateMany({
        where: {
          id: line.variantId,
          isActive: true,
          stockQuantity: { gte: line.quantity },
        },
        data: { stockQuantity: { decrement: line.quantity } },
      });

      if (result.count === 0) {
        // Either the variant is gone, inactive, or someone else took the
        // stock between the cart page and here. Read the current value only
        // to build a useful message — the decision has already been made.
        const current = await tx.variant.findUnique({
          where: { id: line.variantId },
          select: { stockQuantity: true },
        });
        throw new InsufficientStockError(
          line.variantId,
          line.quantity,
          current?.stockQuantity ?? 0,
        );
      }

      await tx.stockMovement.create({
        data: {
          variantId: line.variantId,
          delta: -line.quantity,
          reason: context.reason,
          orderId: context.orderId ?? null,
          createdBy: context.createdBy ?? null,
          note: context.note ?? null,
        },
      });
    }
  });
}

/**
 * Returns stock — a cancellation, a return, or a restock. Unconditional,
 * because adding stock back can never fail a constraint.
 */
export async function incrementStock(
  lines: StockLine[],
  context: { reason: StockReason; orderId?: string; createdBy?: string; note?: string },
): Promise<void> {
  if (lines.length === 0) return;

  await db.$transaction(async (tx) => {
    for (const line of lines) {
      await tx.variant.update({
        where: { id: line.variantId },
        data: { stockQuantity: { increment: line.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          variantId: line.variantId,
          delta: line.quantity,
          reason: context.reason,
          orderId: context.orderId ?? null,
          createdBy: context.createdBy ?? null,
          note: context.note ?? null,
        },
      });
    }
  });
}

/**
 * Sets an absolute stock level — what the admin inventory screen does when he
 * counts what is physically on the shelf.
 *
 * Recorded as a delta so the movement history stays continuous, and tagged
 * ADJUSTMENT rather than RESTOCK so a stock count is distinguishable from
 * new production in the reports (§11.4).
 */
export async function setStockLevel(
  variantId: string,
  newQuantity: number,
  context: { createdBy: string; note?: string },
): Promise<{ previous: number; next: number }> {
  if (!Number.isInteger(newQuantity) || newQuantity < 0) {
    throw new Error(`Stock level must be a non-negative integer, got ${newQuantity}`);
  }

  return db.$transaction(async (tx) => {
    const variant = await tx.variant.findUnique({
      where: { id: variantId },
      select: { stockQuantity: true },
    });
    if (!variant) throw new Error(`Variant ${variantId} not found`);

    const delta = newQuantity - variant.stockQuantity;
    if (delta === 0) return { previous: variant.stockQuantity, next: newQuantity };

    await tx.variant.update({
      where: { id: variantId },
      data: { stockQuantity: newQuantity },
    });

    await tx.stockMovement.create({
      data: {
        variantId,
        delta,
        reason: 'ADJUSTMENT',
        createdBy: context.createdBy,
        note: context.note ?? 'Manual stock count',
      },
    });

    return { previous: variant.stockQuantity, next: newQuantity };
  });
}

/**
 * Re-checks availability without changing anything — used to warn the
 * customer at the cart and checkout steps before they commit (§7.3's "Only 1
 * left in stock. We've updated your cart.").
 *
 * This is advisory ONLY. It is not a reservation, and the authoritative check
 * is the conditional update in decrementStock.
 */
export async function checkAvailability(
  lines: StockLine[],
): Promise<{ variantId: string; requested: number; available: number }[]> {
  if (lines.length === 0) return [];

  const variants = await db.variant.findMany({
    where: { id: { in: lines.map((l) => l.variantId) } },
    select: { id: true, stockQuantity: true, product: { select: { madeToOrder: true } } },
  });

  const problems: { variantId: string; requested: number; available: number }[] = [];

  for (const line of lines) {
    const variant = variants.find((v) => v.id === line.variantId);
    if (!variant) {
      problems.push({ variantId: line.variantId, requested: line.quantity, available: 0 });
      continue;
    }
    // Made-to-order items are built on demand and are never stock-limited.
    if (variant.product.madeToOrder) continue;
    if (variant.stockQuantity < line.quantity) {
      problems.push({
        variantId: line.variantId,
        requested: line.quantity,
        available: variant.stockQuantity,
      });
    }
  }

  return problems;
}
