import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCustomer } from '@/lib/customer-auth';
import { registerAction } from '../auth-actions';
import { AuthForm, AuthField } from '../auth-form';

export const metadata: Metadata = {
  title: 'Create an account',
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  if (await getCustomer()) redirect('/account');

  return (
    <>
      <h1 className="font-display text-xl font-semibold">Create an account</h1>
      <p className="text-muted mt-2 mb-8 text-sm">
        Keeps your order history and addresses in one place. Entirely optional —
        checkout works without one.
      </p>

      <AuthForm
        action={registerAction}
        submitLabel="Create account"
        loadingLabel="Creating account…"
        redirectTo="/account"
      >
        <AuthField label="First name" name="firstName" autoComplete="given-name" />
        <AuthField label="Last name" name="lastName" autoComplete="family-name" />
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters. We check it against known data breaches and will tell you if it appears in one."
        />

        {/* §14.5 — never pre-ticked, and honest about what it means. */}
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="marketingOptIn" className="mt-0.5 size-4" />
          <span>
            Email me when new bags are ready — about once a month. You can stop
            at any time.
          </span>
        </label>
      </AuthForm>

      <p className="text-muted mt-6 text-sm">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-jute-deep underline underline-offset-4 hover:no-underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
