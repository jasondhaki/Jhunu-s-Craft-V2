import type { Metadata } from 'next';

/**
 * Admin root layout — metadata only.
 *
 * The protected shell lives in `(panel)/layout.tsx` so that `/admin/login`
 * can render without it. If the guard lived here, the login page would
 * inherit it and redirect to itself.
 */
export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | Admin' },
  // §17.1 — /admin is never indexed.
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
