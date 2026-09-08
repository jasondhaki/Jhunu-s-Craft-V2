import type { Metadata, Viewport } from 'next';
import { Fraunces, Work_Sans, Hind_Siliguri } from 'next/font/google';
import { siteConfig } from '@/lib/site-config';
import { OrganizationSchema } from '@/components/structured-data';
import { CookieConsent } from '@/components/cookie-consent';
import { Analytics } from '@/components/analytics';
import './globals.css';

/**
 * Fonts (§2.4).
 *
 * next/font SELF-HOSTS these at build time — the files are served from our own
 * origin and nothing is requested from Google at runtime. That satisfies
 * §2.4's "don't hotlink Google Fonts": it's faster from Bangladesh and avoids
 * the GDPR wrinkle of leaking EU visitors' IPs to a third party.
 *
 * `display: swap` per §2.4 and §19 — text is visible immediately rather than
 * blocking on the font.
 *
 * All three are OFL-licensed, which §16.2 requires us to verify and record.
 */
const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'swap',
  axes: ['SOFT', 'WONK', 'opsz'],
});

const workSans = Work_Sans({
  variable: '--font-work-sans',
  subsets: ['latin'],
  display: 'swap',
});

const hindSiliguri = Hind_Siliguri({
  variable: '--font-hind-siliguri',
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    // §17.3 — "[Product Name] — Handmade [Material] Bag | [Brand]"
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.tagline,
  applicationName: siteConfig.name,
  // §17.1 — self-referencing canonical by default
  alternates: {
    canonical: '/',
    languages: {
      en: '/en',
      bn: '/bn',
      'x-default': '/',
    },
  },
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.tagline,
    locale: 'en_US',
    alternateLocale: ['bn_BD'],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.tagline,
  },
  robots: {
    // Staging must be noindex (§25); production is driven by this env flag.
    index: process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true',
    follow: process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Never cap zoom — the page must be usable at 200% (§20).
  maximumScale: 5,
  themeColor: '#14401F',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${workSans.variable} ${hindSiliguri.variable} h-full antialiased`}
    >
      <body className="bg-paper text-forest flex min-h-full flex-col">
        {/* First focusable element on the page (§20). */}
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}

        {/* §17.2 — Organization on every page. */}
        <OrganizationSchema />

        {/* §13.8 — the banner, and the analytics it gates. Nothing in
            <Analytics> renders until consent exists, so no third-party
            request is made and no cookie is set before a choice. */}
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
