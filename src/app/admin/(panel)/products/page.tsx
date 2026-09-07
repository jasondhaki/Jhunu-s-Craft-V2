import Link from 'next/link';
import Image from 'next/image';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { MATERIAL_LABELS } from '@/components/commerce/catalog-filters';

/**
 * Products list — plan §11.3.
 *
 * "List with search, filter by status/material/stock."
 *
 * Search and filtering are plain GET parameters so the whole screen works
 * without JavaScript, which matters on the phone §11.5 says he will use.
 */

export const metadata = { title: 'Products' };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const { q, status } = await searchParams;

  const products = await db.product.findMany({
    where: {
      ...(status && ['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(status.toUpperCase())
        ? { status: status.toUpperCase() as 'DRAFT' | 'ACTIVE' | 'ARCHIVED' }
        : {}),
      ...(q
        ? {
            OR: [
              { nameEn: { contains: q, mode: 'insensitive' as const } },
              { slug: { contains: q, mode: 'insensitive' as const } },
              { variants: { some: { sku: { contains: q, mode: 'insensitive' as const } } } },
            ],
          }
        : {}),
    },
    include: {
      images: { orderBy: { position: 'asc' }, take: 1 },
      variants: { where: { isActive: true }, select: { stockQuantity: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-xl font-semibold">Products</h1>
        <p className="text-muted text-sm">{products.length} shown</p>
      </div>

      <form action="/admin/products" method="get" className="mb-6 flex flex-wrap gap-2">
        <label htmlFor="q" className="sr-only">
          Search products
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q ?? ''}
          placeholder="Search by name or SKU"
          className="border-line-strong bg-paper min-h-11 flex-1 rounded-sm border px-3 text-sm"
        />
        <label htmlFor="status" className="sr-only">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status ?? ''}
          className="border-line-strong bg-paper min-h-11 rounded-sm border px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Live</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <button
          type="submit"
          className="border-line-strong min-h-11 rounded-md border px-4 text-sm"
        >
          Search
        </button>
      </form>

      {products.length === 0 ? (
        <p className="border-line text-muted rounded-md border border-dashed px-4 py-8 text-center text-sm">
          No products match. Try a different search.
        </p>
      ) : (
        <ul className="border-line divide-line divide-y rounded-md border">
          {products.map((product) => {
            const stock = product.variants.reduce((n, v) => n + v.stockQuantity, 0);
            const image = product.images[0];

            return (
              <li key={product.id}>
                <Link
                  href={`/admin/products/${product.id}`}
                  className="hover:bg-paper-sunk flex items-center gap-4 px-4 py-3"
                >
                  <span className="bg-paper-sunk relative size-12 shrink-0 overflow-hidden rounded-sm">
                    {image && (
                      <Image
                        src={image.url}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {product.nameEn}
                    </span>
                    <span className="text-muted block text-xs">
                      {MATERIAL_LABELS[product.material]} ·{' '}
                      <span className="tabular">
                        {formatMoney(product.basePriceBdt, 'BDT')}
                      </span>
                      {/* §22 — flag what still needs Bangla, since it must be
                          written by a human (D6). */}
                      {!product.nameBn && ' · needs Bangla'}
                    </span>
                  </span>

                  <span className="hidden text-right sm:block">
                    <span
                      className={
                        product.madeToOrder
                          ? 'text-muted tabular block text-sm'
                          : stock === 0
                            ? 'text-clay tabular block text-sm font-medium'
                            : 'tabular block text-sm'
                      }
                    >
                      {product.madeToOrder ? 'To order' : `${stock} in stock`}
                    </span>
                  </span>

                  <StatusPill status={product.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' }) {
  const styles = {
    ACTIVE: 'bg-leaf text-white',
    DRAFT: 'bg-paper-sunk text-muted',
    ARCHIVED: 'bg-line text-muted',
  } as const;
  const labels = { ACTIVE: 'Live', DRAFT: 'Draft', ARCHIVED: 'Archived' } as const;

  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
