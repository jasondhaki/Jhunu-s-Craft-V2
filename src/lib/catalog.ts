import { Prisma, Material, BagType, ProductStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { resolvePrice, savingsAgainst, type Currency, type Minor } from '@/lib/money';

/**
 * Catalog queries — plan §4 and §6.2.
 *
 * Everything the storefront reads goes through here so that the "only ACTIVE,
 * only published" rule lives in one place. A draft product leaking onto the
 * storefront is exactly the kind of bug §11.3's draft→preview→publish flow
 * exists to prevent.
 */

// --- Shared selection -------------------------------------------------------

const cardSelect = {
  id: true,
  slug: true,
  nameEn: true,
  nameBn: true,
  shortDescriptionEn: true,
  shortDescriptionBn: true,
  material: true,
  bagType: true,
  basePriceBdt: true,
  basePriceUsd: true,
  compareAtPriceBdt: true,
  compareAtPriceUsd: true,
  madeToOrder: true,
  productionDays: true,
  publishedAt: true,
  featured: true,
  variants: {
    where: { isActive: true },
    select: {
      id: true,
      sku: true,
      colorNameEn: true,
      colorNameBn: true,
      colorHex: true,
      stockQuantity: true,
      lowStockThreshold: true,
      priceOverrideBdt: true,
      priceOverrideUsd: true,
    },
    orderBy: { createdAt: 'asc' },
  },
  images: {
    select: {
      url: true,
      width: true,
      height: true,
      altTextEn: true,
      altTextBn: true,
      blurPlaceholder: true,
    },
    orderBy: { position: 'asc' },
    take: 2, // primary + the hover image (§6.2 product card)
  },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

/** Only ACTIVE and actually published products are ever visible. */
const visible: Prisma.ProductWhereInput = {
  status: ProductStatus.ACTIVE,
  publishedAt: { not: null, lte: new Date() },
};

// --- Derived display values -------------------------------------------------

export type StockState =
  | { kind: 'in_stock'; total: number }
  | { kind: 'low_stock'; total: number }
  | { kind: 'made_to_order'; days: number | null }
  | { kind: 'sold_out' };

/**
 * The minimum a caller must supply to compute stock. Structural rather than
 * tied to `ProductCardData`, so the detail page can pass its own richer shape
 * without a cast.
 */
export interface StockInput {
  variants: { stockQuantity: number; lowStockThreshold: number }[];
  madeToOrder: boolean;
  productionDays: number | null;
}

/**
 * §6.2 / §6.3 stock signal. Note §14.5: this reports the real number. There
 * is no fake scarcity here — "Only 2 left" is shown only when 2 are left.
 */
export function stockState(product: StockInput): StockState {
  const total = product.variants.reduce((n, v) => n + v.stockQuantity, 0);

  if (total > 0) {
    const threshold = Math.max(...product.variants.map((v) => v.lowStockThreshold), 0);
    return total <= threshold ? { kind: 'low_stock', total } : { kind: 'in_stock', total };
  }
  if (product.madeToOrder) {
    return { kind: 'made_to_order', days: product.productionDays };
  }
  return { kind: 'sold_out' };
}

export interface PriceDisplay {
  /** Lowest price across active variants — what the card shows. */
  amount: Minor;
  compareAt: Minor | null;
  savings: Minor | null;
  /** True when variants differ in price, so the card can show "from ৳X". */
  varies: boolean;
}

export function priceDisplay(product: ProductCardData, currency: Currency): PriceDisplay {
  const base = { basePriceBdt: product.basePriceBdt, basePriceUsd: product.basePriceUsd };

  const prices = product.variants.length
    ? product.variants.map((v) => resolvePrice(currency, base, v))
    : [resolvePrice(currency, base)];

  const amount = Math.min(...prices);
  const compareAt =
    currency === 'BDT' ? product.compareAtPriceBdt : product.compareAtPriceUsd;

  return {
    amount,
    compareAt,
    savings: savingsAgainst(amount, compareAt),
    varies: new Set(prices).size > 1,
  };
}

/** §6.2 — "New" badge. Published within the last 30 days. */
export function isNew(product: ProductCardData): boolean {
  if (!product.publishedAt) return false;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - product.publishedAt.getTime() < thirtyDays;
}

// --- Filtering and sorting (§4.3, §4.4) -------------------------------------

export const SORT_OPTIONS = {
  newest: { label: 'Newest', orderBy: { publishedAt: 'desc' } },
  price_asc: { label: 'Price: low to high', orderBy: { basePriceBdt: 'asc' } },
  price_desc: { label: 'Price: high to low', orderBy: { basePriceBdt: 'desc' } },
  best_selling: { label: 'Best selling', orderBy: { soldCount: 'desc' } },
} as const satisfies Record<string, { label: string; orderBy: Prisma.ProductOrderByWithRelationInput }>;

export type SortKey = keyof typeof SORT_OPTIONS;

export function isSortKey(value: string | undefined): value is SortKey {
  return value !== undefined && value in SORT_OPTIONS;
}

export interface CatalogFilters {
  material?: Material[];
  bagType?: BagType[];
  /** Minor units, in the ACTIVE currency. */
  minPrice?: Minor;
  maxPrice?: Minor;
  inStockOnly?: boolean;
  collection?: string;
  sort?: SortKey;
}

function buildWhere(filters: CatalogFilters, currency: Currency): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { ...visible };
  const and: Prisma.ProductWhereInput[] = [];

  if (filters.material?.length) and.push({ material: { in: filters.material } });
  if (filters.bagType?.length) and.push({ bagType: { in: filters.bagType } });

  // Filter on the field for the active currency — never on a converted value.
  const priceField = currency === 'BDT' ? 'basePriceBdt' : 'basePriceUsd';
  if (filters.minPrice !== undefined) and.push({ [priceField]: { gte: filters.minPrice } });
  if (filters.maxPrice !== undefined) and.push({ [priceField]: { lte: filters.maxPrice } });

  if (filters.inStockOnly) {
    and.push({ variants: { some: { isActive: true, stockQuantity: { gt: 0 } } } });
  }
  if (filters.collection) {
    and.push({ collections: { some: { collection: { slug: filters.collection } } } });
  }

  if (and.length) where.AND = and;
  return where;
}

export interface CatalogPage {
  products: ProductCardData[];
  total: number;
  pageSize: number;
  page: number;
  pageCount: number;
}

export async function listProducts(
  filters: CatalogFilters = {},
  currency: Currency = 'BDT',
  page = 1,
  pageSize = 12,
): Promise<CatalogPage> {
  const where = buildWhere(filters, currency);
  const sort = SORT_OPTIONS[filters.sort ?? 'newest'];

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      select: cardSelect,
      orderBy: sort.orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where }),
  ]);

  return {
    products,
    total,
    pageSize,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  const featured = await db.product.findMany({
    where: { ...visible, featured: true },
    select: cardSelect,
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });

  // §6.1.5 wants 4–8 real products on the homepage. If not enough are
  // flagged featured, top up with the newest rather than showing a short row.
  if (featured.length >= limit) return featured;

  const filler = await db.product.findMany({
    where: { ...visible, id: { notIn: featured.map((p) => p.id) } },
    select: cardSelect,
    orderBy: { publishedAt: 'desc' },
    take: limit - featured.length,
  });
  return [...featured, ...filler];
}

