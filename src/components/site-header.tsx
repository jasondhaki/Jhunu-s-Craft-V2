import Link from 'next/link';
import { Search, User, Heart, Menu } from 'lucide-react';
import { siteConfig, real } from '@/lib/site-config';
import { Button } from '@/components/ui/button';
import { CartCount } from '@/components/commerce/cart-controls';

/**
 * Site header — plan §3.2.
 *
 * Desktop: [Logo] Jute▾ Leather▾ Collections Our Story Care  [Search][Account][Wishlist][Cart]
 * Mobile:  [☰] [Logo] [Search][Cart]
 *
 * The mega-menu, mobile drawer, and live cart count arrive with Phase 1/2;
 * the structure and the landmarks are correct now so nothing has to be
 * retrofitted.
 */

const primaryNav = [
  { href: '/shop/jute', label: 'Jute' },
  { href: '/shop/leather', label: 'Leather' },
  { href: '/shop/mixed', label: 'Jute + leather' },
  { href: '/about', label: 'Our story' },
  { href: '/care', label: 'Care' },
] as const;

export function SiteHeader() {
  return (
    <header className="on-forest bg-forest text-paper sticky top-0 z-50">
      {/* Announcement bar (§3.2) — one message only. Dismissal lands with
          the client island in Phase 1. */}
      <div className="border-forest-soft border-b">
        <p className="mx-auto max-w-(--container-page) px-4 py-2 text-center text-xs">
          {siteConfig.announcement.bd}
        </p>
      </div>

      <div className="mx-auto flex max-w-(--container-page) items-center gap-4 px-4 py-3">
        {/* Mobile menu trigger */}
        <Button
          variant="icon"
          aria-label="Open menu"
          className="text-paper hover:bg-forest-soft active:bg-forest-soft md:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>

        <Link
          href="/"
          className="font-display shrink-0 text-lg leading-none font-semibold tracking-tight md:text-xl"
        >
          {siteConfig.name}
          <span className="text-paper/70 block text-xs font-normal tracking-normal">
            {siteConfig.descriptor}
          </span>
        </Link>

        {/* §20 — a real <nav> landmark, real <a href> for navigation */}
        <nav aria-label="Main" className="ml-6 hidden md:block">
          <ul className="flex items-center gap-6 text-sm">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="hover:text-jute underline-offset-4 transition-colors duration-150 hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="icon"
            aria-label="Search"
            className="text-paper hover:bg-forest-soft active:bg-forest-soft"
          >
            <Search className="size-5" aria-hidden="true" />
          </Button>
          <Button
            variant="icon"
            aria-label="Account"
            className="text-paper hover:bg-forest-soft active:bg-forest-soft hidden sm:inline-flex"
          >
            <User className="size-5" aria-hidden="true" />
          </Button>
          <Button
            variant="icon"
            aria-label="Wishlist"
            className="text-paper hover:bg-forest-soft active:bg-forest-soft hidden sm:inline-flex"
          >
            <Heart className="size-5" aria-hidden="true" />
          </Button>
          {/* Live count from the client cart store. */}
          <CartCount />
        </div>
      </div>

      {/* §14.1 — a working phone number, visible. §28 lists a missing phone
          number as a fatal trust signal in Bangladesh. Hidden until the real
          number is known (CONTEXT.md Q3) rather than shown as a placeholder. */}
      {real(siteConfig.contact.phoneDisplay) && (
        <p className="border-forest-soft border-t px-4 py-1.5 text-center text-xs md:hidden">
          Call us:{' '}
          <a
            href={`tel:${siteConfig.contact.phone}`}
            className="underline underline-offset-2"
          >
            {siteConfig.contact.phoneDisplay}
          </a>
        </p>
      )}
    </header>
  );
}
