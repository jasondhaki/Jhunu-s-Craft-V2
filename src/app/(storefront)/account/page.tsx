import Link from 'next/link';
import { requireCustomer } from '@/lib/customer-auth';
import { listCustomerOrders, claimGuestOrders } from '@/lib/customer-orders';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { STATUS_LABELS } from '@/lib/orders';
import { buttonClasses } from '@/components/ui/button';

/**
 * Account overview — plan §6.7.
 * "Greeting, recent orders, default address, quick links."
 */

export const metadata = {
  title: 'Your account',
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const customer = await requireCustomer();

  // A guest who ordered before registering should see those orders. Matching
  // on email is sound here because registering already proved inbox control.
  await claimGuestOrders(customer.id, customer.email);

  const [orders, defaultAddress] = await Promise.all([
    listCustomerOrders(customer.id),
    db.address.findFirst({
      where: { customerId: customer.id, isDefault: true },
    }),
  ]);

  const recent = orders.slice(0, 3);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display mb-4 text-md font-semibold">Recent orders</h2>

        {recent.length === 0 ? (
          <div className="border-line rounded-md border border-dashed px-4 py-8 text-center">
            <p className="text-muted text-sm">
              No orders yet. Everything here is made by hand, a few at a time.
            </p>
            <Link href="/shop" className={`${buttonClasses('primary', 'md')} mt-4`}>
              Shop all bags
            </Link>
          </div>
        ) : (
          <>
            <ul className="border-line divide-line divide-y rounded-md border">
              {recent.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="hover:bg-paper-sunk flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3"
                  >
                    <span className="tabular text-sm font-medium">
                      {order.orderNumber}
                    </span>
                    <span className="text-muted flex-1 text-sm">
                      {order.placedAt.toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="tabular text-sm">
                      {formatMoney(order.grandTotal, order.currency)}
                    </span>
                    <span className="bg-paper-sunk text-muted rounded-full px-2.5 py-1 text-xs">
                      {STATUS_LABELS[order.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {orders.length > recent.length && (
              <p className="mt-3">
                <Link
                  href="/account/orders"
                  className="text-jute-deep text-sm underline underline-offset-4"
                >
                  All {orders.length} orders
                </Link>
              </p>
            )}
          </>
        )}
      </section>

      <section>
        <h2 className="font-display mb-4 text-md font-semibold">Default address</h2>
        {defaultAddress ? (
          <address className="border-line text-forest-soft rounded-md border p-4 text-sm not-italic">
            {defaultAddress.recipientName}
            <br />
            {defaultAddress.line1}
            {defaultAddress.line2 ? `, ${defaultAddress.line2}` : ''}
            <br />
            {[defaultAddress.area, defaultAddress.city, defaultAddress.region]
              .filter(Boolean)
              .join(', ')}
            {defaultAddress.postcode ? ` ${defaultAddress.postcode}` : ''}
            <br />
            {defaultAddress.country}
          </address>
        ) : (
          <p className="border-line text-muted rounded-md border border-dashed px-4 py-6 text-sm">
            No saved address yet.{' '}
            <Link
              href="/account/addresses"
              className="text-jute-deep underline underline-offset-4"
            >
              Add one
            </Link>{' '}
            to make checkout quicker next time.
          </p>
        )}
      </section>
    </div>
  );
}
