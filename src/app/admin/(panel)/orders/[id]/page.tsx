import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { requireAdmin, auditLog } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import {
  transitionOrder,
  nextStatuses,
  markOrderPaid,
  STATUS_LABELS,
  InvalidTransitionError,
} from '@/lib/orders';
import { Button } from '@/components/ui/button';

/**
 * Order detail — plan §11.2.
 *
 * "One-click status advance — the most-used button in the whole panel. Make
 * it big."
 *
 * Every status change goes through `transitionOrder`, so the state machine
 * (§9.4) is enforced, the timeline is written, and cancelling returns stock —
 * none of which this page has to remember to do.
 */

export const metadata = { title: 'Order' };

const NEXT_STEP_LABEL: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: 'Confirm this order',
  IN_PRODUCTION: 'Start making it',
  PACKED: 'Mark as packed',
  SHIPPED: 'Mark as shipped',
  DELIVERED: 'Mark as delivered',
};

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { error, saved } = await searchParams;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!order) notFound();

  const shipping = order.shippingAddress as Record<string, string | null>;
  const allowed = nextStatuses(order.status);

  // The single most likely next step, for the big button.
  const primaryNext = allowed.find((s) => s !== OrderStatus.CANCELLED) ?? null;

  async function advance(formData: FormData) {
    'use server';

    // §13.3 — permission re-checked inside the action.
    const admin = await requireAdmin('STAFF');

    const parsed = z
      .object({
        to: z.nativeEnum(OrderStatus),
        note: z.string().trim().max(500).optional(),
      })
      .safeParse({
        to: formData.get('to'),
        note: formData.get('note') ?? undefined,
      });

    if (!parsed.success) redirect(`/admin/orders/${id}?error=Invalid+status`);

    try {
      await transitionOrder({
        orderId: id,
        to: parsed.data.to,
        note: parsed.data.note || undefined,
        createdBy: admin.id,
      });
      await auditLog({
        adminUserId: admin.id,
        action: 'order.transition',
        entityType: 'Order',
        entityId: id,
        after: { status: parsed.data.to },
      });
    } catch (err) {
      if (err instanceof InvalidTransitionError) {
        redirect(`/admin/orders/${id}?error=${encodeURIComponent(err.message)}`);
      }
      throw err;
    }

    revalidatePath(`/admin/orders/${id}`);
    revalidatePath('/admin/orders');
    revalidatePath('/admin');
    redirect(`/admin/orders/${id}?saved=1`);
  }

  async function recordCashReceived() {
    'use server';

    // Recording money as received is a MANAGER-level action.
    const admin = await requireAdmin('MANAGER');

    const current = await db.order.findUnique({ where: { id } });
    if (!current) notFound();

    // COD is the one case where no gateway webhook exists (§8.1). This is a
    // deliberate human action, audited — not a bypass of the webhook rule,
    // which applies to online payments (§8.3).
    await markOrderPaid({
      orderId: id,
      paymentReference: `COD-CASH-${current.orderNumber}`,
      amountPaid: current.grandTotal,
      createdBy: admin.id,
    });

    await auditLog({
      adminUserId: admin.id,
      action: 'order.mark_paid_cod',
      entityType: 'Order',
      entityId: id,
      before: { paymentStatus: current.paymentStatus },
      after: { paymentStatus: 'PAID' },
    });

    revalidatePath(`/admin/orders/${id}`);
    redirect(`/admin/orders/${id}?saved=1`);
  }

  return (
    <div>
      <Link
        href="/admin/orders"
        className="text-jute-deep text-sm underline underline-offset-4"
      >
        ← All orders
      </Link>

      <div className="mt-3 mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display tabular text-xl font-semibold">
          {order.orderNumber}
        </h1>
        <span className="text-muted text-sm">
          Placed {order.placedAt.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      {saved && (
        <p role="status" className="border-leaf text-leaf mb-6 rounded-sm border px-3 py-2 text-sm">
          Order updated.
        </p>
      )}
      {error && (
        <p role="alert" className="border-clay text-clay mb-6 rounded-sm border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {/* --- The big button (§11.2) -------------------------------------- */}
      {primaryNext && (
        <form action={advance} className="mb-4">
          <input type="hidden" name="to" value={primaryNext} />
          <Button type="submit" size="lg" fullWidth>
            {NEXT_STEP_LABEL[primaryNext] ?? `Move to ${STATUS_LABELS[primaryNext]}`}
          </Button>
        </form>
      )}

      {/* COD cash collection */}
      {order.paymentMethod === 'COD' &&
        order.paymentStatus !== PaymentStatus.PAID && (
          <form action={recordCashReceived} className="mb-4">
            <Button type="submit" variant="secondary" fullWidth>
              Record cash received — {formatMoney(order.grandTotal, order.currency)}
            </Button>
          </form>
        )}

      {/* Other transitions, including cancel */}
      {allowed.length > 0 && (
        <details className="border-line mb-8 rounded-md border">
          <summary className="text-muted min-h-11 cursor-pointer px-4 py-3 text-sm">
            Other status changes
          </summary>
          <div className="border-line space-y-2 border-t p-4">
            {allowed.map((next) => (
              <form key={next} action={advance} className="flex gap-2">
                <input type="hidden" name="to" value={next} />
                <input
                  name="note"
                  placeholder="Reason or note (optional)"
                  className="border-line-strong bg-paper min-h-11 flex-1 rounded-sm border px-3 text-sm"
                />
                <button
                  type="submit"
                  className={
                    next === OrderStatus.CANCELLED
                      ? 'border-clay text-clay hover:bg-clay min-h-11 shrink-0 rounded-md border px-4 text-sm hover:text-white'
                      : 'border-line-strong hover:bg-paper-sunk min-h-11 shrink-0 rounded-md border px-4 text-sm'
                  }
                >
                  {STATUS_LABELS[next]}
                </button>
              </form>
            ))}
            <p className="text-muted pt-2 text-xs">
              Cancelling returns the stock automatically.
            </p>
          </div>
        </details>
      )}

      <div className="grid gap-10 lg:grid-cols-2">
        {/* --- Items ---------------------------------------------------- */}
        <section>
          <h2 className="mb-3 text-sm font-semibold">Items</h2>
          <ul className="border-line divide-line divide-y rounded-md border">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-baseline gap-3 px-4 py-3 text-sm">
                <span className="tabular text-muted">{item.quantity}×</span>
                <span className="flex-1">
                  {item.productNameSnapshot}
                  <span className="text-muted block text-xs">
                    {item.variantLabelSnapshot} · {item.skuSnapshot}
                  </span>
                  {item.personalizationNote && (
                    <span className="text-clay block text-xs">
                      Note: {item.personalizationNote}
                    </span>
                  )}
                </span>
                <span className="tabular">
                  {formatMoney(item.lineTotal, order.currency)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="tabular">{formatMoney(order.subtotal, order.currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd className="tabular">
                {order.shippingTotal === 0
                  ? 'Free'
                  : formatMoney(order.shippingTotal, order.currency)}
              </dd>
            </div>
            <div className="border-line flex justify-between border-t pt-2 font-medium">
              <dt>Total</dt>
              <dd className="tabular">{formatMoney(order.grandTotal, order.currency)}</dd>
            </div>
          </dl>

          <p className="text-muted mt-3 text-sm">
            {order.paymentMethod === 'COD' ? 'Cash on delivery' : order.paymentMethod}
            {' · '}
            <span
              className={
                order.paymentStatus === PaymentStatus.PAID ? 'text-leaf' : 'text-clay'
              }
            >
              {order.paymentStatus === PaymentStatus.PAID ? 'Paid' : 'Unpaid'}
            </span>
          </p>
        </section>

        {/* --- Customer & delivery -------------------------------------- */}
        <section>
          <h2 className="mb-3 text-sm font-semibold">Deliver to</h2>
          <div className="border-line rounded-md border p-4 text-sm">
            <address className="not-italic">
              <strong>{shipping.recipientName}</strong>
              <br />
              {shipping.line1}
              {shipping.line2 ? `, ${shipping.line2}` : ''}
              <br />
              {[shipping.area, shipping.city, shipping.region].filter(Boolean).join(', ')}
              {shipping.postcode ? ` ${shipping.postcode}` : ''}
              <br />
              {shipping.country}
            </address>

            <p className="mt-3">
              <a href={`tel:${shipping.phone}`} className="text-jute-deep underline">
                {shipping.phone}
              </a>
              <br />
              <a href={`mailto:${order.email}`} className="text-jute-deep underline">
                {order.email}
              </a>
            </p>

            <p className="text-muted mt-3 text-xs">{order.shippingMethod}</p>
          </div>

          {order.customerNote && (
            <div className="border-jute mt-4 rounded-md border p-4 text-sm">
              <p className="mb-1 font-medium">Note from the customer</p>
              <p>{order.customerNote}</p>
            </div>
          )}

          {/* --- Timeline (§11.2, §6.7) --------------------------------- */}
          <h2 className="mt-8 mb-3 text-sm font-semibold">History</h2>
          <ol className="space-y-3">
            {order.events.map((event) => (
              <li key={event.id} className="flex gap-3 text-sm">
                <span
                  aria-hidden="true"
                  className="bg-jute mt-1.5 size-2 shrink-0 rounded-full"
                />
                <div>
                  <p>
                    {event.fromStatus
                      ? `${STATUS_LABELS[event.fromStatus]} → ${STATUS_LABELS[event.toStatus]}`
                      : STATUS_LABELS[event.toStatus]}
                  </p>
                  <p className="text-muted text-xs">
                    {event.createdAt.toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {event.note ? ` · ${event.note}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
