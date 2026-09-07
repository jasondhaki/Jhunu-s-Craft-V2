import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { Currency } from '@/lib/money';
import type { Locale } from '@/lib/i18n';
import type { ProductCardData } from '@/lib/catalog';
import { ProductCard } from './product-card';
import { buttonClasses } from '@/components/ui/button';

/**
 * Product grid — plan §6.2.
 *
 * "Grid: 4 columns xl, 3 columns lg, 2 columns mobile. Two columns on mobile
 * beats one — more products visible, less scrolling."
 */

interface Props {
  products: ProductCardData[];
  currency: Currency;
  locale: Locale;
  /** Mark the first row as priority when this grid is above the fold. */
  priorityCount?: number;
  className?: string;
}

export function ProductGrid({
  products,
  currency,
  locale,
  priorityCount = 0,
  className,
}: Props) {
  return (
    <ul
      className={cn(
        'grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 xl:grid-cols-4',
        className,
      )}
    >
      {products.map((product, i) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            currency={currency}
            locale={locale}
            priority={i < priorityCount}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * §6.2 — "Empty state: 'No bags match these filters' + a 'Clear filters'
 * button + 4 suggested products. Never a blank screen."
 */
export function EmptyGrid({
  suggestions,
  currency,
  locale,
  clearHref,
}: {
  suggestions: ProductCardData[];
  currency: Currency;
  locale: Locale;
  clearHref: string;
}) {
  return (
    <div>
      <div className="border-line rounded-md border border-dashed px-6 py-12 text-center">
        <p className="font-display text-md font-semibold">
          No bags match these filters
        </p>
        <p className="text-muted mt-2 text-sm">
          Try removing one of them, or browse everything he makes.
        </p>
        <Link
          href={clearHref}
          className={cn(buttonClasses('secondary', 'md'), 'mt-6')}
        >
          Clear filters
        </Link>
      </div>

      {suggestions.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-lg font-semibold">
            You might like these
          </h2>
          <ProductGrid
            products={suggestions}
            currency={currency}
            locale={locale}
            className="mt-8"
          />
        </section>
      )}
    </div>
  );
}
