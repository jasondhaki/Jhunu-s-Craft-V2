import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { Trash2 } from 'lucide-react';
import { requireCustomer } from '@/lib/customer-auth';
import { db } from '@/lib/db';
import { SHIPPING_COUNTRIES, addressLabels } from '@/lib/bd-geography';
import { Button } from '@/components/ui/button';

/**
 * Saved addresses — plan §6.7: "list, add, edit, delete, set default."
 *
 * §13.3: every mutation is scoped to the signed-in customer inside the query.
 * `deleteMany({ where: { id, customerId } })` matching zero rows is the right
 * outcome for someone else's address id — no error, no leak, no deletion.
 */

export const metadata = {
  title: 'Addresses',
  robots: { index: false, follow: false },
};

const addressSchema = z.object({
  label: z.string().trim().max(50).optional().or(z.literal('')),
  recipientName: z.string().trim().min(1, 'Enter a name.').max(120),
  phone: z.string().trim().min(6, 'Enter a phone number.').max(30),
  line1: z.string().trim().min(1, 'Enter the street address.').max(200),
  line2: z.string().trim().max(200).optional().or(z.literal('')),
  area: z.string().trim().max(120).optional().or(z.literal('')),
  city: z.string().trim().min(1, 'Enter the district or city.').max(120),
  region: z.string().trim().max(120).optional().or(z.literal('')),
  postcode: z.string().trim().max(20).optional().or(z.literal('')),
  country: z.string().trim().length(2),
  isDefault: z.boolean(),
});

