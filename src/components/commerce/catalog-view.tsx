import Link from 'next/link';
import { Material, BagType } from '@prisma/client';
import {
  listProducts,
  getFacetCounts,
  isSortKey,
  type CatalogFilters as Filters,
  type SortKey,
} from '@/lib/catalog';
import { getCurrency } from '@/lib/currency';
import { ProductGrid, EmptyGrid } from './product-grid';
import {
  CatalogFilters,
  AppliedFilterChips,
  SortControl,
  type ActiveFilters,
} from './catalog-filters';
import type { Locale } from '@/lib/i18n';

/**
 * Shared catalog listing — plan §6.2.
 *
 * Used by /shop and every category page so the filtering, sorting, empty
 * state, and pagination behave identically everywhere.
 */

export type SearchParams = Record<string, string | string[] | undefined>;

const PAGE_SIZE = 12;

function asArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function parseEnum<T extends string>(
  values: string[],
  valid: readonly T[],
): T[] {
  const upper = values.map((v) => v.toUpperCase());
  return valid.filter((v) => upper.includes(v));
}

export function parseSearchParams(searchParams: SearchParams): {
  params: URLSearchParams;
  active: ActiveFilters;
  page: number;
} {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    asArray(value).forEach((v) => params.append(key, v));
  }

  const sortRaw = asArray(searchParams.sort)[0];
  const sort: SortKey = isSortKey(sortRaw) ? sortRaw : 'newest';

  const pageRaw = Number(asArray(searchParams.page)[0] ?? '1');
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  return {
    params,
    page,
    active: {
      material: parseEnum(asArray(searchParams.material), Object.values(Material)),
      bagType: parseEnum(asArray(searchParams.type), Object.values(BagType)),
      inStockOnly: asArray(searchParams.in_stock)[0] === '1',
      sort,
    },
  };
}

interface Props {
  /** Page path without query string, e.g. "/shop" or "/shop/jute". */
  basePath: string;
  searchParams: SearchParams;
  locale?: Locale;
  /** Fixed on a category page — merged with, and overriding, URL filters. */
  fixedFilters?: Partial<Filters>;
  lockedMaterial?: boolean;
}

export async function CatalogView({
  basePath,
  searchParams,
  locale = 'en',
  fixedFilters = {},
  lockedMaterial = false,
}: Props) {
  const { params, active, page } = parseSearchParams(searchParams);
  const currency = await getCurrency();

  const filters: Filters = {
    material: active.material.length ? active.material : undefined,
    bagType: active.bagType.length ? active.bagType : undefined,
    inStockOnly: active.inStockOnly || undefined,
    sort: active.sort,
    ...fixedFilters,
  };

  const [result, facets] = await Promise.all([
    listProducts(filters, currency, page, PAGE_SIZE),
    getFacetCounts(),
  ]);

  // Suggestions for the empty state — the newest products, unfiltered (§6.2)
  const suggestions =
    result.products.length === 0
      ? (await listProducts({ ...fixedFilters, sort: 'newest' }, currency, 1, 4)).products
      : [];

  return (
    <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-14">
      {/* Filter sidebar, desktop left (§6.2). On mobile it sits above the
          grid as a collapsed <details>, which needs no JavaScript. */}
      <aside>
        <details className="lg:hidden" name="catalog-panel">
          <summary className="border-line-strong flex min-h-11 cursor-pointer items-center justify-between rounded-md border px-4 text-sm font-medium">
            Filter &amp; sort
          </summary>
          <div className="mt-6 space-y-8">
            <SortControl basePath={basePath} params={params} active={active.sort} />
            <CatalogFilters
              basePath={basePath}
              params={params}
              active={active}
              facets={facets}
              lockedMaterial={lockedMaterial}
            />
          </div>
        </details>

        <div className="hidden lg:block">
          <h2 className="sr-only">Filters</h2>
          <CatalogFilters
            basePath={basePath}
            params={params}
            active={active}
            facets={facets}
            lockedMaterial={lockedMaterial}
          />
        </div>
      </aside>

      <div>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-muted text-sm" aria-live="polite">
            {result.total} {result.total === 1 ? 'bag' : 'bags'}
          </p>
          <div className="hidden lg:block">
            <SortControl basePath={basePath} params={params} active={active.sort} />
          </div>
        </div>

        <div className="mb-8">
          <AppliedFilterChips basePath={basePath} params={params} active={active} />
        </div>

        {result.products.length === 0 ? (
          <EmptyGrid
            suggestions={suggestions}
            currency={currency}
            locale={locale}
            clearHref={basePath}
          />
        ) : (
          <>
            <ProductGrid
              products={result.products}
              currency={currency}
              locale={locale}
              priorityCount={2}
            />
            <Pagination
              basePath={basePath}
              params={params}
              page={result.page}
              pageCount={result.pageCount}
            />
          </>
        )}
      </div>
    </div>
  );
}

/**
 * §6.2 — real paginated URLs for crawlers. The plan prefers a "Load more"
 * button over infinite scroll (infinite scroll breaks the footer and the back
 * button) and asks for real paginated links underneath regardless; these
 * links are that foundation.
 */
function Pagination({
  basePath,
  params,
  page,
  pageCount,
}: {
  basePath: string;
  params: URLSearchParams;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  const href = (n: number) => {
    const next = new URLSearchParams(params);
    if (n === 1) next.delete('page');
    else next.set('page', String(n));
    const qs = next.toString();
    return `${basePath}${qs ? `?${qs}` : ''}`;
  };

  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-2">
      {page > 1 && (
        <Link
          href={href(page - 1)}
          rel="prev"
          className="border-line-strong hover:border-jute-deep inline-flex min-h-11 items-center rounded-md border px-4 text-sm"
        >
          Previous
        </Link>
      )}

      <ol className="flex items-center gap-1">
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            <Link
              href={href(n)}
              aria-current={n === page ? 'page' : undefined}
              className={
                n === page
                  ? 'bg-forest text-paper tabular inline-flex size-11 items-center justify-center rounded-md text-sm'
                  : 'hover:bg-paper-sunk tabular inline-flex size-11 items-center justify-center rounded-md text-sm'
              }
            >
              {n}
              {n === page && <span className="sr-only"> (current page)</span>}
            </Link>
          </li>
        ))}
      </ol>

      {page < pageCount && (
        <Link
          href={href(page + 1)}
          rel="next"
          className="border-line-strong hover:border-jute-deep inline-flex min-h-11 items-center rounded-md border px-4 text-sm"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
