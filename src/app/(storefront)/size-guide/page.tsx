import type { Metadata } from 'next';
import Link from 'next/link';
import { ProsePage, ProseSection, P, UL } from '@/components/prose-page';
import { BAG_TYPE_LABELS } from '@/components/commerce/catalog-filters';
import { db } from '@/lib/db';

/**
 * Size guide — plan §6.9.
 *
 * "A comparison table of all bag types with dimensions, plus a 'what fits
 * inside' visual and a diagram explaining how dimensions are measured."
 *
 * Built from the live catalogue rather than a hardcoded table, so it cannot
 * drift out of date when a product changes. §22 requires inches alongside
 * centimetres for US and UK customers.
 */

export const metadata: Metadata = {
  title: 'Size guide',
  description:
    'Every bag type with real dimensions in centimetres and inches, how we measure them, and what actually fits inside.',
  alternates: { canonical: '/size-guide' },
};

const cm = (value: number) => `${value} cm`;
const inches = (value: number) => `${(value / 2.54).toFixed(1)}"`;

export default async function SizeGuidePage() {
  const products = await db.product.findMany({
    where: { status: 'ACTIVE', publishedAt: { not: null } },
    select: {
      slug: true,
      nameEn: true,
      bagType: true,
      lengthCm: true,
      widthCm: true,
      heightCm: true,
      strapDropCm: true,
      weightGrams: true,
      capacityNoteEn: true,
    },
    orderBy: [{ bagType: 'asc' }, { nameEn: 'asc' }],
  });

  return (
    <ProsePage
      title="Size guide"
      intro="Real measurements from the actual bags, not rounded-up marketing numbers."
      crumbs={[{ label: 'Size guide' }]}
    >
      <ProseSection heading="How we measure">
        <P>
          Every measurement on this site is taken the same way, with the bag
          empty and sitting flat:
        </P>
        <UL>
          <li>
            <strong>Length</strong> — widest point across the front, left to
            right.
          </li>
          <li>
            <strong>Width</strong> — top of the bag to the bottom, not including
            handles.
          </li>
          <li>
            <strong>Height</strong> — the depth front to back, at the base.
          </li>
          <li>
            <strong>Strap drop</strong> — from the top of the strap to the top
            of the bag. Double it and add the bag&rsquo;s own width to picture
            roughly where it will sit on you.
          </li>
        </UL>
        <P>
          Because everything is cut by hand, expect these to be accurate to
          about half a centimetre either way.
        </P>
      </ProseSection>

      <ProseSection heading="Every bag, compared">
        {/* Wide table scrolls in its own container so the page never scrolls
            sideways at 320px (§20, §23.2). */}
        <div className="border-line -mx-4 overflow-x-auto px-4 sm:mx-0 sm:rounded-md sm:border sm:px-0">
          <table className="w-full min-w-[44rem] border-collapse text-sm">
            <caption className="sr-only">
              All bags with dimensions in centimetres and inches, strap drop,
              weight, and what fits inside
            </caption>
            <thead>
              <tr className="border-line border-b text-left">
                <th scope="col" className="p-3 font-semibold">Bag</th>
                <th scope="col" className="p-3 font-semibold">Type</th>
                <th scope="col" className="p-3 font-semibold">L × W × H</th>
                <th scope="col" className="p-3 font-semibold">Strap drop</th>
                <th scope="col" className="p-3 font-semibold">Weight</th>
                <th scope="col" className="p-3 font-semibold">Fits</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.slug} className="border-line border-b last:border-0">
                  <th scope="row" className="p-3 text-left align-top font-medium">
                    <Link
                      href={`/product/${product.slug}`}
                      className="hover:underline"
                    >
                      {product.nameEn}
                    </Link>
                  </th>
                  <td className="text-forest-soft p-3 align-top">
                    {BAG_TYPE_LABELS[product.bagType]}
                  </td>
                  <td className="tabular p-3 align-top whitespace-nowrap">
                    {cm(product.lengthCm)} × {cm(product.widthCm)} ×{' '}
                    {cm(product.heightCm)}
                    <span className="text-muted block text-xs">
                      {inches(product.lengthCm)} × {inches(product.widthCm)} ×{' '}
                      {inches(product.heightCm)}
                    </span>
                  </td>
                  <td className="tabular p-3 align-top whitespace-nowrap">
                    {product.strapDropCm ? cm(product.strapDropCm) : '—'}
                  </td>
                  <td className="tabular p-3 align-top whitespace-nowrap">
                    {product.weightGrams} g
                  </td>
                  <td className="text-forest-soft p-3 align-top">
                    {product.capacityNoteEn}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ProseSection>

      <ProseSection heading="Rough guide by size">
        <UL>
          <li>
            <strong>Small</strong> — a phone, cards, keys, and not much else.
            Crossbodies and clutches.
          </li>
          <li>
            <strong>Medium</strong> — the everyday size. A tablet or a
            paperback, a purse, sunglasses. Side bags and handbags.
          </li>
          <li>
            <strong>Large</strong> — a laptop, A4 documents, a water bottle, and
            room left over. Totes, shopping bags, and laptop bags.
          </li>
        </UL>
      </ProseSection>

      <ProseSection heading="Still not sure?">
        <P>
          Measure something you already carry and compare it against the table.
          If it is close, call or{' '}
          <Link href="/contact" className="text-jute-deep underline underline-offset-4">
            message us
          </Link>{' '}
          — we can put a tape measure on the actual bag and tell you.
        </P>
      </ProseSection>
    </ProsePage>
  );
}
