import type { Metadata } from 'next';
import Link from 'next/link';
import { ProsePage, ProseSection, P, UL } from '@/components/prose-page';
import { siteConfig } from '@/lib/site-config';

/**
 * Accessibility statement — plan §15.6.
 *
 * "Your commitment · the standard you target (WCAG 2.2 Level AA) · KNOWN
 * LIMITATIONS and when you plan to fix them · how to report a barrier and
 * expected response time."
 *
 * The known-limitations section is the part most sites omit, and it is the
 * part that makes a statement honest rather than decorative. Keep it accurate
 * as work lands — an accessibility statement that overstates is worse than
 * none, because people rely on it to decide whether to bother trying.
 */

export const metadata: Metadata = {
  title: 'Accessibility',
  description:
    'We aim for WCAG 2.2 Level AA. What is in place, what is still missing, and how to tell us about a barrier.',
  alternates: { canonical: '/policies/accessibility' },
};

export default function AccessibilityPage() {
  return (
    <ProsePage
      title="Accessibility"
      intro="This site should work for everyone, including people using a keyboard, a screen reader, or a lot of zoom."
      crumbs={[{ label: 'Policies' }, { label: 'Accessibility' }]}
      updated="8 September 2026"
    >
      <ProseSection heading="What we are aiming for">
        <P>
          We target WCAG 2.2 Level AA. That is a real, checkable standard rather
          than a vague promise, and it is the level most accessibility law
          refers to.
        </P>
      </ProseSection>

      <ProseSection heading="What is in place">
        <UL>
          <li>
            Every interactive element is reachable by keyboard, in a sensible
            order, with a visible focus outline that we have not removed.
          </li>
          <li>A skip-to-content link as the first thing you reach by keyboard.</li>
          <li>
            Real headings, landmarks, buttons, and links — not styled divs
            pretending to be them.
          </li>
          <li>Descriptive alt text on every product photograph.</li>
          <li>
            Form fields have real labels, and errors are announced and tied to
            the field they belong to.
          </li>
          <li>
            Text contrast meets the 4.5:1 minimum. Our copper accent is
            deliberately never used for body text, because it does not reach it.
          </li>
          <li>Touch targets are at least 44 by 44 pixels.</li>
          <li>
            Animation respects your system &ldquo;reduce motion&rdquo; setting.
          </li>
          <li>
            Catalogue filters, accordions, and the FAQ all work with JavaScript
            switched off.
          </li>
        </UL>
      </ProseSection>

      <ProseSection heading="Known limitations">
        <P>
          Being specific matters more than sounding good, so these are the
          things we know are unfinished:
        </P>
        <UL>
          <li>
            <strong>No screen-reader audit yet.</strong> The site is built to
            the standard but has not been walked end to end with NVDA or
            VoiceOver. Planned before launch.
          </li>
          <li>
            <strong>Product photography is still placeholder.</strong> Alt text
            is written and in place, but it describes images that are not final.
          </li>
          <li>
            <strong>Bangla is incomplete.</strong> Much of the site is
            English-only. We will not machine-translate it, so it will arrive
            written properly rather than quickly.
          </li>
          <li>
            <strong>Image zoom on product pages</strong> is not built yet.
          </li>
        </UL>
      </ProseSection>

      <ProseSection heading="Telling us about a problem">
        <P>
          If something blocks you, please tell us. It is the fastest route to a
          fix, and we would much rather hear it than not.
        </P>
        <P>
          Call{' '}
          <a
            href={`tel:${siteConfig.contact.phone}`}
            className="text-jute-deep underline underline-offset-4"
          >
            {siteConfig.contact.phoneDisplay}
          </a>{' '}
          or{' '}
          <Link href="/contact" className="text-jute-deep underline underline-offset-4">
            send a message
          </Link>
          . We reply within 24 hours, and if a fix will take longer than that we
          will tell you roughly how long.
        </P>
        <P>
          If you cannot use part of the site and want to order, call us and we
          will take the order over the phone.
        </P>
      </ProseSection>
    </ProsePage>
  );
}