// --- Single product (§6.3) --------------------------------------------------

export async function getProductBySlug(slug: string) {
  return db.product.findFirst({
    where: { ...visible, slug },
    include: {
      variants: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
      images: { orderBy: { position: 'asc' } },
      collections: { include: { collection: true } },
      tags: { include: { tag: true } },
      reviews: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

/** Every published slug — for `generateStaticParams` and the sitemap (§17.1). */
export async function getAllProductSlugs(): Promise<string[]> {
  const rows = await db.product.findMany({ where: visible, select: { slug: true } });
  return rows.map((r) => r.slug);
}

/** §6.3.15 — "You may also like": same material, then same type. */
export async function getRelatedProducts(
  product: { id: string; material: Material; bagType: BagType },
  limit = 4,
): Promise<ProductCardData[]> {
  const sameMaterial = await db.product.findMany({
    where: { ...visible, id: { not: product.id }, material: product.material },
    select: cardSelect,
    take: limit,
  });
  if (sameMaterial.length >= limit) return sameMaterial;

  const filler = await db.product.findMany({
    where: {
      ...visible,
      id: { notIn: [product.id, ...sameMaterial.map((p) => p.id)] },
      bagType: product.bagType,
    },
    select: cardSelect,
    take: limit - sameMaterial.length,
  });
  return [...sameMaterial, ...filler];
}

// --- Facet counts (§6.2 filter sidebar) -------------------------------------

export async function getFacetCounts() {
  const [byMaterial, byType] = await Promise.all([
    db.product.groupBy({ by: ['material'], where: visible, _count: true }),
    db.product.groupBy({ by: ['bagType'], where: visible, _count: true }),
  ]);
  return {
    material: Object.fromEntries(byMaterial.map((r) => [r.material, r._count])) as Record<Material, number>,
    bagType: Object.fromEntries(byType.map((r) => [r.bagType, r._count])) as Record<BagType, number>,
  };
}
