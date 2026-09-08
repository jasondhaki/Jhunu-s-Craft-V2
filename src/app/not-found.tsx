import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { buttonClasses } from '@/components/ui/button';

/**
 * 404 — plan §7.3 and §25.
 *
 * §7.3's copy: "This page doesn't exist. Here's the way back to the bags."
 * §25 requires 404 and 500 to be "designed and helpful" rather than default.
 *
 * The useful part of a 404 is the routes out, so they are real links to the
 * places someone was most likely heading.
 */

export const metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-lg px-4 py-16 text-center md:py-24">
          <p className="text-jute font-display tabular text-2xl font-semibold">
            404
          </p>
          <h1 className="font-display mt-2 text-xl font-semibold md:text-2xl">
            This page doesn&rsquo;t exist
          </h1>
          <p className="text-forest-soft mt-3">
            It may have moved, or the link may be wrong. Here&rsquo;s the way
            back to the bags.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/shop" className={buttonClasses('primary', 'md')}>
              Shop all bags
            </Link>
            <Link href="/" className={buttonClasses('secondary', 'md')}>
              Go home
            </Link>
          </div>

          <nav aria-label="Other pages" className="mt-12">
            <ul className="text-muted flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              {[
                { href: '/shop/jute', label: 'Jute bags' },
                { href: '/shop/leather', label: 'Leather bags' },
                { href: '/track-order', label: 'Track an order' },
                { href: '/faq', label: 'FAQ' },
                { href: '/contact', label: 'Contact us' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-forest underline underline-offset-4"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
