import Link from 'next/link';
import { X } from 'lucide-react';
import { Material, BagType } from '@prisma/client';
import { cn } from '@/lib/cn';
import { SORT_OPTIONS, type SortKey } from '@/lib/catalog';

/**
 * Catalog filters — plan §6.2.
 *
 * "Filters update the URL (?material=jute&color=natural&sort=newest) so states
 * are shareable and indexable."
 *
 * Built as plain links rather than a client-side form. That means filtering
 * works with JavaScript disabled or still loading, every filter state is a
 * real crawlable URL, and there is no hydration cost — which matters on the
 * slow mobile connections §19 is written around.
 */

export const MATERIAL_LABELS: Record<Material, string> = {
  JUTE: 'Jute',
  LEATHER: 'Leather',
  COTTON: 'Cotton canvas',
  MIXED: 'Jute + leather',
};

export const BAG_TYPE_LABELS: Record<BagType, string> = {
  HANDBAG: 'Handbag',
  SIDE_BAG: 'Side bag',
  CROSSBODY: 'Crossbody',
  TOTE: 'Tote',
  SHOPPING_BAG: 'Shopping bag',
  LAPTOP_BAG: 'Laptop bag',
  CLUTCH: 'Clutch',
  BACKPACK: 'Backpack',
};

export interface ActiveFilters {
  material: Material[];
  bagType: BagType[];
  inStockOnly: boolean;
  sort: SortKey;
}

/** Rebuilds the query string with one value toggled. */
export function toggleParam(
  current: URLSearchParams,
  key: string,
  value: string,
): string {
  const next = new URLSearchParams(current);
  const values = next.getAll(key);

  next.delete(key);
  if (values.includes(value)) {
    values.filter((v) => v !== value).forEach((v) => next.append(key, v));
  } else {
    [...values, value].forEach((v) => next.append(key, v));
  }

  // Any filter change returns to page 1 — staying on page 4 of a narrower
  // result set is a classic way to land the user on an empty screen.
  next.delete('page');

  const qs = next.toString();
  return qs ? `?${qs}` : '';
}

export function setParam(
  current: URLSearchParams,
  key: string,
  value: string | null,
): string {
  const next = new URLSearchParams(current);
  if (value === null) next.delete(key);
  else next.set(key, value);
  next.delete('page');
  const qs = next.toString();
  return qs ? `?${qs}` : '';
}

interface Props {
  basePath: string;
  params: URLSearchParams;
  active: ActiveFilters;
  facets: {
    material: Record<Material, number>;
    bagType: Record<BagType, number>;
  };
  /** Material is fixed on a category page, so its group is hidden there. */
  lockedMaterial?: boolean;
}

