import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ExternalLink } from 'lucide-react';
import { ProductStatus } from '@prisma/client';
import { requireAdmin, auditLog } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { toMinor, toMajor, formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';

/**
 * Product editor — plan §11.3.
 *
 * Covers the fields the owner changes regularly: names and copy in both
 * languages, prices, physical details, and the draft → publish flow.
 *
 * Prices are entered in MAJOR units (৳3,450) because that is how a person
 * thinks about them, and converted to minor units on save. The conversion
 * happens exactly once, here, at the boundary (src/lib/money.ts).
 */

export const metadata = { title: 'Edit product' };

export default async function AdminProductEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { saved, error } = await searchParams;

  const product = await db.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { createdAt: 'asc' } },
      images: { orderBy: { position: 'asc' } },
    },
  });

  if (!product) notFound();

  async function save(formData: FormData) {
    'use server';

    // §13.3 — editing the catalog is MANAGER level, re-checked in the action.
    const admin = await requireAdmin('MANAGER');

    // §13.4 — validate everything server-side with a schema.
    const schema = z.object({
      nameEn: z.string().trim().min(1).max(200),
      nameBn: z.string().trim().max(200).optional(),
      shortDescriptionEn: z.string().trim().min(1).max(400),
      shortDescriptionBn: z.string().trim().max(400).optional(),
      descriptionEn: z.string().trim().min(1).max(8000),
      descriptionBn: z.string().trim().max(8000).optional(),
      // Entered in major units; a price of 0 is almost always a typo.
      priceBdt: z.coerce.number().positive().max(1_000_000),
      priceUsd: z.coerce.number().positive().max(100_000),
      weightGrams: z.coerce.number().int().positive().max(50_000),
      status: z.nativeEnum(ProductStatus),
    });

    const parsed = schema.safeParse({
      nameEn: formData.get('nameEn'),
      nameBn: formData.get('nameBn') || undefined,
      shortDescriptionEn: formData.get('shortDescriptionEn'),
      shortDescriptionBn: formData.get('shortDescriptionBn') || undefined,
      descriptionEn: formData.get('descriptionEn'),
      descriptionBn: formData.get('descriptionBn') || undefined,
      priceBdt: formData.get('priceBdt'),
      priceUsd: formData.get('priceUsd'),
      weightGrams: formData.get('weightGrams'),
      status: formData.get('status'),
    });

    if (!parsed.success) {
      const first = parsed.error.issues[0];
      redirect(
        `/admin/products/${id}?error=${encodeURIComponent(
          `${first.path.join('.')}: ${first.message}`,
        )}`,
      );
    }

    const before = await db.product.findUnique({ where: { id } });
    if (!before) notFound();

    const data = {
      nameEn: parsed.data.nameEn,
      // Empty means "not translated yet", which is null, not "" (D6).
      nameBn: parsed.data.nameBn ?? null,
      shortDescriptionEn: parsed.data.shortDescriptionEn,
      shortDescriptionBn: parsed.data.shortDescriptionBn ?? null,
      descriptionEn: parsed.data.descriptionEn,
      descriptionBn: parsed.data.descriptionBn ?? null,
      basePriceBdt: toMinor(parsed.data.priceBdt, 'BDT'),
      basePriceUsd: toMinor(parsed.data.priceUsd, 'USD'),
      weightGrams: parsed.data.weightGrams,
      status: parsed.data.status,
      // Publishing for the first time stamps publishedAt; unpublishing keeps
      // it, so re-publishing does not reset the product's apparent age.
      publishedAt:
        parsed.data.status === ProductStatus.ACTIVE && !before.publishedAt
          ? new Date()
          : before.publishedAt,
    };

    const after = await db.product.update({ where: { id }, data });

    // §13.7 — who, what, before, after, when.
    await auditLog({
      adminUserId: admin.id,
      action: 'product.update',
      entityType: 'Product',
      entityId: id,
      before: {
        nameEn: before.nameEn,
        basePriceBdt: before.basePriceBdt,
        basePriceUsd: before.basePriceUsd,
        status: before.status,
      },
      after: {
        nameEn: after.nameEn,
        basePriceBdt: after.basePriceBdt,
        basePriceUsd: after.basePriceUsd,
        status: after.status,
      },
    });

    // The storefront caches these — refresh them so the change is visible.
    revalidatePath(`/product/${after.slug}`);
    revalidatePath('/shop');
    revalidatePath('/');
    redirect(`/admin/products/${id}?saved=1`);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/products"
            className="text-jute-deep text-sm underline underline-offset-4"
          >
            ← All products
          </Link>
          <h1 className="font-display mt-2 text-xl font-semibold">
            {product.nameEn}
          </h1>
        </div>

        {/* §11.5 — "Show the customer-facing preview of anything he edits." */}
        <Link
          href={`/product/${product.slug}`}
          target="_blank"
          className="border-line-strong hover:bg-paper-sunk inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm"
        >
          View on site
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      {saved && (
        <p role="status" className="border-leaf text-leaf mb-6 rounded-sm border px-3 py-2 text-sm">
          Saved.
        </p>
      )}
      {error && (
        <p role="alert" className="border-clay text-clay mb-6 rounded-sm border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <form action={save} className="max-w-2xl space-y-8">
        <Fieldset legend="Name and description">
          <Field label="Name (English)" name="nameEn" defaultValue={product.nameEn} required />
          <Field
            label="Name (Bangla)"
            name="nameBn"
            defaultValue={product.nameBn ?? ''}
            lang="bn"
            hint="Leave blank until it is written properly. Never machine-translate it (§22) — the site shows the English name meanwhile."
          />

          <Field
            label="Short description (English)"
            name="shortDescriptionEn"
            defaultValue={product.shortDescriptionEn}
            textarea
            rows={2}
            required
            hint="One or two lines. Used on product cards and in search results."
          />
          <Field
            label="Short description (Bangla)"
            name="shortDescriptionBn"
            defaultValue={product.shortDescriptionBn ?? ''}
            textarea
            rows={2}
            lang="bn"
          />

          <Field
            label="Full description (English)"
            name="descriptionEn"
            defaultValue={product.descriptionEn}
            textarea
            rows={8}
            required
          />
          <Field
            label="Full description (Bangla)"
            name="descriptionBn"
            defaultValue={product.descriptionBn ?? ''}
            textarea
            rows={8}
            lang="bn"
          />
        </Fieldset>

        <Fieldset
          legend="Price"
          hint="Set each currency by hand. They are never converted from one another — an exchange rate would give you prices like $23.47 and unpredictable margins (§8.4)."
        >
          <Field
            label="Price in BDT (৳)"
            name="priceBdt"
            type="number"
            step="0.01"
            defaultValue={String(toMajor(product.basePriceBdt, 'BDT'))}
            required
          />
          <Field
            label="Price in USD ($)"
            name="priceUsd"
            type="number"
            step="0.01"
            defaultValue={String(toMajor(product.basePriceUsd, 'USD'))}
            required
          />
        </Fieldset>

        <Fieldset
          legend="Shipping"
          hint="Weight decides the international shipping quote. If it is wrong, you absorb the difference (§9.2)."
        >
          <Field
            label="Weight in grams"
            name="weightGrams"
            type="number"
            defaultValue={String(product.weightGrams)}
            required
          />
        </Fieldset>

        <Fieldset legend="Status">
          <div>
            <label htmlFor="status" className="mb-1.5 block text-sm font-medium">
              Visibility
            </label>
            <select
              id="status"
              name="status"
              defaultValue={product.status}
              className="border-line-strong bg-paper min-h-11 w-full rounded-sm border px-3"
            >
              <option value="DRAFT">Draft — not visible on the site</option>
              <option value="ACTIVE">Live — customers can buy it</option>
              <option value="ARCHIVED">Archived — hidden, not deleted</option>
            </select>
            <p className="text-muted mt-1.5 text-xs">
              Archived keeps the product and its order history intact. Nothing is
              ever really deleted (§5.5).
            </p>
          </div>
        </Fieldset>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg">
            Save changes
          </Button>
          <Link href="/admin/products" className="text-muted text-sm underline underline-offset-4">
            Cancel
          </Link>
        </div>
      </form>

      {/* --- Variants, read-only for now ---------------------------------- */}
      <section className="mt-14 max-w-2xl">
        <h2 className="mb-4 text-sm font-semibold">
          Colours and stock ({product.variants.length})
        </h2>
        <ul className="border-line divide-line divide-y rounded-md border">
          {product.variants.map((variant) => (
            <li key={variant.id} className="flex items-center gap-3 px-4 py-3">
              <span
                aria-hidden="true"
                className="border-line size-5 shrink-0 rounded-full border"
                style={{ backgroundColor: variant.colorHex }}
              />
              <span className="flex-1 text-sm">
                {variant.colorNameEn}
                <span className="text-muted tabular"> · {variant.sku}</span>
              </span>
              <span className="tabular text-sm">
                {variant.priceOverrideBdt
                  ? formatMoney(variant.priceOverrideBdt, 'BDT')
                  : ''}
              </span>
              <span className="text-muted tabular text-sm">
                {variant.stockQuantity} in stock
              </span>
            </li>
          ))}
        </ul>
        <p className="text-muted mt-3 text-xs">
          Edit stock on the{' '}
          <Link href="/admin/inventory" className="text-jute-deep underline underline-offset-4">
            Stock
          </Link>{' '}
          screen. Adding and removing colours arrives with the variant matrix
          editor (§11.3).
        </p>
      </section>
    </div>
  );
}

function Fieldset({
  legend,
  hint,
  children,
}: {
  legend: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-line space-y-4 border-t pt-6">
      <legend className="text-sm font-semibold">{legend}</legend>
      {hint && <p className="text-muted -mt-2 text-xs">{hint}</p>}
      {children}
    </fieldset>
  );
}

function Field({
  label,
  name,
  defaultValue,
  hint,
  textarea,
  rows,
  type = 'text',
  step,
  required,
  lang,
}: {
  label: string;
  name: string;
  defaultValue: string;
  hint?: string;
  textarea?: boolean;
  rows?: number;
  type?: string;
  step?: string;
  required?: boolean;
  lang?: string;
}) {
  const id = `field-${name}`;
  const describedBy = hint ? `${id}-hint` : undefined;
  const shared = {
    id,
    name,
    defaultValue,
    required,
    lang,
    'aria-describedby': describedBy,
    className:
      'border-line-strong bg-paper w-full rounded-sm border px-3 py-2 min-h-11',
  };

  return (
    <div>
      {/* §20 — a real <label>, never placeholder-as-label */}
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {textarea ? (
        <textarea {...shared} rows={rows ?? 4} />
      ) : (
        <input {...shared} type={type} step={step} />
      )}
      {hint && (
        <p id={describedBy} className="text-muted mt-1.5 text-xs">
          {hint}
        </p>
      )}
    </div>
  );
}
