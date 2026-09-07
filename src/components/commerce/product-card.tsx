import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { formatMoney, type Currency } from '@/lib/money';
import { t, type Locale, langAttr } from '@/lib/i18n';
import {
  type ProductCardData,
  priceDisplay,
  stockState,
  isNew,
} from '@/lib/catalog';

/**
 * Product card — plan §6.2.
 *
 * Contents per §6.2: image (second image on hover, desktop only), name,
 * price with compare-at, colour swatches, badge, wishlist heart.
 *
 * §14.5 — no dark patterns. The "Only N left" badge shows the real count and
 * appears only when stock is genuinely at or below the threshold.
 */

interface Props {
  product: ProductCardData;
  currency: Currency;
  locale: Locale;
  /** The first card in a grid is often the LCP element — it must not lazy-load. */
  priority?: boolean;
  className?: string;
}

export function ProductCard({
  product,
  currency,
  locale,
  priority = false,
  className,
}: Props) {
  const name = t({ en: product.nameEn, bn: product.nameBn }, locale);
  const price = priceDisplay(product, currency);
  const stock = stockState(product);

  const [primary, hover] = product.images;
  const alt = primary
    ? t({ en: primary.altTextEn, bn: primary.altTextBn }, locale)
    : name;

  // Distinct colours, for the swatch row (§6.2)
  const swatches = Array.from(
    new Map(product.variants.map((v) => [v.colorHex, v])).values(),
  );

  const badge = getBadge(stock, isNew(product), price.savings !== null);

  return (
    <article className={cn('group relative flex flex-col', className)}>
      <div className="bg-paper-sunk relative aspect-square overflow-hidden">
        {/* Product images keep square corners — §2.5 */}
        {primary ? (
          <>
            <Image
              src={primary.url}
              alt={alt}
              fill
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              priority={priority}
              loading={priority ? undefined : 'lazy'}
              placeholder={primary.blurPlaceholder ? 'blur' : undefined}
              blurDataURL={primary.blurPlaceholder ?? undefined}
              className={cn(
                'object-cover transition-opacity duration-250',
                hover && 'md:group-hover:opacity-0',
              )}
            />
            {/* Second image on hover, desktop only (§6.2). Hidden from
                assistive tech — it is the same product. */}
            {hover && (
              <Image
                src={hover.url}
                alt=""
                aria-hidden="true"
                fill
                sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                loading="lazy"
                className="hidden object-cover opacity-0 transition-opacity duration-250 md:block md:group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="text-muted flex h-full items-center justify-center text-xs">
            No photograph yet
          </div>
        )}

        {badge && (
          <span
            className={cn(
              'absolute top-3 left-3 rounded-sm px-2 py-1 text-xs font-medium',
              badge.tone === 'clay' && 'bg-clay text-white',
              badge.tone === 'forest' && 'bg-forest text-paper',
              badge.tone === 'leaf' && 'bg-leaf text-white',
            )}
          >
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <h3 className="text-base font-medium">
          {/* The whole card is clickable via this stretched link, but the
              accessible name stays the product name — §20. */}
          <Link
            href={`/product/${product.slug}`}
            lang={langAttr({ en: product.nameEn, bn: product.nameBn }, locale)}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {name}
          </Link>
        </h3>

        <p className="tabular mt-1 flex flex-wrap items-baseline gap-2">
          <span className="text-jute-deep font-medium">
            {price.varies && (
              <span className="text-muted mr-1 text-sm font-normal">from</span>
            )}
            {formatMoney(price.amount, currency, { locale })}
          </span>
          {price.compareAt !== null && (
            <>
              <span className="text-muted text-sm line-through">
                {formatMoney(price.compareAt, currency, { locale })}
              </span>
              {/* §2.3 — never colour alone. The word "Sale" carries it too. */}
              <span className="text-clay text-xs font-medium">Sale</span>
            </>
          )}
        </p>

        {swatches.length > 1 && (
          <ul className="mt-3 flex items-center gap-1.5" aria-label="Available colours">
            {swatches.map((v) => (
              <li
                key={v.colorHex}
                className="border-line size-4 rounded-full border"
                style={{ backgroundColor: v.colorHex }}
                title={t({ en: v.colorNameEn, bn: v.colorNameBn }, locale)}
              >
                <span className="sr-only">
                  {t({ en: v.colorNameEn, bn: v.colorNameBn }, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

function getBadge(
  stock: ReturnType<typeof stockState>,
  fresh: boolean,
  onSale: boolean,
): { label: string; tone: 'clay' | 'forest' | 'leaf' } | null {
  // Most urgent state wins; only one badge is ever shown.
  switch (stock.kind) {
    case 'sold_out':
      return { label: 'Sold out', tone: 'forest' };
    case 'low_stock':
      return { label: `Only ${stock.total} left`, tone: 'clay' };
    case 'made_to_order':
      return { label: 'Made to order', tone: 'forest' };
    default:
      break;
  }
  if (onSale) return { label: 'Sale', tone: 'clay' };
  if (fresh) return { label: 'New', tone: 'leaf' };
  return null;
}
