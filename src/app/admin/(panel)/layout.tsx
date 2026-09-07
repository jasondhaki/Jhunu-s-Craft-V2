import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import { getAdmin, destroySession, ADMIN_2FA_ENFORCED } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';

/**
 * Admin shell — plan §11.
 *
 * Deliberately does NOT use the storefront layout: the customer header has no
 * business here, and mixing them makes it easy to leak admin-only data into a
 * cached customer page.
 *
 * §11.5: "Mobile-responsive. He will process orders from his phone." The nav
 * is a horizontal scrolling strip on mobile rather than a hidden drawer, so
 * every destination stays one tap away.
 */

const nav = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', Icon: ShoppingCart },
  { href: '/admin/products', label: 'Products', Icon: Package },
  { href: '/admin/inventory', label: 'Stock', Icon: Boxes },
  { href: '/admin/messages', label: 'Messages', Icon: MessageSquare },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdmin();

  // §13.3 — the check happens here AND in every page and action. This layout
  // guard is convenience, not the security boundary: requireAdmin() is called
  // again inside each page, so a routing change can never silently expose one.
  if (!admin) redirect('/admin/login');

  async function signOut() {
    'use server';
    await destroySession();
    redirect('/admin/login');
  }

  return (
    <div className="bg-paper flex min-h-screen flex-col">
      <header className="on-forest bg-forest text-paper">
        <div className="mx-auto flex max-w-(--container-page) items-center gap-4 px-4 py-3">
          <Link href="/admin" className="font-display text-base font-semibold">
            Workshop admin
          </Link>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-paper/70 hidden sm:inline">
              {admin.name} · {admin.role.toLowerCase()}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="hover:bg-forest-soft inline-flex min-h-11 items-center gap-2 rounded-md px-3"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </div>

        <nav aria-label="Admin" className="border-forest-soft border-t">
          <ul className="mx-auto flex max-w-(--container-page) gap-1 overflow-x-auto px-2">
            {nav.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="hover:bg-forest-soft inline-flex min-h-12 items-center gap-2 rounded-md px-3 text-sm whitespace-nowrap"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* §13.2 requires TOTP on every admin account before launch. While the
          flow is unbuilt, say so loudly rather than letting it be forgotten —
          it is on the §25 pre-launch checklist. */}
      {!ADMIN_2FA_ENFORCED && (
        <p className="bg-clay px-4 py-2 text-center text-xs text-white">
          Two-factor authentication is not enabled yet. §13.2 requires it on
          every admin account before launch.
        </p>
      )}

      <main id="main" className="mx-auto w-full max-w-(--container-page) flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
