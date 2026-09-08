import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Material } from '@prisma/client';
import { CatalogView, type SearchParams } from '@/components/commerce/catalog-view';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import type { CatalogFilters } from '@/lib/catalog';

/**
 * Category pages — plan §3.1 and §6.2.
 *
 * Covers the material categories (/shop/jute, /shop/leather, /shop/mixed) and
 * the merchandising ones (/shop/new, /shop/bestsellers).
 *
 * §17.3: "Category pages need real intro copy (150–300 words), not just a
 * grid." Each entry below carries its own, written for the shopper first and
 * the crawler second.
 */

interface CategoryDef {
  title: string;
  h1: string;
  intro: string;
  metaDescription: string;
  filters: Partial<CatalogFilters>;
  lockedMaterial?: boolean;
}

const CATEGORIES: Record<string, CategoryDef> = {
  jute: {
    title: 'Jute bags',
    h1: 'Jute bags',
    intro:
      'Jute is called the golden fibre, and Bangladesh grows most of the world supply — so using it here is not a marketing choice, it is simply the material that is to hand. It is light, surprisingly strong for its weight, and completely biodegradable at the end of its life. These bags are woven jute, cut and stitched by hand, with cotton twill linings and solid brass hardware. They suit everyday carrying: the market, the office, the school run. Jute does not like being put away damp, so each one comes with care instructions written for the humidity here rather than copied from somewhere colder. Expect variation in weave and tone between bags — jute is a natural fibre and no two lengths of it are identical.',
    metaDescription:
      'Handmade jute bags from Bangladesh — totes, shopping bags, side bags and crossbodies, woven and hand-stitched with leather trim and brass hardware.',
    filters: { material: [Material.JUTE] },
    lockedMaterial: true,
  },
  canvas: {
    title: 'Canvas backpacks',
    h1: 'Canvas backpacks',
    intro:
      'Heavy cotton canvas, cut and stitched in our own workshop in Dhaka. These are the bags the workshop makes most of — backpacks built for a school run or a daily commute rather than a weekend away. A padded back panel and shoulder straps, a separate padded sleeve inside for a laptop or tablet, a zipped front pocket, and open side pockets for a bottle. The stress points at the strap anchors and along the base are double-stitched, because that is where a school bag gives out first. Canvas softens with use and takes colour well; over years of strong sunlight a dyed natural fibre will fade a little, which is normal rather than a fault. We make these in quantity for schools and organisations too, so if you need fifty of them in one colour, that is a conversation we have often.',
    metaDescription:
      'Cotton canvas backpacks made in Dhaka — padded back and straps, laptop sleeve, double-stitched at every stress point.',
    filters: { material: [Material.COTTON] },
    lockedMaterial: true,
  },
  leather: {
    title: 'Leather-trimmed bags',
    h1: 'Leather-trimmed bags',
    intro:
      'We do not make bags from leather alone — we use it where a bag actually takes strain. On our office bags that means the trim, the corners, the handle, and the flap strap, over a stiffened jute body. The leather is stitched through the jute rather than glued to it, which is why the handles and the flap do not pull away over time. Full-grain hide, with the outer surface left intact rather than sanded smooth and embossed with an artificial grain, so it darkens and softens with use instead of flaking. If you are looking for an all-leather bag, we are honestly not the workshop for it.',
    metaDescription:
      'Leather-trimmed jute office bags, briefcases and totes, cut and stitched in our own workshop in Dhaka.',
    filters: { material: [Material.LEATHER] },
    lockedMaterial: true,
  },
  mixed: {
    title: 'Jute and leather bags',
    h1: 'Jute + leather',
    intro:
      'The combination pieces, and quietly the most interesting things in the workshop. A jute body keeps the bag light and keeps the price sensible; leather goes exactly where a bag actually takes strain — the handles, the base corners, the strap, the flap edge. Neither material is doing the other one a favour, and each is used for what it is genuinely good at. The leather is stitched through the jute rather than glued, which takes longer and is the reason these do not come apart at the handles the way glued bags do. If you are unsure where to start, this is usually the right place.',
    metaDescription:
      'Jute and leather bags — a light jute body with full-grain leather straps, trim and base, hand-stitched together in Dhaka.',
    filters: { material: [Material.MIXED] },
    lockedMaterial: true,
  },
  new: {
    title: 'New arrivals',
    h1: 'New arrivals',
    intro:
      'The most recent bags to come out of the workshop. Between bulk orders we make our own designs in small runs rather than seasonal collections, so new pieces appear whenever a run is finished. If something here shows a low stock count, that is the real number.',
    metaDescription:
      'The newest handmade jute and leather bags from the workshop, added as they are finished.',
    filters: { sort: 'newest' },
  },
  bestsellers: {
    title: 'Best sellers',
    h1: 'Best sellers',
    intro:
      'The bags people buy most often. Ordered by how many have actually sold — not a curated pick, and not a promotion. If a bag is near the top of this list it is because it keeps being chosen.',
    metaDescription:
      'The most popular handmade jute and leather bags, ranked by how many have actually sold.',
    filters: { sort: 'best_selling' },
  },
};

export function generateStaticParams() {
  return Object.keys(CATEGORIES).map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const def = CATEGORIES[category];
  if (!def) return {};

  return {
    title: def.title,
    description: def.metaDescription,
    alternates: { canonical: `/shop/${category}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { category } = await params;
  const def = CATEGORIES[category];
  if (!def) notFound();

  const search = await searchParams;
  const basePath = `/shop/${category}`;

  return (
    <div className="mx-auto max-w-(--container-page) px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }, { label: def.title }]} />

      <header className="mt-6 mb-10">
        <h1 className="font-display text-xl font-semibold md:text-2xl">
          {def.h1}
        </h1>
        <p className="prose-measure text-forest-soft mt-4">{def.intro}</p>
      </header>

      <CatalogView
        basePath={basePath}
        searchParams={search}
        fixedFilters={def.filters}
        lockedMaterial={def.lockedMaterial}
      />
    </div>
  );
}
