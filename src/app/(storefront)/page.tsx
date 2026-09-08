import Link from 'next/link';
import { Hand, Leaf, Globe, RotateCcw } from 'lucide-react';
import { buttonClasses } from '@/components/ui/button';
import { ProductGrid } from '@/components/commerce/product-grid';
import { getFeaturedProducts } from '@/lib/catalog';
import { getCurrency } from '@/lib/currency';
import { siteConfig, real } from '@/lib/site-config';

/**
 * Homepage — plan §6.1.
 *
 * Section order is exactly §6.1: announcement → header → hero → category
 * entry → featured products → maker strip → why these bags → reviews → how a
 * bag is made → social → newsletter → footer.
 *
 * §6.1: NO carousel hero — carousels measurably reduce clicks and hurt LCP.
 * One photograph, one headline, one primary CTA, one secondary text link.
 *
 * Reviews (§6.1.8) and the social strip (§6.1.10) are deliberately absent:
 * there are no real reviews yet, and §14.3 forbids inventing them.
 */

const categories = [
  { href: '/shop/jute', label: 'Jute', blurb: 'Natural fibre, light, and made to be used every day.' },
  { href: '/shop/leather', label: 'Leather', blurb: 'Full-grain hide that gets better the longer you carry it.' },
  { href: '/shop/mixed', label: 'Jute + leather', blurb: 'A jute body with leather straps and trim.' },
  { href: '/collections/under-2000-taka', label: 'Under ৳2,000', blurb: 'Handmade does not have to be expensive.' },
] as const;

// §6.1.7 — four short value points, one line each.
const valuePoints = [
  { Icon: Hand, label: 'Handmade by one person' },
  { Icon: Leaf, label: 'Natural jute & full-grain leather' },
  { Icon: Globe, label: 'Ships worldwide' },
  { Icon: RotateCcw, label: `${siteConfig.promises.returnWindowDays}-day easy return` },
] as const;

// §6.1.9 — this genuinely is a sequence, so numbering is appropriate here.
const processSteps = [
  { step: 'Material', detail: 'Choosing the hide or the jute weave, and cutting around its flaws.' },
  { step: 'Cutting', detail: 'Every panel cut by hand against a pattern, not stamped out.' },
  { step: 'Stitching', detail: 'Seams stitched and edges finished, the slowest part of the work.' },
  { step: 'Finishing', detail: 'Hardware set, edges burnished, and the bag checked over before it ships.' },
] as const;

