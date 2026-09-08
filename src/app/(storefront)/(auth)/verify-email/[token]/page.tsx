import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';
import { verifyEmailAction } from '../../auth-actions';
import { buttonClasses } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Confirm your email',
  robots: { index: false, follow: false },
};

/**
 * Verification consumes the token on load, which is correct here: unlike a
 * password reset there is no form to fill in, and the link's only purpose is
 * to prove the inbox is reachable.
 */
export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await verifyEmailAction(token);

  return (
    <div className="text-center">
      {result.ok ? (
        <>
          <CheckCircle2
            className="text-leaf mx-auto size-10"
            aria-hidden="true"
          />
          <h1 className="font-display mt-4 text-xl font-semibold">
            Email confirmed
          </h1>
          <p className="text-muted mt-2 text-sm">
            Thank you. We can now send you order updates.
          </p>
          <Link href="/account" className={`${buttonClasses('primary', 'md')} mt-6`}>
            Go to your account
          </Link>
        </>
      ) : (
        <>
          <XCircle className="text-clay mx-auto size-10" aria-hidden="true" />
          <h1 className="font-display mt-4 text-xl font-semibold">
            That link did not work
          </h1>
          {/* §7.3 — say what happened and what to do next. */}
          <p className="text-muted mt-2 text-sm">{result.error}</p>
          <Link href="/account" className={`${buttonClasses('secondary', 'md')} mt-6`}>
            Go to your account
          </Link>
        </>
      )}
    </div>
  );
}
