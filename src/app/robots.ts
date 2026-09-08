import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';

/**
 * robots.txt — plan §17.1.
 *
 * "Block /admin, /checkout, /account, /cart, /search, and any faceted URLs
 * you don't want indexed."
 *
 * Faceted catalogue URLs (?material=, ?type=, ?sort=, ?page=) are blocked
 * because they multiply into thousands of near-duplicate pages that dilute
 * crawl budget. The clean category pages carry the same products and are the
 * ones that should rank.
 */
export default function robots(): MetadataRoute.Robots {
  // Staging and preview deployments must never be indexed (§12.4, §25).
  const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';

  if (!allowIndexing) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/account',
          '/account/',
          '/cart',
          '/checkout',
          '/checkout/',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password/',
          '/verify-email/',
          '/track-order',
          '/api/',
          // Faceted and paginated variants — the canonical category pages
          // carry the same products.
          '/*?material=',
          '/*?type=',
          '/*?sort=',
          '/*?page=',
          '/*?in_stock=',
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
