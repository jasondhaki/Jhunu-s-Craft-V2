import type { Metadata } from 'next';
import Link from 'next/link';
import { ProsePage, ProseSection, P } from '@/components/prose-page';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { siteConfig } from '@/lib/site-config';

/**
 * Shipping information — plan §15.5 and §9.
 *
 * "Processing time · domestic zones, rates, and estimates · international
 * zones, rates, and estimates · couriers used · tracking · duties and taxes
 * disclaimer · undeliverable/refused packages · lost or delayed shipments ·
 * address accuracy responsibility."
 *
 * Rates are read from the SAME shipping zone rows that checkout uses, so this
 * page cannot promise a price the checkout then contradicts. A shipping page
 * that disagrees with the basket is worse than no shipping page.
 */

export const metadata: Metadata = {
  title: 'Shipping',
  description:
    'Delivery costs and times inside Bangladesh and worldwide, taken straight from the rates used at checkout.',
  alternates: { canonical: '/shipping' },
};

export default async function ShippingPage() {
  const zones = await db.shippingZone.findMany({
    where: { isActive: true },
    include: { rates: { where: { isActive: true }, orderBy: { priceBdt: 'asc' } } },
    orderBy: { position: 'asc' },
  });

  const domestic = zones.filter((z) => z.code.startsWith('BD_'));
  const international = zones.filter((z) => !z.code.startsWith('BD_'));

  return (
    <ProsePage
      title="Shipping"
      intro="What delivery costs, how long it takes, and what happens when something goes wrong."
      crumbs={[{ label: 'Shipping' }]}
      updated="8 September 2026"
    >
      <ProseSection heading="Before it ships">
        <P>
          We dispatch in {siteConfig.promises.dispatchDays}. Made-to-order
          pieces take longer — the product page shows how many days before you
          buy, not after.
        </P>
        <P>
          Everything is made in our own workshop, so we know where an order
          actually is. If something is going to be late we will tell you rather
          than let the tracking page say it for us.
        </P>
      </ProseSection>

      <ProseSection heading="Inside Bangladesh">
        <ZoneTable zones={domestic} currency="BDT" />
        <P>
          Free delivery inside Dhaka on orders over{' '}
          {formatMoney(siteConfig.freeShippingThreshold.BDT, 'BDT')}. The cart
          shows how much more you need, if any.
        </P>
        <P>
          Cash on delivery is available across Bangladesh, up to ৳15,000 per
          order, with no extra fee. The courier calls before delivering.
        </P>
      </ProseSection>

      <ProseSection heading="International">
        <ZoneTable zones={international} currency="USD" />
        <P>
          Sent by DHL Express with tracking. Times exclude customs, which is
          outside anyone&rsquo;s control including ours.
        </P>
      </ProseSection>

      <ProseSection heading="Customs and import duties">
        <P>
          <strong>
            Import duties and taxes are not included and are the responsibility
            of the customer.
          </strong>{' '}
          What you owe depends on your own country&rsquo;s rules, and it is
          charged by them rather than by us.
        </P>
        <P>
          We declare the true value and an accurate description on the customs
          form. We will not under-declare a parcel to reduce your duty — it
          voids the insurance if it goes missing and creates legal exposure for
          both of us. If that is a deal-breaker, please do not order.
        </P>
      </ProseSection>

      <ProseSection heading="Tracking">
        <P>
          You get a tracking number by email when your order ships. You can also
          check any order at{' '}
          <Link href="/track-order" className="text-jute-deep underline underline-offset-4">
            track your order
          </Link>{' '}
          with your order number and the email or phone you used — no account
          needed.
        </P>
      </ProseSection>

      <ProseSection heading="Getting the address right">
        <P>
          Please check your address and give a phone number you actually answer;
          couriers here call before delivering and a wrong number is the most
          common reason a delivery fails.
        </P>
        <P>
          If a parcel comes back to us because the address was wrong or nobody
          could be reached, we will contact you. Resending costs the delivery
          fee again.
        </P>
      </ProseSection>

      <ProseSection heading="Refused parcels">
        <P>
          If you have changed your mind, please call and cancel rather than
          refusing the parcel at the door. A refused cash-on-delivery order
          costs us the courier fee in both directions on a bag made by hand.
          Cancelling costs nothing.
        </P>
      </ProseSection>

      <ProseSection heading="Late, lost, or damaged">
        <P>
          If a domestic parcel is more than three days past its window, or an
          international one more than seven, tell us and we will chase the
          courier — you should not have to.
        </P>
        <P>
          If it is genuinely lost, we replace it or refund you in full. That is
          our problem with the courier, not yours with us.
        </P>
        <P>
          Damaged in transit: send us a photograph within 48 hours of delivery
          and we will replace it, including all postage.
        </P>
      </ProseSection>

      <ProseSection heading="Returns">
        <P>
          Covered on the{' '}
          <Link
            href="/policies/refund"
            className="text-jute-deep underline underline-offset-4"
          >
            refunds and returns page
          </Link>
          , including who pays return postage.
        </P>
      </ProseSection>
    </ProsePage>
  );
}

function ZoneTable({
  zones,
  currency,
}: {
  zones: {
    code: string;
    nameEn: string;
    rates: {
      id: string;
      nameEn: string;
      priceBdt: number;
      priceUsd: number;
      minDays: number;
      maxDays: number;
    }[];
  }[];
  currency: 'BDT' | 'USD';
}) {
  if (zones.length === 0) return null;

  return (
    <div className="border-line -mx-4 overflow-x-auto px-4 sm:mx-0 sm:rounded-md sm:border sm:px-0">
      <table className="w-full min-w-[28rem] border-collapse text-sm">
        <thead>
          <tr className="border-line border-b text-left">
            <th scope="col" className="p-3 font-semibold">Destination</th>
            <th scope="col" className="p-3 font-semibold">Service</th>
            <th scope="col" className="p-3 font-semibold">Cost</th>
            <th scope="col" className="p-3 font-semibold">Time</th>
          </tr>
        </thead>
        <tbody>
          {zones.flatMap((zone) =>
            zone.rates.map((rate) => (
              <tr key={rate.id} className="border-line border-b last:border-0">
                <th scope="row" className="p-3 text-left align-top font-medium">
                  {zone.nameEn}
                </th>
                <td className="text-forest-soft p-3 align-top">{rate.nameEn}</td>
                <td className="tabular p-3 align-top whitespace-nowrap">
                  {formatMoney(
                    currency === 'BDT' ? rate.priceBdt : rate.priceUsd,
                    currency,
                  )}
                </td>
                <td className="text-forest-soft p-3 align-top whitespace-nowrap">
                  {rate.minDays}–{rate.maxDays} days
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}
