import Link from 'next/link';
import {
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
  PinterestIcon,
} from '@/components/ui/social-icons';
import { siteConfig, real, whatsappUrl } from '@/lib/site-config';

/**
 * Site footer — plan §3.3. Four columns plus a bottom bar.
 *
 * §3.3: "Include the full physical address and a working phone number in the
 * footer. Nothing signals 'real business' harder, in either market." Both are
 * now real. Anything still unknown (social links, email) is dropped from the
 * render rather than shown as [PLACEHOLDER] — and §14.1 is explicit that a
 * dead social link is worse than no link at all.
 */

const columns = [
  {
    heading: 'Shop',
    links: [
      { href: '/shop/jute', label: 'Jute bags' },
      { href: '/shop/leather', label: 'Leather bags' },
      { href: '/shop/mixed', label: 'Jute + leather' },
      { href: '/shop/new', label: 'New arrivals' },
      { href: '/shop/bestsellers', label: 'Best sellers' },
      { href: '/shop', label: 'All products' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { href: '/contact', label: 'Contact' },
      { href: '/shipping', label: 'Shipping' },
      { href: '/returns', label: 'Returns & exchanges' },
      { href: '/track-order', label: 'Track your order' },
      { href: '/faq', label: 'FAQ' },
      { href: '/size-guide', label: 'Size guide' },
      { href: '/care', label: 'Bag care' },
    ],
  },
  {
    heading: 'About',
    links: [
      { href: '/about', label: 'Our story' },
      { href: '/about/process', label: 'How a bag is made' },
      { href: '/about/materials', label: 'Materials' },
      { href: '/custom-orders', label: 'Custom orders' },
      { href: '/wholesale', label: 'Wholesale' },
      { href: '/reviews', label: 'Reviews' },
    ],
  },
] as const;

const policyLinks = [
  { href: '/policies/terms', label: 'Terms' },
  { href: '/policies/privacy', label: 'Privacy' },
  { href: '/policies/cookies', label: 'Cookies' },
  { href: '/policies/accessibility', label: 'Accessibility' },
  { href: '/policies/intellectual-property', label: 'IP notice' },
] as const;

const socials = [
  { key: 'facebook', href: siteConfig.social.facebook, label: 'Facebook', Icon: FacebookIcon },
  { key: 'instagram', href: siteConfig.social.instagram, label: 'Instagram', Icon: InstagramIcon },
  { key: 'pinterest', href: siteConfig.social.pinterest, label: 'Pinterest', Icon: PinterestIcon },
  {
    key: 'whatsapp',
    // Must be a wa.me URL, not the raw number — see whatsappUrl(). An empty
    // string here falls through the `real()` filter below and is dropped.
    href: whatsappUrl('Hello — I have a question about a bag.') ?? '',
    label: 'WhatsApp',
    Icon: WhatsAppIcon,
  },
] as const;

export function SiteFooter() {
  // §14.1 — an inactive social link is worse than no link, so unfilled
  // entries are dropped rather than rendered dead.
  const activeSocials = socials.filter((s) => real(s.href));

  return (
    <footer className="on-forest bg-forest text-paper mt-24">
      <div className="mx-auto max-w-(--container-page) px-4 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="text-paper mb-4 text-sm font-semibold tracking-wide">
                {column.heading}
              </h2>
              <ul className="space-y-2 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-paper/80 hover:text-jute underline-offset-4 transition-colors duration-150 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Column 4 — stay in touch (§3.3) */}
          <div>
            <h2 className="text-paper mb-4 text-sm font-semibold tracking-wide">
              Stay in touch
            </h2>

            {/* §6.1.11 — one field, one button, one line saying what they get
                and how often. Wired up in Phase 4. */}
            <p className="text-paper/80 mb-3 text-sm">
              New bags and workshop news, about once a month. No spam.
            </p>
            <form className="mb-6 flex gap-2">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="text-forest placeholder:text-muted min-h-11 w-full rounded-sm bg-white px-3 text-sm"
              />
              <button
                type="submit"
                className="bg-jute hover:bg-jute-deep min-h-11 shrink-0 rounded-md px-4 text-sm font-medium text-white transition-colors duration-150"
              >
                Subscribe
              </button>
            </form>

            {activeSocials.length > 0 && (
              <ul className="mb-6 flex gap-2">
                {activeSocials.map(({ key, href, label, Icon }) => (
                  <li key={key}>
                    <a
                      href={href}
                      aria-label={label}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="hover:bg-forest-soft tap-target inline-flex items-center justify-center rounded-full transition-colors duration-150"
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {/* Real address + phone (§3.3, §14.1) */}
            <address className="text-paper/80 space-y-1 text-sm not-italic">
              {real(siteConfig.contact.phoneDisplay) && (
                <a
                  href={`tel:${siteConfig.contact.phone}`}
                  className="block underline-offset-4 hover:underline"
                >
                  {siteConfig.contact.phoneDisplay}
                </a>
              )}
              {real(siteConfig.contact.email) && (
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="block underline-offset-4 hover:underline"
                >
                  {siteConfig.contact.email}
                </a>
              )}
              {real(siteConfig.address.line1) && (
                <p>
                  {[real(siteConfig.address.line1), real(siteConfig.address.line2)]
                    .filter(Boolean)
                    .join(', ')}
                  <br />
                  {[real(siteConfig.address.city), real(siteConfig.address.postcode)]
                    .filter(Boolean)
                    .join(' - ')}
                  <br />
                  {siteConfig.address.country}
                </p>
              )}
            </address>
          </div>
        </div>
      </div>

      {/* Bottom bar (§3.3) */}
      <div className="border-forest-soft border-t">
        <div className="mx-auto flex max-w-(--container-page) flex-col gap-4 px-4 py-6 text-xs md:flex-row md:items-center md:justify-between">
          <p className="text-paper/70">
            © {siteConfig.legal.copyrightYear} {siteConfig.name}. All rights
            reserved.
          </p>

          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {policyLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-paper/70 hover:text-paper underline-offset-4 hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="text-paper/70">Made in Bangladesh 🇧🇩</p>
        </div>
      </div>
    </footer>
  );
}
