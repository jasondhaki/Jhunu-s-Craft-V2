import 'server-only';

import { randomBytes } from 'node:crypto';
import { OrderStatus, PaymentStatus, PaymentMethod, Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { decrementStock, incrementStock, InsufficientStockError } from '@/lib/inventory';
import { addMoney, multiplyMoney, type Currency, type Minor } from '@/lib/money';

/**
 * Orders — plan §5.4, §5.5, §9.4.
 *
 * Two things live here and nowhere else:
 *
 *  1. THE STATE MACHINE (§9.4). Every status transition goes through
 *     `transitionOrder`. CONTEXT.md D1 committed to this explicitly, because
 *     the alternative — status strings assigned ad hoc across route handlers —
 *     is how orders end up shipped-but-unconfirmed or refunded twice.
 *
 *  2. ORDER CREATION. Snapshotting (§5.5), idempotency (§8.3), and the
 *     transactional stock decrement (§23.3) all have to happen together or
 *     not at all.
 */

// ---------------------------------------------------------------------------
// State machine (§9.4)
// ---------------------------------------------------------------------------

/**
 * pending → confirmed → in_production → packed → shipped → delivered
 *                    ↘ cancelled
 *    delivered → return_requested → returned → refunded
 */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [
    OrderStatus.IN_PRODUCTION,
    OrderStatus.PACKED,
    OrderStatus.CANCELLED,
  ],
  IN_PRODUCTION: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  PACKED: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED, OrderStatus.RETURN_REQUESTED],
  DELIVERED: [OrderStatus.RETURN_REQUESTED],
  RETURN_REQUESTED: [OrderStatus.RETURNED, OrderStatus.DELIVERED],
  RETURNED: [OrderStatus.REFUNDED],
  // Terminal.
  CANCELLED: [],
  REFUNDED: [],
};

export class InvalidTransitionError extends Error {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(
      `Cannot move an order from ${from} to ${to}. Allowed from ${from}: ${
        TRANSITIONS[from].join(', ') || 'nothing (terminal state)'
      }.`,
    );
    this.name = 'InvalidTransitionError';
  }
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from];
}

/**
 * The single doorway for changing an order's status.
 *
 * Writes an OrderEvent for every transition, so §6.7's customer-facing
 * timeline and §11.2's admin timeline read from real history rather than a
 * reconstruction.
 *
 * Returning stock on cancellation happens here too — it is part of the
 * transition, not a thing a caller might remember to do.
 */
