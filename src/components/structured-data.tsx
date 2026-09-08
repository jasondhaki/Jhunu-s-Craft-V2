import { siteConfig, real } from '@/lib/site-config';
import { JsonLd } from '@/components/json-ld';

/**
 * Site-wide JSON-LD — plan §17.2.
 *
 * "All pages: Organization (with logo, address, contact, sameAs social
 * links). Homepage: WebSite with SearchAction."
 *
 * Every value here is real or omitted. Structured data that claims a contact
 * point or an address that does not exist is worse than none — Google treats
 * it as a quality signal, and §14.5 rules out fabricated trust markers
 * regardless of who is reading.
 */

/**
 * All schemas go through <JsonLd>, which attaches the CSP nonce. A plain
 * inline <script> here would be blocked by our policy and the structured data
 * would silently vanish — see src/components/json-ld.tsx.
 */
function jsonLdScript(data: unknown) {
  return <JsonLd data={data} />;
}

export async function OrganizationSchema() {
  // Only include social profiles that are actually filled in (§14.1 — a dead
  // link is worse than none, and that applies to `sameAs` too).
  const sameAs = [
    siteConfig.social.facebook,
    siteConfig.social.instagram,
    siteConfig.social.pinterest,
  ].filter((url) => real(url));

  const phone = real(siteConfig.contact.phone);
  const email = real(siteConfig.contact.email);

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.tagline,
    address: {
      '@type': 'PostalAddress',
      streetAddress: [
        real(siteConfig.address.line1),
        real(siteConfig.address.line2),
      ]
        .filter(Boolean)
        .join(', '),
      addressLocality: real(siteConfig.address.city),
      addressRegion: real(siteConfig.address.region),
      postalCode: real(siteConfig.address.postcode),
      addressCountry: siteConfig.address.countryCode,
    },
  };

  if (phone) {
    data.contactPoint = {
      '@type': 'ContactPoint',
      telephone: phone,
      contactType: 'customer service',
      areaServed: 'BD',
      availableLanguage: ['en', 'bn'],
    };
  }
  if (email) data.email = email;
  if (sameAs.length > 0) data.sameAs = sameAs;

  // The maker is the whole proposition (§1.1), so name him in the data too.
  if (real(siteConfig.maker.name)) {
    data.founder = {
      '@type': 'Person',
      name: siteConfig.maker.name,
    };
  }

  return jsonLdScript(data);
}

/** §17.2 — homepage only. */
export async function WebSiteSchema() {
  return jsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: ['en', 'bn'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  });
}

/**
 * §17.2 — LocalBusiness, "if you have a physical location visitors can use".
 *
 * The workshop is a working space rather than a shop, so this is deliberately
 * NOT emitted site-wide: claiming a visitable storefront that does not exist
 * would be a false trust signal. It appears only on /contact, and only once a
 * real address is set.
 */
export async function LocalBusinessSchema() {
  if (!real(siteConfig.address.line1)) return null;

  return jsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.tagline,
    telephone: real(siteConfig.contact.phone) || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: [
        real(siteConfig.address.line1),
        real(siteConfig.address.line2),
      ]
        .filter(Boolean)
        .join(', '),
      addressLocality: real(siteConfig.address.city),
      addressRegion: real(siteConfig.address.region),
      postalCode: real(siteConfig.address.postcode),
      addressCountry: siteConfig.address.countryCode,
    },
  });
}

/** §17.2 — FAQPage, emitted from the same data the page renders. */
export async function FaqSchema({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  return jsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  });
}
