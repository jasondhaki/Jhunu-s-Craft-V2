import type { Order, OrderItem, OrderEvent } from '@prisma/client';
import { OrderStatus } from '@prisma/client';
import { formatMoney, type Currency } from '@/lib/money';
import { STATUS_LABELS } from '@/lib/orders';
import { siteConfig } from '@/lib/site-config';
import { cn } from '@/lib/cn';
import { reviewableProductsForOrder } from '@/lib/reviews';
import { ReviewForm } from './review-form';

/**
 * Customer-facing order view — plan §6.7.
 *
 * "Full timeline (Placed → Confirmed → In production → Shipped → Delivered),
 * tracking link, reorder button."
 *
 * Shared by /account/orders/[id] and /track-order so a guest and a signed-in
 * customer see exactly the same thing. Only the way they proved who they are
 * differs — see src/lib/customer-orders.ts.
 */

type FullOrder = Order & { items: OrderItem[]; events: OrderEvent[] };

/** The happy path, for the progress rail. Cancellations are shown separately. */
const TIMELINE: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.IN_PRODUCTION,
  OrderStatus.PACKED,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

export async function OrderDetail({
  order,
  /** Passed on the guest path so the review form can prove order access. */
  guestToken,
}: {
  order: FullOrder;
  guestToken?: string;
}) {
  // §6.3.14 — only a DELIVERED order yields anything reviewable.
  const reviewable = await reviewableProductsForOrder(order.id);
  const currency = order.currency as Currency;
  const address = order.shippingAddress as Record<string, string | null>;

  const isCancelled =
    order.status === OrderStatus.CANCELLED ||
    order.status === OrderStatus.REFUNDED;

  // In-production only appears for made-to-order work, so skipping it should
  // not make the rail look broken.
  const reached = new Set(order.events.map((e) => e.toStatus));
  const currentIndex = TIMELINE.indexOf(order.status);

  return (
    <div className="space-y-10">
      {/* --- Header ---------------------------------------------------- */}
      <div>
        <p className="text-muted text-sm">Order</p>
        <p className="font-display tabular text-lg font-semibold select-all">
          {order.orderNumber}
        </p>
        <p className="text-muted mt-1 text-sm">
          Placed{' '}
          {order.placedAt.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* --- Timeline (§6.7) -------------------------------------------- */}
      <section>
        <h2 className="font-display mb-4 text-md font-semibold">Progress</h2>

        {isCancelled ? (
          <p className="border-clay text-clay rounded-md border px-4 py-3 text-sm">
            This order was {STATUS_LABELS[order.status].toLowerCase()}.
            {order.paymentStatus === 'REFUNDED'
              ? ' Your refund has been issued.'
              : ''}
          </p>
        ) : (
          <ol className="space-y-0">
            {TIMELINE.map((status, i) => {
              const done = reached.has(status) || i < currentIndex;
              const current = order.status === status;
              const event = order.events.find((e) => e.toStatus === status);

              return (
                <li key={status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mt-1 size-3 shrink-0 rounded-full border-2',
                        done || current
                          ? 'border-leaf bg-leaf'
                          : 'border-line bg-paper',
                      )}
                    />
                    {i < TIMELINE.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          'w-0.5 flex-1',
                          done ? 'bg-leaf' : 'bg-line',
                        )}
                      />
                    )}
                  </div>

                  <div className={cn('pb-6', !done && !current && 'opacity-50')}>
                    <p className="text-sm font-medium">
                      {STATUS_LABELS[status]}
                      {current && (
                        <span className="text-leaf ml-2 text-xs">
                          — where your order is now
                        </span>
                      )}
                    </p>
                    {event && (
                      <p className="text-muted text-xs">
                        {event.createdAt.toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {order.trackingNumber && (
          <div className="border-line mt-4 rounded-md border p-4 text-sm">
            <p className="font-medium">
              {order.courierName ?? 'Courier'} tracking
            </p>
            <p className="tabular mt-1">{order.trackingNumber}</p>
            {order.trackingUrl && (
              <p className="mt-2">
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-jute-deep underline underline-offset-4"
                >
                  Follow it on the courier&rsquo;s site
                </a>
              </p>
            )}
          </div>
        )}
      </section>

      {/* --- Items ------------------------------------------------------ */}
      <section>
        <h2 className="font-display mb-4 text-md font-semibold">Items</h2>
        <ul className="border-line divide-line divide-y border-y">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-baseline gap-3 py-3 text-sm">
              <span className="tabular text-muted">{item.quantity}×</span>
              <span className="flex-1">
                {item.productNameSnapshot}
                <span className="text-muted block text-xs">
                  {item.variantLabelSnapshot}
                </span>
              </span>
              <span className="tabular">
                {formatMoney(item.lineTotal, currency)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular">{formatMoney(order.subtotal, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery — {order.shippingMethod}</dt>
            <dd className="tabular">
              {order.shippingTotal === 0
                ? 'Free'
                : formatMoney(order.shippingTotal, currency)}
            </dd>
          </div>
          <div className="border-line flex justify-between border-t pt-2 text-base font-medium">
            <dt>Total</dt>
            <dd className="tabular">{formatMoney(order.grandTotal, currency)}</dd>
          </div>
        </dl>

        <p className="text-muted mt-3 text-sm">
          {order.paymentMethod === 'COD'
            ? order.paymentStatus === 'PAID'
              ? 'Paid in cash on delivery.'
              : `Cash on delivery — please have ${formatMoney(order.grandTotal, currency)} ready.`
            : order.paymentStatus === 'PAID'
              ? 'Paid.'
              : 'Payment pending.'}
        </p>
      </section>

      {/* --- Delivery address ------------------------------------------- */}
      <section>
        <h2 className="font-display mb-4 text-md font-semibold">Delivering to</h2>
        <address className="text-forest-soft text-sm not-italic">
          {address.recipientName}
          <br />
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ''}
          <br />
          {[address.area, address.city, address.region].filter(Boolean).join(', ')}
          {address.postcode ? ` ${address.postcode}` : ''}
          <br />
          {address.country}
          <br />
          {address.phone}
        </address>
      </section>

      {/* §6.3.14 — the write-a-review entry point lives here rather than on
          the product page, because this is where we know the customer
          actually received the bag. */}
      {reviewable.length > 0 && (
        <section className="border-line border-t pt-8">
          <h2 className="font-display text-md font-semibold">
            How did you get on with {reviewable.length === 1 ? 'it' : 'them'}?
          </h2>
          <p className="text-muted mt-1 mb-6 text-sm">
            Honest reviews help the next person more than kind ones. We publish
            the critical ones too.
          </p>

          <div className="space-y-8">
            {reviewable.map((item) =>
              item.alreadyReviewed ? (
                <p key={item.productId} className="text-muted text-sm">
                  Thank you for reviewing {item.name}.
                </p>
              ) : (
                <div key={item.productId} className="border-line rounded-md border p-4">
                  <ReviewForm
                    orderId={order.id}
                    productId={item.productId}
                    productName={item.name}
                    guestToken={guestToken}
                  />
                </div>
              ),
            )}
          </div>
        </section>
      )}

      <p className="text-muted text-sm">
        Something wrong with this order? Call{' '}
        <a href={`tel:${siteConfig.contact.phone}`} className="underline">
          {siteConfig.contact.phoneDisplay}
        </a>{' '}
        and quote {order.orderNumber}.
      </p>
    </div>
  );
}
