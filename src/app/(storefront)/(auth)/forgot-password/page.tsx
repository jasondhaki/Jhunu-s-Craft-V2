import type { Metadata } from 'next';
import Link from 'next/link';
import { requestPasswordResetAction } from '../auth-actions';
import { AuthForm, AuthField } from '../auth-form';

export const metadata: Metadata = {
  title: 'Forgot password',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="font-display text-xl font-semibold">Forgot your password?</h1>
      <p className="text-muted mt-2 mb-8 text-sm">
        Enter your email and we will send you a link to set a new one. The link
        works once and expires in an hour.
      </p>

      <AuthForm
        action={requestPasswordResetAction}
        submitLabel="Send reset link"
        loadingLabel="Sending…"
        /* §13.2 — the same message either way, so this cannot be used to find
           out which email addresses have accounts. */
        successMessage="If that email is registered, a reset link is on its way. Check your inbox, and your spam folder just in case."
      >
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
      </AuthForm>

      <p className="text-muted mt-6 text-sm">
        <Link
          href="/login"
          className="text-jute-deep underline underline-offset-4 hover:no-underline"
        >
          Back to sign in
        </Link>
      </p>
    </>
  );
}
