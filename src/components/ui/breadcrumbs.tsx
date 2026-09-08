import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { siteConfig } from '@/lib/site-config';
import { JsonLd } from '@/components/json-ld';

/**
 * Breadcrumbs — plan §6.2, §6.3, and §17.2 (`BreadcrumbList` on all pages).
 *
 * Emits both the visible trail and the JSON-LD, so the two can never drift
 * apart. The last item is the current page and is not a link.
 */

export interface Crumb {
  label: string;
  /** Omit on the final item — the current page is not a link. */
  href?: string;
}

export async function Breadcrumbs({ items }: { items: Crumb[] }) {
  const trail: Crumb[] = [{ label: 'Home', href: '/' }, ...items];

  // §17.2 — BreadcrumbList. Absolute URLs, per schema.org.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      ...(crumb.href ? { item: `${siteConfig.url}${crumb.href}` } : {}),
    })),
  };

  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className="text-muted flex flex-wrap items-center gap-1 text-sm">
          {trail.map((crumb, i) => {
            const isLast = i === trail.length - 1;
            return (
              <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                {i > 0 && (
                  <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
                )}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="underline-offset-4 hover:underline"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current={isLast ? 'page' : undefined} className="text-forest">
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Nonced so our CSP does not silently drop it (§13.1, §17.2). */}
      <JsonLd data={jsonLd} />

    </>
  );
}