export function CatalogFilters({
  basePath,
  params,
  active,
  facets,
  lockedMaterial = false,
}: Props) {
  return (
    <div className="space-y-8">
      {!lockedMaterial && (
        <FilterGroup title="Material">
          {(Object.keys(MATERIAL_LABELS) as Material[]).map((value) => (
            <FilterCheckbox
              key={value}
              href={`${basePath}${toggleParam(params, 'material', value.toLowerCase())}`}
              label={MATERIAL_LABELS[value]}
              count={facets.material[value] ?? 0}
              checked={active.material.includes(value)}
            />
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="Type">
        {(Object.keys(BAG_TYPE_LABELS) as BagType[])
          .filter((value) => (facets.bagType[value] ?? 0) > 0)
          .map((value) => (
            <FilterCheckbox
              key={value}
              href={`${basePath}${toggleParam(params, 'type', value.toLowerCase())}`}
              label={BAG_TYPE_LABELS[value]}
              count={facets.bagType[value] ?? 0}
              checked={active.bagType.includes(value)}
            />
          ))}
      </FilterGroup>

      <FilterGroup title="Availability">
        <FilterCheckbox
          href={`${basePath}${setParam(params, 'in_stock', active.inStockOnly ? null : '1')}`}
          label="In stock now"
          checked={active.inStockOnly}
        />
      </FilterGroup>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold">{title}</legend>
      <ul className="space-y-1">{children}</ul>
    </fieldset>
  );
}

function FilterCheckbox({
  href,
  label,
  count,
  checked,
}: {
  href: string;
  label: string;
  count?: number;
  checked: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        // A link acting as a toggle — announce its state (§20)
        role="checkbox"
        aria-checked={checked}
        scroll={false}
        className="hover:bg-paper-sunk -mx-2 flex min-h-11 items-center gap-3 rounded-sm px-2 text-sm"
      >
        <span
          aria-hidden="true"
          className={cn(
            'flex size-4 shrink-0 items-center justify-center rounded-xs border',
            checked ? 'border-jute-deep bg-jute-deep' : 'border-line-strong',
          )}
        >
          {checked && (
            <svg viewBox="0 0 12 12" className="size-3 text-white" fill="none">
              <path
                d="M2.5 6.5 5 9l4.5-5.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <span className="flex-1">{label}</span>
        {count !== undefined && (
          <span className="text-muted tabular text-xs">{count}</span>
        )}
      </Link>
    </li>
  );
}

/** §6.2 — applied filters as removable chips, plus "Clear all". */
export function AppliedFilterChips({
  basePath,
  params,
  active,
}: {
  basePath: string;
  params: URLSearchParams;
  active: ActiveFilters;
}) {
  const chips: { label: string; href: string }[] = [
    ...active.material.map((m) => ({
      label: MATERIAL_LABELS[m],
      href: `${basePath}${toggleParam(params, 'material', m.toLowerCase())}`,
    })),
    ...active.bagType.map((b) => ({
      label: BAG_TYPE_LABELS[b],
      href: `${basePath}${toggleParam(params, 'type', b.toLowerCase())}`,
    })),
  ];
  if (active.inStockOnly) {
    chips.push({
      label: 'In stock now',
      href: `${basePath}${setParam(params, 'in_stock', null)}`,
    });
  }

  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <li key={chip.label}>
          <Link
            href={chip.href}
            scroll={false}
            className="border-line bg-paper-sunk hover:border-jute-deep inline-flex items-center gap-1.5 rounded-full border py-1.5 pr-2 pl-3 text-sm"
          >
            {chip.label}
            <X className="size-3.5" aria-hidden="true" />
            <span className="sr-only">Remove filter</span>
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={basePath}
          scroll={false}
          className="text-jute-deep px-2 text-sm underline underline-offset-4 hover:no-underline"
        >
          Clear all
        </Link>
      </li>
    </ul>
  );
}

/** §4.4 sort control. A real <select> inside a no-JS form. */
export function SortControl({
  basePath,
  params,
  active,
}: {
  basePath: string;
  params: URLSearchParams;
  active: SortKey;
}) {
  return (
    <form action={basePath} method="get" className="flex items-center gap-2">
      {/* Preserve the other filters across a sort change */}
      {[...params.entries()]
        .filter(([key]) => key !== 'sort' && key !== 'page')
        .map(([key, value], i) => (
          <input key={`${key}-${i}`} type="hidden" name={key} value={value} />
        ))}

      <label htmlFor="sort" className="text-muted shrink-0 text-sm">
        Sort by
      </label>
      <select
        id="sort"
        name="sort"
        defaultValue={active}
        className="border-line-strong bg-paper min-h-11 rounded-sm border px-3 text-sm"
      >
        {(Object.keys(SORT_OPTIONS) as SortKey[]).map((key) => (
          <option key={key} value={key}>
            {SORT_OPTIONS[key].label}
          </option>
        ))}
      </select>
      {/* Submits for keyboard and no-JS users; JS users get onChange from the
          progressive enhancement island in a later phase. */}
      <button
        type="submit"
        className="border-line-strong min-h-11 rounded-md border px-3 text-sm"
      >
        Apply
      </button>
    </form>
  );
}
