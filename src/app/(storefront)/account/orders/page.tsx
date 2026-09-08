import Link from 'next/link';
import { requireCustomer } from '@/lib/customer-auth';
import { listCustomerOrders } from '@/lib/customer-orders';
import { formatMoney } from '@/lib/money';
import { STATUS_LABELS } from '@/lib/orders';
import { buttonClasses } from '@/components/ui/button';

export const metadata = {
  title: 'Your orders',
  robots: { index: false, follow: false },
};

export default async function AccountOrdersPage() {
  // §13.3 — the customer id goes INTO the query, so this cannot return
  // someone else's orders even if the layout guard were bypassed.
  const customer = await requireCustomer();
  const orders = await listCustomerOrders(customer.id);

  if (orders.length === 0) {
    return (
      <div className="border-line rounded-md border border-dashed px-4 py-10 text-center">
        <p className="text-muted text-sm">You have not ordered anything yet.</p>
        <Link href="/shop" className={`${buttonClasses('primary', 'md')} mt-4`}>
          Shop all bags
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="font-display mb-4 text-md font-semibold">
        {orders.length} {orders.length === 1 ? 'order' : 'orders'}
      </h2>
      <ul className="border-line divide-line divide-y rounded-md border">
        {orders.map((order) => {
          const units = order.items.reduce((n, i) => n + i.quantity, 0);
          return (
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
                  })}{' '}
                  · {units} {units === 1 ? 'item' : 'items'}
                </span>
                <span className="tabular text-sm">
                  {formatMoney(order.grandTotal, order.currency)}
                </span>
                <span className="bg-paper-sunk text-muted rounded-full px-2.5 py-1 text-xs">
                  {STATUS_LABELS[order.status]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
