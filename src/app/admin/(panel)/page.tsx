import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { placeholdersRemaining } from '@/lib/site-config';

/**
 * Admin dashboard — plan §11.1.
 *
 * "Action queue — the most important element." Each row links straight to the
 * filtered list, so the answer to "what needs doing today" is one tap away.
 */

export default async function AdminDashboard() {
  await requireAdmin();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    ordersToConfirm,
    ordersToShip,
    reviewsToApprove,
    unansweredMessages,
    lowStockVariants,
    todaysOrders,
    todaysRevenue,
    activeProducts,
    draftProducts,
  ] = await Promise.all([
    db.order.count({ where: { status: 'PENDING' } }),
    db.order.count({ where: { status: { in: ['CONFIRMED', 'IN_PRODUCTION', 'PACKED'] } } }),
    db.review.count({ where: { status: 'PENDING' } }),
    db.contactMessage.count({ where: { status: 'NEW' } }),
    db.variant.findMany({
      where: { isActive: true, stockQuantity: { lte: 3 } },
      include: { product: { select: { nameEn: true, slug: true, madeToOrder: true } } },
      orderBy: { stockQuantity: 'asc' },
      take: 12,
    }),
    db.order.count({ where: { placedAt: { gte: startOfToday } } }),
    db.order.aggregate({
      where: { placedAt: { gte: startOfToday }, paymentStatus: 'PAID' },
      _sum: { grandTotal: true },
    }),
    db.product.count({ where: { status: 'ACTIVE' } }),
    db.product.count({ where: { status: 'DRAFT' } }),
  ]);

  // Made-to-order items are not "low stock" — they are built on demand.
  const genuinelyLow = lowStockVariants.filter((v) => !v.product.madeToOrder);

  const queue = [
    { count: ordersToConfirm, label: 'orders to confirm', href: '/admin/orders?status=pending' },
    { count: ordersToShip, label: 'orders to ship', href: '/admin/orders?status=to_ship' },
    { count: reviewsToApprove, label: 'reviews to approve', href: '/admin/reviews?status=pending' },
    { count: unansweredMessages, label: 'unanswered messages', href: '/admin/messages?status=new' },
    { count: genuinelyLow.length, label: 'low-stock items', href: '/admin/inventory?low=1' },
  ].filter((item) => item.count > 0);

  const missingDetails = placeholdersRemaining();

  return (
    <div className="space-y-10">
      <h1 className="font-display text-xl font-semibold">Today</h1>

      {/* --- Action queue (§11.1) ---------------------------------------- */}
      <section>
        <h2 className="mb-4 text-sm font-semibold">Needs doing</h2>
        {queue.length === 0 ? (
          <p className="border-line text-muted rounded-md border border-dashed px-4 py-6 text-sm">
            Nothing waiting. No orders to confirm, nothing to ship, no messages
            unanswered.
          </p>
        ) : (
          <ul className="space-y-2">
            {queue.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="border-line hover:border-jute-deep flex min-h-14 items-center gap-3 rounded-md border px-4"
                >
                  <span className="bg-jute tabular inline-flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white">
                    {item.count}
                  </span>
                  <span className="flex-1 text-sm">{item.label}</span>
                  <ArrowRight className="text-muted size-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --- Today's numbers --------------------------------------------- */}
      <section>
        <h2 className="mb-4 text-sm font-semibold">Numbers</h2>
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Orders today" value={String(todaysOrders)} />
          <Stat
            label="Paid today"
            value={formatMoney(todaysRevenue._sum.grandTotal ?? 0, 'BDT')}
          />
          <Stat label="Live products" value={String(activeProducts)} />
          <Stat label="Drafts" value={String(draftProducts)} />
        </dl>
      </section>

      {/* --- Low stock (§11.1) ------------------------------------------- */}
      {genuinelyLow.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold">Running low</h2>
          <ul className="border-line divide-line divide-y rounded-md border">
            {genuinelyLow.map((variant) => (
              <li key={variant.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex-1 text-sm">
                  {variant.product.nameEn}
                  <span className="text-muted"> · {variant.colorNameEn}</span>
                </span>
                <span
                  className={
                    variant.stockQuantity === 0
                      ? 'text-clay tabular text-sm font-medium'
                      : 'tabular text-sm'
                  }
                >
                  {variant.stockQuantity === 0
                    ? 'Out of stock'
                    : `${variant.stockQuantity} left`}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            <Link
              href="/admin/inventory"
              className="text-jute-deep text-sm underline underline-offset-4"
            >
              Update stock
            </Link>
          </p>
        </section>
      )}

      {/* --- Setup still outstanding --------------------------------------
          §25 requires no placeholders anywhere before launch. Surfacing them
          here means the owner sees what is missing without reading a file.
         ------------------------------------------------------------------ */}
      {missingDetails.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="text-clay size-4" aria-hidden="true" />
            Details still missing ({missingDetails.length})
          </h2>
          <p className="text-muted mb-3 text-sm">
            These appear as blanks on the site. The site cannot launch with any
            of them outstanding (§25).
          </p>
          <ul className="text-muted flex flex-wrap gap-2 text-xs">
            {missingDetails.map((path) => (
              <li key={path} className="bg-paper-sunk rounded-full px-3 py-1">
                {path}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-line rounded-md border p-4">
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="tabular font-display mt-1 text-lg font-semibold">{value}</dd>
    </div>
  );
}
