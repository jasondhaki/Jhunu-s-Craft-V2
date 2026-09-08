import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { siteConfig } from '@/lib/site-config';

/**
 * sitemap.xml — plan §17.1.
 *
 * "Auto-generated, including products, categories, collections, blog, static
 * pages, submitted to Google Search Console and Bing."
 *
 * Only pages that should actually rank appear here. Anything in robots.txt's
 * disallow list is deliberately absent — listing a page in the sitemap while
 * blocking it in robots.txt is a contradiction that Search Console flags.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;

  const staticPages: { path: string; priority: number; frequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '', priority: 1.0, frequency: 'weekly' },
    { path: '/shop', priority: 0.9, frequency: 'daily' },
    { path: '/shop/jute', priority: 0.8, frequency: 'weekly' },
    { path: '/shop/leather', priority: 0.8, frequency: 'weekly' },
    { path: '/shop/mixed', priority: 0.8, frequency: 'weekly' },
    { path: '/shop/new', priority: 0.7, frequency: 'daily' },
    { path: '/shop/bestsellers', priority: 0.7, frequency: 'weekly' },
    { path: '/about', priority: 0.8, frequency: 'monthly' },
    { path: '/about/process', priority: 0.6, frequency: 'monthly' },
    { path: '/about/materials', priority: 0.6, frequency: 'monthly' },
    { path: '/care', priority: 0.6, frequency: 'monthly' },
    { path: '/size-guide', priority: 0.5, frequency: 'monthly' },
    { path: '/faq', priority: 0.6, frequency: 'monthly' },
    { path: '/contact', priority: 0.5, frequency: 'monthly' },
    { path: '/custom-orders', priority: 0.5, frequency: 'monthly' },
    { path: '/wholesale', priority: 0.4, frequency: 'monthly' },
    { path: '/shipping', priority: 0.5, frequency: 'monthly' },
    { path: '/returns', priority: 0.5, frequency: 'monthly' },
    { path: '/reviews', priority: 0.4, frequency: 'weekly' },
    { path: '/policies/terms', priority: 0.2, frequency: 'yearly' },
    { path: '/policies/privacy', priority: 0.2, frequency: 'yearly' },
    { path: '/policies/cookies', priority: 0.2, frequency: 'yearly' },
    { path: '/policies/refund', priority: 0.3, frequency: 'yearly' },
    { path: '/policies/accessibility', priority: 0.2, frequency: 'yearly' },
    { path: '/policies/intellectual-property', priority: 0.2, frequency: 'yearly' },
  ];

  const [products, collections] = await Promise.all([
    db.product.findMany({
      where: { status: 'ACTIVE', publishedAt: { not: null } },
      select: { slug: true, updatedAt: true },
    }),
    db.collection.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const now = new Date();

  return [
    ...staticPages.map((page) => ({
      url: `${base}${page.path}`,
      lastModified: now,
      changeFrequency: page.frequency,
      priority: page.priority,
    })),
    ...products.map((product) => ({
      url: `${base}/product/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...collections.map((collection) => ({
      url: `${base}/collections/${collection.slug}`,
      lastModified: collection.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
