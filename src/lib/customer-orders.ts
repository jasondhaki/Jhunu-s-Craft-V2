import 'server-only';

import { db } from '@/lib/db';

/**
 * Customer-facing order queries — plan §6.7, §6.9, §13.3.
 *
 * §13.3 is blunt about this: "Check object ownership on every customer-facing
 * resource — a customer must not be able to fetch /api/orders/1234 for
 * someone else's order. This class of bug (IDOR) is the most common serious
 * flaw in small ecommerce sites."
 *
 * So there is no `getOrderById(id)` here. Every function takes the identity
 * of the requester alongside the identifier, and the ownership condition is
 * part of the WHERE clause rather than an `if` afterwards. A query that
 * cannot express who is asking cannot leak to the wrong person.
 */

const orderDetail = {
  items: true,
  events: { orderBy: { createdAt: 'asc' } },
} as const;

/** Orders belonging to a signed-in customer. */
export async function listCustomerOrders(customerId: string) {
  return db.order.findMany({
    where: { customerId },
    include: { items: { select: { id: true, quantity: true, imageUrlSnapshot: true } } },
    orderBy: { placedAt: 'desc' },
  });
}

/**
 * One order, scoped to its owner. `customerId` is in the WHERE clause, so a
 * mismatched pair returns null rather than someone else's order.
 */
export async function getCustomerOrder(customerId: string, orderId: string) {
  return db.order.findFirst({
    where: { id: orderId, customerId },
    include: orderDetail,
  });
}

/**
 * Guest order tracking — §6.9, "order number + email or phone, no login
 * needed", and §14.4, "order tracking that works without an account".
 *
 * Two accepted proofs:
 *  - the unguessable `publicToken` from the confirmation email or page, or
 *  - the order number PLUS the email or phone on the order.
 *
 * The second is deliberately a pair. An order number alone is guessable —
 * they are sequential by design so humans can read them out over the phone —
 * so it is never sufficient on its own.
 */
export async function findOrderForGuest(params: {
  orderNumber?: string | null;
  token?: string | null;
  emailOrPhone?: string | null;
}) {
  const { orderNumber, token, emailOrPhone } = params;

  // Path 1: the token is itself the proof.
  if (token && orderNumber) {
    return db.order.findFirst({
      where: { orderNumber: orderNumber.trim(), publicToken: token.trim() },
      include: orderDetail,
    });
  }

  // Path 2: order number + a contact detail that matches the order.
  if (orderNumber && emailOrPhone) {
    const contact = emailOrPhone.trim();
    // Compare phone numbers by digits only, so "+880 1730 431932" and
    // "01730431932" both work — a customer will not retype it exactly.
    const digits = contact.replace(/\D/g, '');

    const order = await db.order.findFirst({
      where: {
        orderNumber: orderNumber.trim(),
        OR: [
          { email: { equals: contact.toLowerCase(), mode: 'insensitive' } },
          ...(digits.length >= 6 ? [{ phone: { contains: digits.slice(-9) } }] : []),
        ],
      },
      include: orderDetail,
    });
    return order;
  }

  return null;
}

/**
 * Links past guest orders to an account.
 *
 * A guest who later registers with the same email should see the orders they
 * already placed. Matching on email is the right level of proof here because
 * registration already required control of that inbox.
 */
export async function claimGuestOrders(
  customerId: string,
  email: string,
): Promise<number> {
  const { count } = await db.order.updateMany({
    where: { email: email.toLowerCase(), customerId: null },
    data: { customerId },
  });
  return count;
}
