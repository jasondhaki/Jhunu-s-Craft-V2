import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireCustomer, checkPasswordStrength, setPassword, verifyPassword, destroyAllSessions } from '@/lib/customer-auth';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email/send';
import { passwordChangedEmail } from '@/lib/email/templates';
import { Button } from '@/components/ui/button';

/**
 * Profile — plan §6.7.
 *
 * "Name, email, phone, marketing preferences, password change, delete account
 * (a real, working deletion request flow — required under GDPR)."
 */

export const metadata = {
  title: 'Profile',
  robots: { index: false, follow: false },
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; tab?: string }>;
}) {
  const session = await requireCustomer();
  const { saved, error } = await searchParams;

  const customer = await db.customer.findUnique({ where: { id: session.id } });
  if (!customer) redirect('/login');

  async function saveDetails(formData: FormData) {
    'use server';
    const me = await requireCustomer();

    const parsed = z
      .object({
        firstName: z.string().trim().max(100).optional().or(z.literal('')),
        lastName: z.string().trim().max(100).optional().or(z.literal('')),
        phone: z.string().trim().max(30).optional().or(z.literal('')),
        marketingOptIn: z.boolean(),
      })
      .safeParse({
        firstName: formData.get('firstName') ?? '',
        lastName: formData.get('lastName') ?? '',
        phone: formData.get('phone') ?? '',
        marketingOptIn: formData.get('marketingOptIn') === 'on',
      });

    if (!parsed.success) {
      redirect('/account/profile?error=Please+check+those+details');
    }

    // Scoped to `me.id` — a tampered form cannot update anyone else (§13.3).
    await db.customer.update({
      where: { id: me.id },
      data: {
        firstName: parsed.data.firstName || null,
        lastName: parsed.data.lastName || null,
        phone: parsed.data.phone || null,
        marketingOptIn: parsed.data.marketingOptIn,
      },
    });

    revalidatePath('/account/profile');
    redirect('/account/profile?saved=details');
  }

  async function changePassword(formData: FormData) {
    'use server';
    const me = await requireCustomer();

    const parsed = z
      .object({
        current: z.string().min(1, 'Enter your current password.').max(400),
        next: z.string().min(1, 'Choose a new password.').max(200),
      })
      .safeParse({
        current: formData.get('current'),
        next: formData.get('next'),
      });

    if (!parsed.success) {
      redirect(`/account/profile?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
    }

    const record = await db.customer.findUnique({ where: { id: me.id } });
    if (!record?.passwordHash) redirect('/account/profile?error=Cannot+change+password');

    // Proving knowledge of the current password is what stops a stolen
    // session from locking the real owner out.
    const ok = await verifyPassword(record.passwordHash, parsed.data.current);
    if (!ok) {
      redirect('/account/profile?error=Your+current+password+is+incorrect');
    }

    const strength = await checkPasswordStrength(parsed.data.next);
    if (!strength.ok) {
      redirect(`/account/profile?error=${encodeURIComponent(strength.error!)}`);
    }

    // Also destroys every session, including this one (§13.2).
    await setPassword(me.id, parsed.data.next);
    await sendEmail(passwordChangedEmail({ to: record.email }));

    redirect('/login?changed=1');
  }

  async function signOutEverywhere() {
    'use server';
    const me = await requireCustomer();
    await destroyAllSessions(me.id);
    redirect('/login');
  }

  async function requestDeletion() {
    'use server';
    const me = await requireCustomer();

    /*
     * §13.8 — "A working account-deletion flow that ANONYMISES rather than
     * breaks historical orders."
     *
     * Orders are not deleted: they are accounting records, and §5.5 requires
     * historical invoices to stay intact. Instead the personal data is
     * scrubbed from the customer row and the link to it is cut, so the order
     * survives as a number without a person attached.
     */
    const stamp = Date.now();

    await db.$transaction([
      db.order.updateMany({ where: { customerId: me.id }, data: { customerId: null } }),
      db.address.deleteMany({ where: { customerId: me.id } }),
      db.session.deleteMany({ where: { customerId: me.id } }),
      db.verificationToken.deleteMany({ where: { customerId: me.id } }),
      db.wishlistItem.deleteMany({ where: { customerId: me.id } }),
      db.customer.update({
        where: { id: me.id },
        data: {
          email: `deleted-${stamp}-${me.id}@removed.invalid`,
          passwordHash: null,
          firstName: null,
          lastName: null,
          phone: null,
          marketingOptIn: false,
          acceptsSms: false,
          anonymisedAt: new Date(),
        },
      }),
    ]);

    redirect('/?deleted=1');
  }

  return (
    <div className="max-w-lg space-y-12">
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

      {/* --- Details ------------------------------------------------- */}
      <section>
        <h2 className="font-display mb-4 text-md font-semibold">Your details</h2>
        <form action={saveDetails} className="space-y-4">
          <Field label="First name" name="firstName" defaultValue={customer.firstName ?? ''} autoComplete="given-name" />
          <Field label="Last name" name="lastName" defaultValue={customer.lastName ?? ''} autoComplete="family-name" />
          <Field label="Phone" name="phone" defaultValue={customer.phone ?? ''} autoComplete="tel" inputMode="numeric" />

          <div>
            <span className="mb-1.5 block text-sm font-medium">Email</span>
            <p className="text-muted text-sm">{customer.email}</p>
            <p className="text-muted mt-1 text-xs">
              To change this, contact us — it is tied to your order history.
            </p>
          </div>

          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="marketingOptIn"
              defaultChecked={customer.marketingOptIn}
              className="mt-0.5 size-4"
            />
            Email me when new bags are ready, about once a month.
          </label>

          <Button type="submit">Save changes</Button>
        </form>
      </section>

      {/* --- Password ------------------------------------------------ */}
      <section className="border-line border-t pt-10">
        <h2 className="font-display mb-4 text-md font-semibold">Change password</h2>
        <form action={changePassword} className="space-y-4">
          <Field label="Current password" name="current" type="password" autoComplete="current-password" required />
          <Field
            label="New password"
            name="next"
            type="password"
            autoComplete="new-password"
            required
            hint="At least 8 characters. Checked against known data breaches. You will be signed out everywhere."
          />
          <Button type="submit" variant="secondary">
            Change password
          </Button>
        </form>
      </section>

      {/* --- Sessions ------------------------------------------------ */}
      <section className="border-line border-t pt-10">
        <h2 className="font-display mb-2 text-md font-semibold">Signed-in devices</h2>
        <p className="text-muted mb-4 text-sm">
          Used a shared computer? This signs you out everywhere, including here.
        </p>
        <form action={signOutEverywhere}>
          <Button type="submit" variant="secondary">
            Sign out of all devices
          </Button>
        </form>
      </section>

      {/* --- Deletion (§13.8, §6.7) ---------------------------------- */}
      <section className="border-line border-t pt-10">
        <h2 className="font-display mb-2 text-md font-semibold">Delete your account</h2>
        <p className="text-muted mb-4 text-sm">
          This removes your name, email, phone, and saved addresses permanently
          and cannot be undone. Your past orders stay in our accounting records
          as required by law, but they will no longer be linked to you.
        </p>
        <details>
          <summary className="text-clay min-h-11 cursor-pointer text-sm underline underline-offset-4">
            I want to delete my account
          </summary>
          <form action={requestDeletion} className="mt-4">
            <p className="text-muted mb-3 text-sm">
              Are you sure? There is no way back from this.
            </p>
            <Button type="submit" variant="destructive">
              Permanently delete my account
            </Button>
          </form>
        </details>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  hint,
  ...props
}: {
  label: string;
  name: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `profile-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="border-line-strong bg-paper min-h-11 w-full rounded-sm border px-3"
        {...props}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-muted mt-1.5 text-xs">
          {hint}
        </p>
      )}
    </div>
  );
}