export default async function HomePage() {
  const [featured, currency] = await Promise.all([
    getFeaturedProducts(8),
    getCurrency(),
  ]);

  const makerName = real(siteConfig.maker.name, 'one maker');
  const makerLocation = real(siteConfig.maker.location);

  return (
    <>
      {/* ------------------------------------------------------------------
          Hero (§6.1.3). The photograph is the LCP element — once real
          photography exists (CONTEXT.md Q6) it goes here as a preloaded,
          eagerly-loaded AVIF/WebP with explicit dimensions (§19). §28 forbids
          stock imagery, so there is no placeholder photo: a typographic hero
          on the brand's forest ground instead.
         ------------------------------------------------------------------ */}
      <section className="on-forest bg-forest text-paper">
        <div className="mx-auto grid max-w-(--container-page) gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            {/* Max 8 words (§6.1.3) */}
            <h1 className="font-display text-2xl leading-tight font-semibold text-balance md:text-3xl">
              Every bag made by one pair of hands
            </h1>
            <p className="text-paper/85 prose-measure mt-5 text-base md:text-md">
              Jute and leather bags cut, stitched, and finished in a small
              workshop in Bangladesh — no factory, no shortcuts, and no two
              bags exactly alike.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              {/* The single primary action on this screen (§2.3). A real
                  <a href> because it navigates — §20. */}
              <Link href="/shop" className={buttonClasses('primary', 'lg')}>
                Shop the bags
              </Link>
              <Link
                href="/about"
                className="text-paper text-sm underline underline-offset-4 hover:no-underline"
              >
                Meet the maker
              </Link>
            </div>
          </div>

          <div
            className="border-forest-soft bg-forest-soft/40 flex aspect-4/3 items-center justify-center rounded-lg border border-dashed"
            role="img"
            aria-label="Hero photograph pending"
          >
            <p className="text-paper/60 max-w-56 p-6 text-center text-xs">
              Hero photograph goes here — CONTEXT.md Q6. No stock imagery (§28).
            </p>
          </div>
        </div>
      </section>

      {/* Category entry (§6.1.4) */}
      <section className="mx-auto max-w-(--container-page) px-4 py-16 md:py-20">
        <h2 className="font-display text-lg font-semibold md:text-xl">
          Browse by material
        </h2>
        <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categories.map((category) => (
            <li key={category.href}>
              <Link
                href={category.href}
                className="border-line bg-paper-sunk hover:border-jute flex h-full flex-col justify-between rounded-md border p-5 transition-colors duration-150"
              >
                <span className="font-display text-md font-semibold">
                  {category.label}
                </span>
                <span className="text-muted mt-2 text-sm">{category.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured products (§6.1.5) — 4–8 items, real products, real prices */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-(--container-page) px-4 pb-16 md:pb-20">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-display text-lg font-semibold md:text-xl">
              Featured bags
            </h2>
            <Link
              href="/shop"
              className="text-jute-deep text-sm underline underline-offset-4 hover:no-underline"
            >
              See all {featured.length >= 8 ? 'bags' : ''}
            </Link>
          </div>
          <ProductGrid
            products={featured}
            currency={currency}
            locale="en"
            className="mt-8"
          />
        </section>
      )}

      {/* The maker strip (§6.1.6) — "give it real space" */}
      <section className="bg-paper-sunk">
        <div className="mx-auto grid max-w-(--container-page) gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-20">
          <div
            className="border-line bg-paper flex aspect-4/3 items-center justify-center rounded-lg border border-dashed"
            role="img"
            aria-label="Photograph of the maker at work, pending"
          >
            <p className="text-muted max-w-56 p-6 text-center text-xs">
              Photograph of {makerName} at work — CONTEXT.md Q6.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold md:text-xl">
              Meet {makerName}
            </h2>
            {/* §1.4 — plain, warm, first-person, and specific rather than
                superlative. Three years is stated as the fact it is; §14.5
                rules out implying more heritage than actually exists. */}
            <p className="prose-measure text-forest-soft mt-4">
              {makerName} has been making bags by hand for{' '}
              {siteConfig.maker.yearsOfExperience} years
              {makerLocation ? `, in a small workshop in ${makerLocation}` : ''}.
              Every bag on this site is cut, stitched, and finished by him.
              Nothing is outsourced and nothing is mass-produced, which is why
              stock is limited and why no two bags come out quite the same.
            </p>
            <p className="mt-6">
              <Link
                href="/about"
                className="text-jute-deep text-sm underline underline-offset-4 hover:no-underline"
              >
                Read his story
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Why these bags (§6.1.7) */}
      <section className="mx-auto max-w-(--container-page) px-4 py-16 md:py-20">
        <h2 className="sr-only">Why these bags</h2>
        <ul className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {valuePoints.map(({ Icon, label }) => (
            <li key={label} className="flex flex-col gap-3">
              <Icon className="text-jute-deep size-6" aria-hidden="true" />
              <span className="text-sm font-medium">{label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* How a bag is made (§6.1.9) — a genuine sequence, so numbered */}
      <section className="border-line border-t">
        <div className="mx-auto max-w-(--container-page) px-4 py-16 md:py-20">
          <h2 className="font-display text-lg font-semibold md:text-xl">
            How a bag is made
          </h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((item, i) => (
              <li key={item.step}>
                <span className="text-jute tabular font-display text-lg font-semibold">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-1 text-base font-medium">{item.step}</h3>
                <p className="text-muted mt-2 text-sm">{item.detail}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8">
            <Link
              href="/about/process"
              className="text-jute-deep text-sm underline underline-offset-4 hover:no-underline"
            >
              See the whole process
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
