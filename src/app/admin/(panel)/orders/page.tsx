import Link from 'next/link';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { STATUS_LABELS } from '@/lib/orders';

/**
 * Orders list — plan §11.2.
 *
 * "List with filters (status, payment status, date range, courier, search by
 * order number/phone/name) and bulk actions."
 *
 * Filters are GET parameters so the whole screen works without JavaScript on
 * the phone §11.5 says he will use, and so a filtered view can be bookmarked.
 */

export const metadata = { title: 'Orders' };

const STATUS_FILTERS: Record<string, OrderStatus[]> = {
  pending: [OrderStatus.PENDING],
  to_ship: [OrderStatus.CONFIRMED, OrderStatus.IN_PRODUCTION, OrderStatus.PACKED],
  shipped: [OrderStatus.SHIPPED],
  delivered: [OrderStatus.DELIVERED],
  cancelled: [OrderStatus.CANCELLED, OrderStatus.REFUNDED],
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin();
  const { status, q } = await searchParams;

  const statuses = status ? STATUS_FILTERS[status] : undefined;

  const orders = await db.order.findMany({
    where: {
      ...(statuses ? { status: { in: statuses } } : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: 'insensitive' as const } },
              { phone: { contains: q } },
              { email: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    include: { items: { select: { quantity: true } } },
    orderBy: { placedAt: 'desc' },
    take: 100,
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-xl font-semibold">Orders</h1>
        <p className="text-muted text-sm">{orders.length} shown</p>
      </div>

      <form action="/admin/orders" method="get" className="mb-4 flex flex-wrap gap-2">
        <label htmlFor="q" className="sr-only">
          Search orders
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q ?? ''}
          placeholder="Order number, phone, or email"
          className="border-line-strong bg-paper min-h-11 flex-1 rounded-sm border px-3 text-sm"
        />
        <button
          type="submit"
          className="border-line-strong min-h-11 rounded-md border px-4 text-sm"
        >
          Search
        </button>
      </form>

      <nav aria-label="Filter by status" className="mb-6 flex flex-wrap gap-2">
        {[
          { key: '', label: 'All' },
          { key: 'pending', label: 'To confirm' },
          { key: 'to_ship', label: 'To ship' },
          { key: 'shipped', label: 'Shipped' },
          { key: 'delivered', label: 'Delivered' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={tab.key ? `/admin/orders?status=${tab.key}` : '/admin/orders'}
            aria-current={(status ?? '') === tab.key ? 'page' : undefined}
            className={
              (status ?? '') === tab.key
                ? 'bg-forest text-paper inline-flex min-h-11 items-center rounded-md px-4 text-sm'
                : 'border-line-strong hover:bg-paper-sunk inline-flex min-h-11 items-center rounded-md border px-4 text-sm'
            }
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="border-line text-muted rounded-md border border-dashed px-4 py-8 text-center text-sm">
          {q || status
            ? 'No orders match. Try a different search or filter.'
            : 'No orders yet. They will appear here the moment one is placed.'}
        </p>
      ) : (
        <ul className="border-line divide-line divide-y rounded-md border">
          {orders.map((order) => {
            const units = order.items.reduce((n, i) => n + i.quantity, 0);
            return (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="hover:bg-paper-sunk flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3"
                >
                  <span className="tabular w-32 shrink-0 text-sm font-medium">
                    {order.orderNumber}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {(order.shippingAddress as { recipientName?: string })
                      .recipientName ?? order.email}
                    <span className="text-muted">
                      {' '}
                      · {units} {units === 1 ? 'item' : 'items'}
                    </span>
                  </span>
                  <span className="tabular text-sm">
                    {formatMoney(order.grandTotal, order.currency)}
                  </span>
                  <PaymentPill status={order.paymentStatus} method={order.paymentMethod} />
                  <StatusPill status={order.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  const tone: Record<OrderStatus, string> = {
    PENDING: 'bg-jute text-white',
    CONFIRMED: 'bg-forest text-paper',
    IN_PRODUCTION: 'bg-forest text-paper',
    PACKED: 'bg-forest text-paper',
    SHIPPED: 'bg-leaf text-white',
    DELIVERED: 'bg-paper-sunk text-muted',
    CANCELLED: 'bg-line text-muted',
    RETURN_REQUESTED: 'bg-clay text-white',
    RETURNED: 'bg-line text-muted',
    REFUNDED: 'bg-line text-muted',
  };
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${tone[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function PaymentPill({
  status,
  method,
}: {
  status: PaymentStatus;
  method: string;
}) {
  if (status === PaymentStatus.PAID) {
    return (
      <span className="text-leaf shrink-0 text-xs font-medium">Paid</span>
    );
  }
  return (
    <span className="text-muted shrink-0 text-xs">
      {method === 'COD' ? 'COD — unpaid' : 'Unpaid'}
    </span>
  );
}
