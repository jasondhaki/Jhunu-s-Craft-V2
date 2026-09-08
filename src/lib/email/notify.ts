import 'server-only';

import { OrderStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { sendEmail } from './send';
import {
  orderConfirmationEmail,
  orderShippedEmail,
  orderCancelledEmail,
} from './templates';

/**
 * Order notifications — plan §10.1.
 *
 * One place that decides which email a status change produces, so the order
 * state machine does not grow a tangle of send calls and no transition
 * quietly forgets to tell the customer.
 *
 * Every function here is fire-and-forget from the caller's point of view:
 * they log failures and never throw. §14.4 wants proactive updates, but a
 * mail outage must never roll back an order that has already taken stock.
 */

/** §10.1 — "Order placed: order confirmation with full summary." */
export async function notifyOrderPlaced(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  const result = await sendEmail(orderConfirmationEmail(order));

  if (!result.sent && !result.skipped) {
    // Worth surfacing in the admin panel: the customer has no confirmation,
    // which §14.4 treats as a real trust problem rather than a minor glitch.
    console.error(
      `[notify] confirmation email failed for ${order.orderNumber}: ${result.error}`,
    );
  }
}

/** §10.1 — "Order shipped: tracking number + link + estimated delivery." */
export async function notifyOrderShipped(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  await sendEmail(orderShippedEmail(order));
}

/** §10.1 — "Order cancelled: reason + refund timeline." */
export async function notifyOrderCancelled(
  orderId: string,
  reason?: string | null,
): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  await sendEmail(orderCancelledEmail(order, reason));
}

/**
 * Maps a status transition to its customer notification.
 *
 * Called by `transitionOrder`, so adding a status later means adding a case
 * here rather than hunting for every place that changes an order.
 *
 * §10.1 note: the review request is deliberately NOT sent on delivery — the
 * plan asks for it 3–5 days later, which needs a scheduled job (Phase 4).
 */
export async function notifyStatusChange(
  orderId: string,
  to: OrderStatus,
  note?: string | null,
): Promise<void> {
  switch (to) {
    case OrderStatus.SHIPPED:
      await notifyOrderShipped(orderId);
      break;
    case OrderStatus.CANCELLED:
      await notifyOrderCancelled(orderId, note);
      break;
    default:
      // Confirmed, packed, in production, delivered: no email yet. §10.1
      // lists some of these, but sending on every internal step trains
      // customers to ignore the ones that matter.
      break;
  }
}
