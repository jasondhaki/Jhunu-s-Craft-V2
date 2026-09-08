import type { Metadata } from 'next';
import Link from 'next/link';
import { resetPasswordAction } from '../../auth-actions';
import { AuthForm, AuthField } from '../../auth-form';

export const metadata: Metadata = {
  title: 'Set a new password',
  robots: { index: false, follow: false },
};

/**
 * §13.2 — the token is validated when the form is SUBMITTED, not when this
 * page loads. Checking on load would burn a single-use token just because
 * someone's mail client prefetched the link.
 */
export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <>
      <h1 className="font-display text-xl font-semibold">Set a new password</h1>
      <p className="text-muted mt-2 mb-8 text-sm">
        Choose something you do not use anywhere else. You will be signed out on
        your other devices.
      </p>

      <AuthForm
        action={resetPasswordAction}
        submitLabel="Save new password"
        loadingLabel="Saving…"
        redirectTo="/account"
      >
        <input type="hidden" name="token" value={token} />
        <AuthField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters. We check it against known data breaches."
        />
      </AuthForm>

      <p className="text-muted mt-6 text-sm">
        Link expired?{' '}
        <Link
          href="/forgot-password"
          className="text-jute-deep underline underline-offset-4 hover:no-underline"
        >
          Request a new one
        </Link>
      </p>
    </>
  );
}
