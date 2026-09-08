import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireCustomer } from '@/lib/customer-auth';
import { getCustomerOrder } from '@/lib/customer-orders';
import { OrderDetail } from '@/components/commerce/order-detail';

export const metadata = {
  title: 'Order',
  robots: { index: false, follow: false },
};

export default async function AccountOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const customer = await requireCustomer();
  const { id } = await params;

  /*
   * §13.3 — IDOR protection.
   *
   * `getCustomerOrder` puts BOTH the order id and the customer id in the
   * WHERE clause. Requesting another customer's order id returns null and
   * therefore a 404, which is also the right answer for an id that does not
   * exist — the two cases are indistinguishable from outside, so this cannot
   * be used to discover which order ids are real.
   */
  const order = await getCustomerOrder(customer.id, id);
  if (!order) notFound();

  return (
    <>
      <p className="mb-6">
        <Link
          href="/account/orders"
          className="text-jute-deep text-sm underline underline-offset-4"
        >
          ← All orders
        </Link>
      </p>
      <OrderDetail order={order} />
    </>
  );
}