export default async function AddressesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const customer = await requireCustomer();
  const { error, saved } = await searchParams;

  const addresses = await db.address.findMany({
    where: { customerId: customer.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  async function addAddress(formData: FormData) {
    'use server';
    const me = await requireCustomer();

    const parsed = addressSchema.safeParse({
      label: formData.get('label') ?? '',
      recipientName: formData.get('recipientName'),
      phone: formData.get('phone'),
      line1: formData.get('line1'),
      line2: formData.get('line2') ?? '',
      area: formData.get('area') ?? '',
      city: formData.get('city'),
      region: formData.get('region') ?? '',
      postcode: formData.get('postcode') ?? '',
      country: formData.get('country'),
      isDefault: formData.get('isDefault') === 'on',
    });

    if (!parsed.success) {
      redirect(
        `/account/addresses?error=${encodeURIComponent(parsed.error.issues[0].message)}`,
      );
    }
    const data = parsed.data;

    // The first address saved becomes the default automatically — otherwise
    // someone can end up with addresses and no default, which reads as a bug.
    const existingCount = await db.address.count({ where: { customerId: me.id } });
    const makeDefault = data.isDefault || existingCount === 0;

    await db.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.address.updateMany({
          where: { customerId: me.id },
          data: { isDefault: false },
        });
      }
      await tx.address.create({
        data: {
          customerId: me.id,
          label: data.label || null,
          recipientName: data.recipientName,
          phone: data.phone,
          line1: data.line1,
          line2: data.line2 || null,
          area: data.area || null,
          city: data.city,
          region: data.region || null,
          postcode: data.postcode || null,
          country: data.country,
          isDefault: makeDefault,
        },
      });
    });

    revalidatePath('/account/addresses');
    redirect('/account/addresses?saved=1');
  }

  async function deleteAddress(formData: FormData) {
    'use server';
    const me = await requireCustomer();
    const id = String(formData.get('id') ?? '');

    // customerId in the WHERE clause — this cannot delete another person's
    // address, and a mismatched id simply matches nothing (§13.3).
    await db.address.deleteMany({ where: { id, customerId: me.id } });

    revalidatePath('/account/addresses');
    redirect('/account/addresses?saved=1');
  }

  async function makeDefault(formData: FormData) {
    'use server';
    const me = await requireCustomer();
    const id = String(formData.get('id') ?? '');

    // Verify ownership BEFORE clearing the other defaults, so a bad id cannot
    // leave the customer with no default at all.
    const owned = await db.address.findFirst({
      where: { id, customerId: me.id },
      select: { id: true },
    });
    if (!owned) redirect('/account/addresses');

    await db.$transaction([
      db.address.updateMany({ where: { customerId: me.id }, data: { isDefault: false } }),
      db.address.update({ where: { id: owned.id }, data: { isDefault: true } }),
    ]);

    revalidatePath('/account/addresses');
    redirect('/account/addresses?saved=1');
  }

  const labels = addressLabels('BD');

  return (
    <div className="max-w-lg space-y-10">
      {saved && (
        <p role="status" className="border-leaf text-leaf rounded-sm border px-3 py-2 text-sm">
          Saved.
        </p>
      )}
      {error && (
        <p role="alert" className="border-clay text-clay rounded-sm border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <section>
        <h2 className="font-display mb-4 text-md font-semibold">
          Saved addresses
        </h2>

        {addresses.length === 0 ? (
          <p className="border-line text-muted rounded-md border border-dashed px-4 py-6 text-sm">
            No saved addresses yet. Adding one makes checkout quicker next time.
          </p>
        ) : (
          <ul className="space-y-3">
            {addresses.map((address) => (
              <li key={address.id} className="border-line rounded-md border p-4">
                <div className="flex items-start justify-between gap-4">
                  <address className="text-sm not-italic">
                    <span className="font-medium">{address.recipientName}</span>
                    {address.label && (
                      <span className="text-muted"> · {address.label}</span>
                    )}
                    {address.isDefault && (
                      <span className="bg-leaf ml-2 rounded-full px-2 py-0.5 text-xs text-white">
                        Default
                      </span>
                    )}
                    <br />
                    <span className="text-forest-soft">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ''}
                      <br />
                      {[address.area, address.city, address.region]
                        .filter(Boolean)
                        .join(', ')}
                      {address.postcode ? ` ${address.postcode}` : ''}
                      <br />
                      {address.country} · {address.phone}
                    </span>
                  </address>
                </div>

                <div className="mt-3 flex flex-wrap gap-4">
                  {!address.isDefault && (
                    <form action={makeDefault}>
                      <input type="hidden" name="id" value={address.id} />
                      <button
                        type="submit"
                        className="text-jute-deep min-h-11 text-sm underline underline-offset-4"
                      >
                        Make default
                      </button>
                    </form>
                  )}
                  <form action={deleteAddress}>
                    <input type="hidden" name="id" value={address.id} />
                    <button
                      type="submit"
                      className="text-muted hover:text-clay inline-flex min-h-11 items-center gap-1.5 text-sm underline-offset-4 hover:underline"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Delete
                      <span className="sr-only">
                        {' '}
                        address for {address.recipientName}
                      </span>
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-line border-t pt-10">
        <h2 className="font-display mb-4 text-md font-semibold">Add an address</h2>
        <form action={addAddress} className="space-y-4">
          <Field label="Label (optional)" name="label" placeholder="Home, office…" />
          <Field label="Full name" name="recipientName" autoComplete="name" required />
          <Field label="Phone" name="phone" autoComplete="tel" inputMode="numeric" required />
          <Field label="Address" name="line1" autoComplete="address-line1" required />
          <Field label="Apartment, floor (optional)" name="line2" autoComplete="address-line2" />
          <Field label={labels.area} name="area" autoComplete="address-level3" />
          <Field label={labels.city} name="city" autoComplete="address-level2" required />
          <Field label={labels.region} name="region" autoComplete="address-level1" />
          <Field label={labels.postcode} name="postcode" autoComplete="postal-code" inputMode="numeric" />

          <div>
            <label htmlFor="country" className="mb-1.5 block text-sm font-medium">
              Country
            </label>
            <select
              id="country"
              name="country"
              defaultValue="BD"
              autoComplete="country"
              className="border-line-strong bg-paper min-h-11 w-full rounded-sm border px-3"
            >
              {SHIPPING_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="isDefault" className="mt-0.5 size-4" />
            Use this as my default delivery address
          </label>

          <Button type="submit">Save address</Button>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  ...props
}: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `addr-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {props.required && <span className="text-clay"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        className="border-line-strong bg-paper min-h-11 w-full rounded-sm border px-3"
        {...props}
      />
    </div>
  );
}
