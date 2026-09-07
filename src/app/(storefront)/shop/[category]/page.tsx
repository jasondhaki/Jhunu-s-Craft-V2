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
  leather: {
    title: 'Leather bags',
    h1: 'Leather bags',
    intro:
      'Full-grain buffalo leather, 1.4 mm, vegetable tanned. Full-grain means the outer surface of the hide is left intact rather than sanded down and stamped with an artificial texture, which is what makes it wear well: it darkens and softens with use instead of flaking. These are the slowest pieces to make. Panels are skived at the edges before stitching so corners sit square, seams are double-stitched at every stress point, and edges are burnished by hand rather than sealed with a coating. Several are made to order, which is why they show a lead time rather than a stock count. A leather bag bought here should outlast several cheaper ones, and it will look more like yours every year.',
    metaDescription:
      'Handmade full-grain leather bags — crossbodies, handbags, totes and office bags, cut and hand-stitched in a one-man workshop in Dhaka.',
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
      'The most recent bags to come out of the workshop. Because everything is made by one person, new pieces arrive in small numbers rather than in seasonal collections — a few at a time, whenever they are finished. If something here is showing a low stock count, that is the real number.',
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
