import type { Metadata } from 'next';
import { CatalogView, type SearchParams } from '@/components/commerce/catalog-view';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

/**
 * All products — plan §6.2.
 *
 * Above the fold: breadcrumb, H1, a 2–3 sentence category description (SEO
 * value and it helps shoppers), result count.
 */

export const metadata: Metadata = {
  title: 'All bags',
  description:
    'Every handmade jute and leather bag in the workshop — totes, handbags, crossbodies, shopping bags and more, each one cut and stitched by hand in Dhaka.',
  alternates: { canonical: '/shop' },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-(--container-page) px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: 'Shop' }]} />

      <header className="mt-6 mb-10">
        <h1 className="font-display text-xl font-semibold md:text-2xl">
          All bags
        </h1>
        {/* §6.2 / §17.3 — real intro copy, not just a grid */}
        <p className="prose-measure text-forest-soft mt-4">
          Everything currently made in the workshop, in one place. Jute for
          everyday carrying, full-grain leather for the pieces meant to last
          decades, and combinations of the two where each material does what it
          is best at. Stock is genuinely limited — each bag is made by hand, one
          at a time.
        </p>
      </header>

      <CatalogView basePath="/shop" searchParams={params} />
    </div>
  );
}
