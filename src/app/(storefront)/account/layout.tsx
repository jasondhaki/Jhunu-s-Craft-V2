import Link from 'next/link';
import { requireCustomer } from '@/lib/customer-auth';
import { logoutAction, resendVerificationAction } from '../(auth)/auth-actions';

/**
 * Account shell — plan §6.7.
 *
 * §13.3: `requireCustomer` here is the coarse gate, but it is NOT the
 * security boundary. Each page re-checks, and every order query carries the
 * customer id in its WHERE clause (see src/lib/customer-orders.ts) so a
 * layout that somehow gets bypassed still cannot leak another person's order.
 */

const nav = [
  { href: '/account', label: 'Overview' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/profile', label: 'Profile' },
] as const;

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customer = await requireCustomer();

  async function signOut() {
    'use server';
    await logoutAction();
  }

  async function resend() {
    'use server';
    await resendVerificationAction();
  }

  return (
    <div className="mx-auto max-w-(--container-page) px-4 py-8 md:py-12">
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-xl font-semibold md:text-2xl">
          {customer.firstName ? `Hello, ${customer.firstName}` : 'Your account'}
        </h1>
        <form action={signOut}>
          <button
            type="submit"
            className="text-muted hover:text-forest min-h-11 text-sm underline underline-offset-4"
          >
            Sign out
          </button>
        </form>
      </div>

      {/* §10.1 — an unverified address means order updates may not arrive. */}
      {!customer.emailVerified && (
        <div className="border-jute mb-8 flex flex-wrap items-center gap-3 rounded-md border px-4 py-3 text-sm">
          <span className="flex-1">
            Your email is not confirmed yet, so order updates may not reach you.
          </span>
          <form action={resend}>
            <button
              type="submit"
              className="text-jute-deep min-h-11 underline underline-offset-4"
            >
              Send the link again
            </button>
          </form>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[200px_1fr] lg:gap-14">
        <nav aria-label="Account">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="hover:bg-paper-sunk inline-flex min-h-11 items-center rounded-md px-3 text-sm whitespace-nowrap"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>{children}</div>
      </div>
    </div>
  );
}