export async function transitionOrder(params: {
  orderId: string;
  to: OrderStatus;
  note?: string;
  /** Admin user id, or null for a system transition. */
  createdBy?: string | null;
}): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: params.orderId },
    include: { items: true },
  });
  if (!order) throw new Error(`Order ${params.orderId} not found`);

  if (order.status === params.to) return; // idempotent no-op

  if (!canTransition(order.status, params.to)) {
    throw new InvalidTransitionError(order.status, params.to);
  }

  const timestamps: Prisma.OrderUpdateInput = {};
  if (params.to === OrderStatus.CONFIRMED) timestamps.confirmedAt = new Date();
  if (params.to === OrderStatus.SHIPPED) timestamps.shippedAt = new Date();
  if (params.to === OrderStatus.DELIVERED) timestamps.deliveredAt = new Date();
  if (params.to === OrderStatus.CANCELLED) timestamps.cancelledAt = new Date();

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: params.to, ...timestamps },
    });
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: params.to,
        note: params.note ?? null,
        createdBy: params.createdBy ?? null,
      },
    });
  });

  // Cancelling or returning puts the stock back. Done after the transition
  // commits so a stock error cannot leave the order in a half-changed state.
  if (params.to === OrderStatus.CANCELLED || params.to === OrderStatus.RETURNED) {
    const lines = order.items
      .filter((i) => i.variantId !== null)
      .map((i) => ({ variantId: i.variantId!, quantity: i.quantity }));

    if (lines.length > 0) {
      await incrementStock(lines, {
        reason: params.to === OrderStatus.CANCELLED ? 'ADJUSTMENT' : 'RETURN',
        orderId: order.id,
        createdBy: params.createdBy ?? undefined,
        note: `Stock returned on ${params.to.toLowerCase()}`,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Order numbers (§5.4)
// ---------------------------------------------------------------------------

/**
 * Human-readable order number, e.g. `BD-2026-00412`.
 *
 * Deliberately NOT the public URL identifier. §13.3 requires non-sequential
 * public references, because a sequential number in a URL is an invitation to
 * enumerate other people's orders (IDOR). The customer sees this number; the
 * URL uses `publicToken`.
 */
export async function generateOrderNumber(countryCode: string): Promise<string> {
  const prefix = countryCode.toUpperCase() === 'BD' ? 'BD' : 'IN';
  const year = new Date().getFullYear();

  const startOfYear = new Date(year, 0, 1);
  const count = await db.order.count({ where: { placedAt: { gte: startOfYear } } });

  return `${prefix}-${year}-${String(count + 1).padStart(5, '0')}`;
}

/** Unguessable public reference for order URLs and guest tracking (§13.3). */
export function generatePublicToken(): string {
  return randomBytes(16).toString('base64url');
}

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

export interface OrderLineInput {
  variantId: string;
  quantity: number;
  personalizationNote?: string | null;
}

export interface AddressInput {
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  area?: string | null;
  city: string;
  region?: string | null;
  postcode?: string | null;
  country: string;
}

export interface CreateOrderInput {
  email: string;
  phone: string;
  currency: Currency;
  lines: OrderLineInput[];
  shippingAddress: AddressInput;
  billingAddress: AddressInput;
  shippingMethod: string;
  shippingTotal: Minor;
  paymentMethod: PaymentMethod;
  paymentProvider: string;
  customerNote?: string | null;
  customerId?: string | null;
  /** §8.3 — makes a double-submitted checkout a no-op, not a second order. */
  idempotencyKey: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class EmptyOrderError extends Error {}
export class PriceMismatchError extends Error {}

/**
 * Creates an order.
 *
 * Order of operations matters and is deliberate:
 *
 *  1. Check the idempotency key first — a double-submit must return the
 *     existing order, not create a second one or fail loudly (§6.5).
 *  2. Re-read every price FROM THE DATABASE. Nothing about money comes from
 *     the client (§13.4). The cart only ever supplies variant ids and
 *     quantities.
 *  3. Snapshot names, SKUs, and images onto the line items, so renaming a
 *     product later cannot rewrite a three-year-old invoice (§5.5).
 *  4. Decrement stock with the conditional update, which is the point where
 *     a race for the last item is actually resolved (§23.3).
 *
 * Stock is decremented for every payment method, including online ones. The
 * alternative — waiting for the webhook — means two customers can both reach
 * a gateway for the same last bag. Cancelling an unpaid order returns the
 * stock, which `transitionOrder` handles.
 */
export async function createOrder(input: CreateOrderInput) {
  if (input.lines.length === 0) {
    throw new EmptyOrderError('Cannot place an order with no items.');
  }

  // 1. Idempotency (§8.3)
  const existing = await db.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { items: true },
  });
  if (existing) return existing;

  // 2. Authoritative prices from the database
  const variants = await db.variant.findMany({
    where: { id: { in: input.lines.map((l) => l.variantId) }, isActive: true },
    include: {
      product: {
        include: { images: { orderBy: { position: 'asc' }, take: 1 } },
      },
    },
  });

  if (variants.length !== input.lines.length) {
    throw new PriceMismatchError(
      'One or more items are no longer available. Your cart has been updated.',
    );
  }

  const isBdt = input.currency === 'BDT';

  const items = input.lines.map((line) => {
    const variant = variants.find((v) => v.id === line.variantId)!;
    const product = variant.product;

    const unitPrice = isBdt
      ? (variant.priceOverrideBdt ?? product.basePriceBdt)
      : (variant.priceOverrideUsd ?? product.basePriceUsd);

    return {
      productId: product.id,
      variantId: variant.id,
      // 3. Snapshots (§5.5)
      productNameSnapshot: product.nameEn,
      skuSnapshot: variant.sku,
      variantLabelSnapshot: [variant.colorNameEn, variant.sizeLabel]
        .filter(Boolean)
        .join(' / '),
      imageUrlSnapshot: product.images[0]?.url ?? null,
      unitPrice,
      quantity: line.quantity,
      lineTotal: multiplyMoney(unitPrice, line.quantity),
      personalizationNote: line.personalizationNote ?? null,
    };
  });

  const subtotal = addMoney(...items.map((i) => i.lineTotal));
  const grandTotal = addMoney(subtotal, input.shippingTotal);

  const orderNumber = await generateOrderNumber(input.shippingAddress.country);

  // 4. Stock first — if it fails, no order row is created at all.
  await decrementStock(
    input.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
    { reason: 'SALE', note: `Order ${orderNumber}` },
  );

  try {
    return await db.order.create({
      data: {
        orderNumber,
        publicToken: generatePublicToken(),
        customerId: input.customerId ?? null,
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        paymentMethod: input.paymentMethod,
        paymentProvider: input.paymentProvider,
        currency: input.currency,
        subtotal,
        shippingTotal: input.shippingTotal,
        grandTotal,
        shippingAddress: input.shippingAddress as unknown as Prisma.InputJsonValue,
        billingAddress: input.billingAddress as unknown as Prisma.InputJsonValue,
        shippingMethod: input.shippingMethod,
        customerNote: input.customerNote ?? null,
        idempotencyKey: input.idempotencyKey,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        items: { create: items },
        events: {
          create: { toStatus: OrderStatus.PENDING, note: 'Order placed' },
        },
      },
      include: { items: true },
    });
  } catch (error) {
    // The order row failed after stock was taken — put it back rather than
    // leaking inventory. Rare, but silently losing stock is worse than noisy.
    await incrementStock(
      input.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      { reason: 'ADJUSTMENT', note: `Rollback: order ${orderNumber} failed to persist` },
    ).catch(() => {});
    throw error;
  }
}

export { InsufficientStockError };

// ---------------------------------------------------------------------------
// Payment status (§8.3)
// ---------------------------------------------------------------------------

/**
 * Marks an order paid. Called ONLY from a verified webhook handler, or by an
 * admin recording cash received for a COD delivery.
 *
 * Idempotent: a gateway retrying its webhook must not double-confirm.
 */
export async function markOrderPaid(params: {
  orderId: string;
  paymentReference: string;
  amountPaid: Minor;
  createdBy?: string | null;
}): Promise<{ alreadyPaid: boolean }> {
  const order = await db.order.findUnique({ where: { id: params.orderId } });
  if (!order) throw new Error(`Order ${params.orderId} not found`);

  if (order.paymentStatus === PaymentStatus.PAID) return { alreadyPaid: true };

  // §8.3 — reconcile the amount. A gateway reporting a different figure than
  // we charged means tampering or a partial capture; either way a human
  // should look rather than the system quietly accepting it.
  if (params.amountPaid !== order.grandTotal) {
    throw new PriceMismatchError(
      `Payment amount ${params.amountPaid} does not match order total ${order.grandTotal} for ${order.orderNumber}.`,
    );
  }

  await db.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: PaymentStatus.PAID,
      paymentReference: params.paymentReference,
    },
  });

  // Payment confirms the order, if it has not been confirmed already.
  if (canTransition(order.status, OrderStatus.CONFIRMED)) {
    await transitionOrder({
      orderId: order.id,
      to: OrderStatus.CONFIRMED,
      note: 'Payment received',
      createdBy: params.createdBy ?? null,
    });
  }

  return { alreadyPaid: false };
}

/** Human-readable status labels for the customer-facing timeline (§6.7). */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Placed',
  CONFIRMED: 'Confirmed',
  IN_PRODUCTION: 'In production',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURN_REQUESTED: 'Return requested',
  RETURNED: 'Returned',
  REFUNDED: 'Refunded',
};
