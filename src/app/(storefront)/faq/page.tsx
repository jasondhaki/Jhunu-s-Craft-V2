import type { Metadata } from 'next';
import Link from 'next/link';
import { FAQ_GROUPS, FAQ_ITEMS } from '@/content/faq';
import { FaqSchema } from '@/components/structured-data';
import { ProsePage } from '@/components/prose-page';
import { siteConfig } from '@/lib/site-config';

/**
 * FAQ — plan §6.9 and §17.2.
 *
 * Accordions are native `<details>`, so they work with JavaScript disabled,
 * are keyboard-operable for free, and are announced correctly by screen
 * readers without any ARIA of our own (§20).
 *
 * The FAQPage structured data is generated from the same array the page
 * renders, so the two cannot drift apart.
 */

export const metadata: Metadata = {
  title: 'Frequently asked questions',
  description:
    'Delivery times and costs, payment options, returns, how to care for jute and leather, and honest answers about what handmade actually means.',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  return (
    <>
      <ProsePage
        title="Frequently asked questions"
        intro="Everything we get asked most often, answered plainly — including the awkward questions."
        crumbs={[{ label: 'FAQ' }]}
      >
        {FAQ_GROUPS.map((group) => (
          <section key={group.heading}>
            <h2 className="font-display border-line border-b pt-6 pb-2 text-lg font-semibold">
              {group.heading}
            </h2>

            <div>
              {group.items.map((item) => (
                <details
                  key={item.question}
                  className="border-line group border-b"
                >
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-left font-medium">
                    <span>{item.question}</span>
                    <span
                      aria-hidden="true"
                      className="text-muted shrink-0 transition-transform duration-150 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="text-forest-soft pb-5 leading-relaxed">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}

        <div className="border-line mt-10 rounded-md border p-5">
          <h2 className="font-display text-md font-semibold">
            Still not answered?
          </h2>
          <p className="text-forest-soft mt-2">
            Call{' '}
            <a
              href={`tel:${siteConfig.contact.phone}`}
              className="text-jute-deep underline underline-offset-4"
            >
              {siteConfig.contact.phoneDisplay}
            </a>{' '}
            or{' '}
            <Link
              href="/contact"
              className="text-jute-deep underline underline-offset-4"
            >
              send us a message
            </Link>
            . {siteConfig.contact.responseTime}.
          </p>
        </div>
      </ProsePage>

      {/* §17.2 — from the same source as the page above. */}
      <FaqSchema items={FAQ_ITEMS} />
    </>
  );
}
