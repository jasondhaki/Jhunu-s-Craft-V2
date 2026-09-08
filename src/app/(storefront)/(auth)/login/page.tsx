import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCustomer } from '@/lib/customer-auth';
import { loginAction } from '../auth-actions';
import { AuthForm, AuthField } from '../auth-form';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await getCustomer()) redirect('/account');

  return (
    <>
      <h1 className="font-display text-xl font-semibold">Sign in</h1>
      <p className="text-muted mt-2 mb-8 text-sm">
        For your order history and saved addresses. You do not need an account
        to buy anything.
      </p>

      <AuthForm
        action={loginAction}
        submitLabel="Log in"
        loadingLabel="Signing in…"
        redirectTo="/account"
      >
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
          autoComplete="current-password"
          required
        />
      </AuthForm>

      <div className="mt-6 space-y-2 text-sm">
        <p>
          <Link
            href="/forgot-password"
            className="text-jute-deep underline underline-offset-4 hover:no-underline"
          >
            Forgot password?
          </Link>
        </p>
        <p className="text-muted">
          No account?{' '}
          <Link
            href="/register"
            className="text-jute-deep underline underline-offset-4 hover:no-underline"
          >
            Create one
          </Link>
        </p>
        <p className="text-muted">
          Just want to check on an order?{' '}
          <Link
            href="/track-order"
            className="text-jute-deep underline underline-offset-4 hover:no-underline"
          >
            Track it without signing in
          </Link>
        </p>
      </div>
    </>
  );
}
