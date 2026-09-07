import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

/**
 * Storefront shell — header, main landmark, footer (§3.2, §3.3).
 *
 * The admin panel (§11) deliberately does NOT use this layout: it is a
 * different application with different chrome, and the customer header has no
 * business appearing there.
 *
 * `#main` is the skip-link target set in the root layout (§20).
 */
export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
