import Link from 'next/link';
import { Breadcrumbs, type Crumb } from '@/components/ui/breadcrumbs';

/**
 * Shell for content and policy pages — plan §2.6 (1140px for prose-heavy
 * pages) and §2.4 (max line length 65–75 characters).
 *
 * `.prose-measure` caps the body at 68ch. Long legal text at full container
 * width is genuinely hard to read, and §15 wants these pages actually read
 * rather than skimmed past.
 */
export function ProsePage({
  title,
  intro,
  crumbs = [],
  updated,
  children,
}: {
  title: string;
  intro?: string;
  crumbs?: Crumb[];
  /** Shown on policy pages — people need to know how current it is. */
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-(--container-prose) px-4 py-8 md:py-12">
      {crumbs.length > 0 && <Breadcrumbs items={crumbs} />}

      <header className={crumbs.length > 0 ? 'mt-6' : ''}>
        <h1 className="font-display text-xl font-semibold text-balance md:text-2xl">
          {title}
        </h1>
        {intro && (
          <p className="prose-measure text-forest-soft mt-4 text-md">{intro}</p>
        )}
        {updated && (
          <p className="text-muted mt-3 text-sm">Last updated {updated}</p>
        )}
      </header>

      <div className="prose-measure mt-10 space-y-6">{children}</div>
    </div>
  );
}

/** A section with a real heading, so the page has a usable outline (§20). */
export function ProseSection({
  heading,
  id,
  children,
}: {
  heading: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2
        id={id}
        className="font-display scroll-mt-24 pt-4 text-lg font-semibold"
      >
        {heading}
      </h2>
      {children}
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-forest-soft leading-relaxed">{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="text-forest-soft list-disc space-y-2 pl-5 leading-relaxed">
      {children}
    </ul>
  );
}

/**
 * §15 — "I'm not a lawyer... have a Bangladeshi lawyer review the set before
 * launch, especially the terms and refund policy."
 *
 * Shown on every policy page so the owner cannot forget, and so it is obvious
 * these were drafted rather than lawyered. Tracked as CONTEXT.md R5.
 */
export function LegalReviewNotice() {
  return (
    <aside className="border-jute rounded-md border border-dashed p-4">
      <p className="text-sm">
        <strong>Note for the site owner:</strong> this policy was drafted in
        plain language as a starting point, not by a lawyer. Plan §15 asks for
        a Bangladeshi lawyer to review the full set — especially the terms and
        the refund policy — before launch. Remove this box once that has
        happened.
      </p>
    </aside>
  );
}

export function ContactLine() {
  return (
    <P>
      Questions about this page?{' '}
      <Link href="/contact" className="text-jute-deep underline underline-offset-4">
        Get in touch
      </Link>
      .
    </P>
  );
}
