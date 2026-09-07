import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin, auditLog } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { setStockLevel } from '@/lib/inventory';

/**
 * Inventory — plan §11.3.
 *
 * "Inventory view: every variant with current stock, editable inline, with a
 * stock-movement history."
 *
 * Each row is its own form so a save touches exactly one variant. That keeps
 * a mis-tap from rewriting the whole table, and it works without JavaScript.
 */

export const metadata = { title: 'Stock' };

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ low?: string; saved?: string }>;
}) {
  await requireAdmin();
  const { low, saved } = await searchParams;

  const variants = await db.variant.findMany({
    where: {
      isActive: true,
      ...(low === '1' ? { stockQuantity: { lte: 3 } } : {}),
    },
    include: {
      product: { select: { nameEn: true, madeToOrder: true, status: true } },
    },
    orderBy: [{ stockQuantity: 'asc' }, { sku: 'asc' }],
  });

  async function updateStock(formData: FormData) {
    'use server';

    // §13.3 — permission checked inside the action, not just on the page.
    // Adjusting stock is a MANAGER-level action.
    const admin = await requireAdmin('MANAGER');

    // §13.4 — every input validated server-side.
    const parsed = z
      .object({
        variantId: z.string().min(1).max(64),
        quantity: z.coerce.number().int().min(0).max(100_000),
      })
      .safeParse({
        variantId: formData.get('variantId'),
        quantity: formData.get('quantity'),
      });

    if (!parsed.success) return;

    const { previous, next } = await setStockLevel(parsed.data.variantId, parsed.data.quantity, {
      createdBy: admin.id,
      note: 'Stock count from admin panel',
    });

    // §13.7 — audit every admin change: who, what, before, after.
    if (previous !== next) {
      await auditLog({
        adminUserId: admin.id,
        action: 'variant.stock_adjust',
        entityType: 'Variant',
        entityId: parsed.data.variantId,
        before: { stockQuantity: previous },
        after: { stockQuantity: next },
      });
    }

    revalidatePath('/admin/inventory');
    revalidatePath('/admin');
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-xl font-semibold">Stock</h1>
        <p className="text-muted text-sm">
          {low === '1' ? 'Showing low stock only · ' : ''}
          {variants.length} items
        </p>
      </div>

      {saved && (
        <p role="status" className="border-leaf text-leaf mb-6 rounded-sm border px-3 py-2 text-sm">
          Stock updated.
        </p>
      )}

      <p className="text-muted mb-6 text-sm">
        Type the number you actually have and press Save. Every change is
        recorded with the date and who made it, so a mismatch can be traced
        later.
      </p>

      <ul className="border-line divide-line divide-y rounded-md border">
        {variants.map((variant) => (
          <li key={variant.id} className="px-4 py-3">
            <form action={updateStock} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="variantId" value={variant.id} />

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {variant.product.nameEn}
                </span>
                <span className="text-muted block text-xs">
                  {variant.colorNameEn} · <span className="tabular">{variant.sku}</span>
                  {variant.product.status !== 'ACTIVE' && ' · not live'}
                  {variant.product.madeToOrder && ' · made to order'}
                </span>
              </span>

              <label htmlFor={`qty-${variant.id}`} className="sr-only">
                Stock for {variant.product.nameEn}, {variant.colorNameEn}
              </label>
              <input
                id={`qty-${variant.id}`}
                name="quantity"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={variant.stockQuantity}
                className={
                  variant.stockQuantity === 0
                    ? 'border-clay tabular min-h-11 w-20 rounded-sm border px-2 text-center'
                    : 'border-line-strong tabular min-h-11 w-20 rounded-sm border px-2 text-center'
                }
              />

              <button
                type="submit"
                className="border-line-strong hover:bg-paper-sunk min-h-11 rounded-md border px-4 text-sm"
              >
                Save
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
