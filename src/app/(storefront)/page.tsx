import Link from 'next/link';
import Image from 'next/image';
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

/**
 * Categories reflect what the workshop actually makes (CONTEXT.md D9).
 * There is no leather-only line, so there is no leather-only category —
 * a category that leads to an empty grid is worse than one that is absent.
 */
const categories = [
  { href: '/shop/canvas', label: 'Canvas backpacks', blurb: 'Hard-wearing cotton canvas, built for a school run or a commute.' },
  { href: '/shop/jute', label: 'Jute', blurb: 'Light, strong, and grown here in Bangladesh.' },
  { href: '/shop/mixed', label: 'Jute + leather', blurb: 'A jute body with leather trim, corners and handles.' },
  { href: '/wholesale', label: 'Bulk orders', blurb: 'Branded bags in quantity, for schools, companies and programmes.' },
] as const;

// §6.1.7 — four short value points, one line each.
const valuePoints = [
  { Icon: Hand, label: 'Made in our own workshop' },
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

  const makerName = real(siteConfig.maker.name, 'our founder');
  const makerLocation = real(siteConfig.maker.location);

  return (
    <>
      {/* ------------------------------------------------------------------
          Hero (§6.1.3). The photograph is the LCP element, so it is priority
          and never lazy-loaded, with explicit dimensions to prevent layout
          shift (§19). Our own photograph of our own bags — §28 forbids stock
          imagery and this is the page where it would matter most.
         ------------------------------------------------------------------ */}
      <section className="on-forest bg-forest text-paper">
        <div className="mx-auto grid max-w-(--container-page) gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            {/* Max 8 words (§6.1.3) */}
            <h1 className="font-display text-2xl leading-tight font-semibold text-balance md:text-3xl">
              Jute and canvas bags, made in Dhaka
            </h1>
            <p className="text-paper/85 prose-measure mt-5 text-base md:text-md">
              Cut, stitched, and finished in our own workshop in Dhaka by a
              team of ten to twenty people — including bulk orders for schools,
              companies, and development organisations.
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

          <Image
            src="/finished products.jpeg"
            alt="Finished jute briefcases with dark leather trim and handles, arranged against a white backdrop"
            width={1600}
            height={1200}
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="aspect-4/3 rounded-lg object-cover"
          />
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
          <Image
            src="/Employees at work.jpeg"
            alt="Workers at rows of blue industrial sewing machines assembling bags in the workshop"
            width={1280}
            height={960}
            loading="lazy"
            sizes="(min-width: 768px) 50vw, 100vw"
            className="aspect-4/3 rounded-lg object-cover"
          />
          <div>
            <h2 className="font-display text-lg font-semibold md:text-xl">
              Meet {makerName}
            </h2>
            {/* §1.4 — plain and specific. He founded and runs the workshop;
                he does not personally make every bag, and saying otherwise
                would be contradicted by our own photograph directly above
                (§14.5, CONTEXT.md D9). */}
            <p className="prose-measure text-forest-soft mt-4">
              {makerName} founded this workshop{' '}
              {siteConfig.maker.yearsOfExperience} years ago and still runs it
              {makerLocation ? `, in ${makerLocation}` : ''}. A team of ten to
              twenty people cuts and stitches here, on our own machines, in our
              own premises — nothing is subcontracted out.
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
