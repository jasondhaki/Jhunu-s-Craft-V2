'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';

/**
 * 500 — plan §7.3 and §25.
 *
 * §7.3's copy: "Something broke on our end. We're on it — try again in a
 * moment." It does not apologise at length and it is not vague about whose
 * fault it is.
 *
 * The phone number matters here more than anywhere: if the site is broken,
 * the customer needs a route that does not depend on the site working.
 *
 * Must be a Client Component with `reset` — that is Next.js's contract for an
 * error boundary. It cannot use the site header, because whatever failed may
 * be in that tree too.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // §24 wants Sentry here. Until it is wired up, at least get it into the
    // platform logs with its digest so a report can be traced.
    console.error('Unhandled error', { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <div className="bg-paper flex min-h-screen items-center justify-center px-4 py-16">
      <div className="max-w-lg text-center">
        <h1 className="font-display text-xl font-semibold md:text-2xl">
          Something broke on our end
        </h1>
        <p className="text-forest-soft mt-3">
          Not your fault, and nothing you did caused it. We&rsquo;re on it — try
          again in a moment.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="bg-jute hover:bg-jute-deep min-h-11 rounded-md px-5 text-sm font-medium text-white transition-colors duration-150"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border-forest text-forest hover:bg-paper-sunk inline-flex min-h-11 items-center rounded-md border px-5 text-sm font-medium"
          >
            Go home
          </Link>
        </div>

        <p className="text-muted mt-10 text-sm">
          If you were in the middle of an order and are not sure whether it went
          through, please call{' '}
          <a
            href={`tel:${siteConfig.contact.phone}`}
            className="text-jute-deep underline underline-offset-4"
          >
            {siteConfig.contact.phoneDisplay}
          </a>{' '}
          before ordering again, so we can check rather than risk charging you
          twice.
        </p>

        {error.digest && (
          <p className="text-muted mt-4 text-xs">
            Reference: <span className="tabular">{error.digest}</span>
          </p>
        )}
      </div>
    </div>
  );
}
