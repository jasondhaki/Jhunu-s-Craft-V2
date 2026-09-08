import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Hand, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import {
  getProductBySlug,
  getAllProductSlugs,
  getRelatedProducts,
  stockState,
} from '@/lib/catalog';
import { getCurrency } from '@/lib/currency';
import { resolvePrice, toMajor, formatMoney } from '@/lib/money';
import { siteConfig, real } from '@/lib/site-config';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ProductGrid } from '@/components/commerce/product-grid';
import { PurchasePanel } from '@/components/commerce/purchase-panel';
import { MATERIAL_LABELS } from '@/components/commerce/catalog-filters';
import { JsonLd } from '@/components/json-ld';
import { getProductReviews, getRatingSummary } from '@/lib/reviews';
import { ProductReviews, Stars } from '@/components/commerce/product-reviews';

/**
 * Product detail page — plan §6.3, "the most important page".
 *
 * Layout: two columns desktop (gallery left 55%, info right 45%), stacked on
 * mobile. Info column order follows §6.3 exactly.
 */

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const image = product.images[0];

  return {
    // §17.3 — "[Product Name] — Handmade [Material] Bag | [Brand]", under 60
    title: product.metaTitle ?? product.nameEn,
    description: product.metaDescription ?? product.shortDescriptionEn,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: 'website',
      title: product.nameEn,
      description: product.shortDescriptionEn,
      images: image ? [{ url: image.url, alt: image.altTextEn }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, currency] = await Promise.all([
    getProductBySlug(slug),
    getCurrency(),
  ]);

  if (!product) notFound();

  const [related, reviews, ratingSummary] = await Promise.all([
    getRelatedProducts(product),
    getProductReviews(product.id),
    getRatingSummary(product.id),
  ]);
  const stock = stockState(product);

  const price = resolvePrice(currency, product, product.variants[0] ?? null);
  const compareAt =
    currency === 'BDT' ? product.compareAtPriceBdt : product.compareAtPriceUsd;

  const makerName = real(siteConfig.maker.name);
  const makerLocation = real(siteConfig.maker.location);

  const categoryHref = `/shop/${product.material.toLowerCase()}`;

  /*
   * §6.3 / §17.2 structured data — Product + Offer, plus aggregateRating
   * ONLY when approved reviews actually exist.
   *
   * Emitting an aggregateRating with no reviews behind it is both a Google
   * structured-data violation and precisely the fabricated social proof
   * §14.3 forbids, so the field is added conditionally below rather than
   * defaulted to zero.
   */
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nameEn,
    description: product.shortDescriptionEn,
    sku: product.variants[0]?.sku,
    image: product.images.map((i) => `${siteConfig.url}${i.url}`),
    brand: { '@type': 'Brand', name: siteConfig.name },
    material: MATERIAL_LABELS[product.material],
    weight: { '@type': 'QuantitativeValue', value: product.weightGrams, unitCode: 'GRM' },
    offers: {
      '@type': 'Offer',
      url: `${siteConfig.url}/product/${product.slug}`,
      priceCurrency: currency,
      price: toMajor(price, currency).toFixed(2),
      availability:
        stock.kind === 'sold_out'
          ? 'https://schema.org/OutOfStock'
          : stock.kind === 'made_to_order'
            ? 'https://schema.org/PreOrder'
            : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  if (ratingSummary) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ratingSummary.average.toFixed(1),
      reviewCount: ratingSummary.count,
      bestRating: 5,
      worstRating: 1,
    };
    jsonLd.review = reviews.slice(0, 5).map((review) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: review.authorName },
      datePublished: review.createdAt.toISOString().slice(0, 10),
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
      ...(review.title ? { name: review.title } : {}),
      reviewBody: review.body,
    }));
  }

  const accordions = [
    {
      title: 'Details & dimensions',
      defaultOpen: true,
      body: (
        <dl className="space-y-2 text-sm">
          <Row label="Dimensions">
            {product.lengthCm} × {product.widthCm} × {product.heightCm} cm
            <span className="text-muted">
              {' '}
              ({toInches(product.lengthCm)} × {toInches(product.widthCm)} ×{' '}
              {toInches(product.heightCm)} in)
            </span>
          </Row>
          {product.strapDropCm !== null && (
            <Row label="Strap drop">{product.strapDropCm} cm</Row>
          )}
          <Row label="Weight">{product.weightGrams} g</Row>
          <Row label="Fits">{product.capacityNoteEn}</Row>
        </dl>
      ),
    },
    {
      title: 'Materials',
      body: <p className="text-sm">{product.materialsDetailEn}</p>,
    },
    {
      title: 'Care',
      body: <p className="text-sm">{product.careInstructionsEn}</p>,
    },
    {
      title: 'Shipping & returns',
      body: (
        <div className="space-y-2 text-sm">
          <p>
            Dispatched in {siteConfig.promises.dispatchDays}. Inside Dhaka 1–2
            days, elsewhere in Bangladesh 2–5 days. Worldwide by DHL, 7–14 days.
          </p>
          <p>
            Free delivery inside Dhaka on orders over{' '}
            {formatMoney(siteConfig.freeShippingThreshold.BDT, 'BDT')}.
          </p>
          <p>
            {siteConfig.promises.returnWindowDays}-day returns if it is unused
            and in its original packaging.
          </p>
          <p className="flex gap-4 pt-1">
            <Link href="/shipping" className="text-jute-deep underline underline-offset-4">
              Shipping
            </Link>
            <Link href="/returns" className="text-jute-deep underline underline-offset-4">
              Returns
            </Link>
          </p>
        </div>
      ),
    },
    {
      // §6.3.12 — "This single paragraph prevents a meaningful share of returns."
      title: 'About natural variation',
      body: (
        <p className="text-sm">
          Every bag is cut and stitched by hand, so no two are identical. Expect
          small differences in weave, grain, and tone between one bag and the
          next — and between the bag you receive and the photographs on this
          page. That is the nature of handmade work, not a fault, and it is not
          something we would replace a bag over.
        </p>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-(--container-page) px-4 py-8 md:py-12">
      <Breadcrumbs
        items={[
          { label: 'Shop', href: '/shop' },
          { label: MATERIAL_LABELS[product.material], href: categoryHref },
          { label: product.nameEn },
        ]}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-[55fr_45fr] lg:gap-16">
        {/* ---------------------------------------------------------------
            Gallery (§6.3). Thumbnail rail + main image. Zoom/lightbox is a
            Phase 5 enhancement; the semantics and sizing are correct now.
           --------------------------------------------------------------- */}
        <div>
          <ul className="space-y-3">
            {product.images.slice(0, 1).map((image) => (
              <li key={image.id} className="bg-paper-sunk relative aspect-square">
                <Image
                  src={image.url}
                  alt={image.altTextEn}
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  priority
                  className="object-cover"
                />
              </li>
            ))}
          </ul>

          {product.images.length > 1 && (
            <ul className="mt-3 grid grid-cols-4 gap-3">
              {product.images.slice(1).map((image) => (
                <li key={image.id} className="bg-paper-sunk relative aspect-square">
                  <Image
                    src={image.url}
                    alt={image.altTextEn}
                    fill
                    sizes="(min-width: 1024px) 14vw, 25vw"
                    loading="lazy"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ---------------------------------------------------------------
            Info column — order per §6.3
           --------------------------------------------------------------- */}
        <div>
          <h1 className="font-display text-xl font-semibold text-balance md:text-2xl">
            {product.nameEn}
          </h1>

          {/* §6.3.3 — rating jumps to the reviews section. Rendered only
              when real reviews exist; §14.3 forbids inventing them. */}
          {ratingSummary && (
            <a
              href="#reviews"
              className="mt-3 inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline"
            >
              <Stars rating={ratingSummary.average} />
              <span className="text-muted">
                {ratingSummary.count}{' '}
                {ratingSummary.count === 1 ? 'review' : 'reviews'}
              </span>
            </a>
          )}

          <p className="prose-measure text-forest-soft mt-4">
            {product.shortDescriptionEn}
          </p>

          <div className="mt-8">
            <PurchasePanel
              productId={product.id}
              currency={currency}
              basePriceBdt={product.basePriceBdt}
              basePriceUsd={product.basePriceUsd}
              compareAtPrice={compareAt}
              madeToOrder={product.madeToOrder}
              productionDays={product.productionDays}
              variants={product.variants.map((v) => ({
                id: v.id,
                sku: v.sku,
                colorName: v.colorNameEn,
                colorHex: v.colorHex,
                sizeLabel: v.sizeLabel,
                stockQuantity: v.stockQuantity,
                lowStockThreshold: v.lowStockThreshold,
                priceOverrideBdt: v.priceOverrideBdt,
                priceOverrideUsd: v.priceOverrideUsd,
              }))}
            />
          </div>

          {/* Trust row (§6.3.11) */}
          <ul className="border-line text-muted mt-8 grid grid-cols-2 gap-4 border-t pt-6 text-xs">
            <TrustItem Icon={Hand}>Made in our own workshop</TrustItem>
            <TrustItem Icon={Truck}>
              Free delivery in Dhaka over{' '}
              {formatMoney(siteConfig.freeShippingThreshold.BDT, 'BDT')}
            </TrustItem>
            <TrustItem Icon={RotateCcw}>
              {siteConfig.promises.returnWindowDays}-day returns
            </TrustItem>
            <TrustItem Icon={ShieldCheck}>Secure checkout</TrustItem>
          </ul>

          {/* Accordions (§6.3.12) — <details> works without JavaScript */}
          <div className="border-line mt-8 border-t">
            {accordions.map((section) => (
              <details
                key={section.title}
                open={section.defaultOpen}
                className="border-line group border-b"
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-sm font-medium">
                  {section.title}
                  <span
                    aria-hidden="true"
                    className="text-muted transition-transform duration-150 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="text-forest-soft pb-5">{section.body}</div>
              </details>
            ))}
          </div>

          {/* Maker credit (§6.3.13) */}
          {makerName && (
            <p className="text-muted mt-8 text-sm">
              Made by hand by{' '}
              <Link href="/about" className="text-jute-deep underline underline-offset-4">
                {makerName}
              </Link>
              {makerLocation ? ` in ${makerLocation}` : ''}.
            </p>
          )}
        </div>
      </div>

      {/* Reviews (§6.3.14) — renders nothing until real reviews exist. */}
      <ProductReviews summary={ratingSummary} reviews={reviews} />

      {/* You may also like (§6.3.15) */}
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-lg font-semibold md:text-xl">
            You may also like
          </h2>
          <ProductGrid
            products={related}
            currency={currency}
            locale="en"
            className="mt-8"
          />
        </section>
      )}

      {/* Nonced so our CSP does not silently drop it (§13.1). */}
      <JsonLd data={jsonLd} />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="text-muted w-28 shrink-0">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function TrustItem({
  Icon,
  children,
}: {
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2">
      <Icon className="text-jute-deep mt-0.5 size-4 shrink-0" aria-hidden={true} />
      <span>{children}</span>
    </li>
  );
}

/** §22 — centimetres with inches alongside for US/UK customers. */
function toInches(cm: number): string {
  return (cm / 2.54).toFixed(1);
}
