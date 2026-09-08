import type { Metadata } from 'next';
import Image from 'next/image';
import { MessageType } from '@prisma/client';
import { ProsePage, ProseSection, P, UL } from '@/components/prose-page';
import { ContactForm } from '@/components/contact-form';

/**
 * Wholesale and contract manufacturing — plan §6.9, §15.7, §26.5.
 *
 * REWRITTEN 2026-09-08 (CONTEXT.md D9). The previous version was built on the
 * plan's §1.1 assumption of a single maker and told buyers we could not fill a
 * large order quickly. That was the opposite of the truth: bulk work is most
 * of what this workshop does, for named international clients.
 *
 * §26.5 rates wholesale outreach highly — "one wholesale account can equal
 * months of retail orders" — and here it is the established business rather
 * than a hoped-for channel. The page leads with proof (real clients, real
 * photographs of the work) because for a B2B buyer that is the whole decision.
 */

export const metadata: Metadata = {
  title: 'Wholesale & bulk orders',
  description:
    'Contract manufacturing of jute and canvas bags in Dhaka — promotional totes, school bags, and branded bags for companies, schools, and development organisations.',
  alternates: { canonical: '/wholesale' },
};

export default function WholesalePage() {
  return (
    <ProsePage
      title="Wholesale and bulk orders"
      intro="Most of what this workshop makes is bulk work for other organisations. If you need branded bags in quantity, this is the part of the business built for it."
      crumbs={[{ label: 'Wholesale' }]}
    >
      <ProseSection heading="What we already do">
        <P>
          A team of ten to twenty people on industrial machines, in our own
          premises in Dhaka. We cut, print, stitch, and finish in-house — the
          work is not subcontracted out, so the quality and the timeline are
          ours to answer for.
        </P>

        {/* §14.3 — real work, photographed. Proof beats adjectives for a
            B2B buyer, and these are our own photographs (§28). */}
        <div className="grid gap-4 sm:grid-cols-2">
          <figure>
            <Image
              src="/Processing Bulk Products.jpeg"
              alt="Jute tote bags printed for Swisscontact and B-SETS, stacked beside an industrial sewing machine during production"
              width={1200}
              height={1600}
              sizes="(min-width: 640px) 50vw, 100vw"
              className="border-line rounded-md border object-cover"
            />
            <figcaption className="text-muted mt-2 text-xs">
              Printed jute totes in production for a Swisscontact skills
              programme.
            </figcaption>
          </figure>
          <figure>
            <Image
              src="/Employees at work.jpeg"
              alt="Workers at rows of industrial sewing machines assembling bags in the Jhunu's Crafts workshop"
              width={1280}
              height={960}
              sizes="(min-width: 640px) 50vw, 100vw"
              className="border-line rounded-md border object-cover"
            />
            <figcaption className="text-muted mt-2 text-xs">
              The production floor, mid-run.
            </figcaption>
          </figure>
        </div>
      </ProseSection>

      <ProseSection heading="Who we have made for">
        <P>
          Named with permission, and deliberately specific — a vague claim about
          &ldquo;international clients&rdquo; is worth nothing:
        </P>
        <UL>
          <li>
            <strong>Swisscontact</strong> and <strong>B-SETS</strong> — printed
            jute totes for a youth skills-development programme on diversified
            jute products.
          </li>
          <li>
            <strong>Adhuna Bangladesh Limited</strong> — co-branded jute bags
            for the same programme.
          </li>
          <li>
            <strong>Ministry of Textiles and Jute</strong> and the{' '}
            <strong>Bangladesh Climate Change Trust</strong> — branded school
            bags produced under a government programme.
          </li>
        </UL>
        <P>
          Development organisations and government programmes are demanding
          clients: fixed budgets, fixed delivery dates, and a specification that
          does not move. That is the standard the workshop is used to working
          to.
        </P>
      </ProseSection>

      <ProseSection heading="What we can make">
        <UL>
          <li>
            <strong>Promotional and conference totes</strong> — jute, with a
            printed or stitched panel carrying your branding.
          </li>
          <li>
            <strong>School bags</strong> — canvas backpacks, in your colours,
            with a printed badge or logo.
          </li>
          <li>
            <strong>Office and laptop bags</strong> — jute with leather trim, for
            corporate gifting.
          </li>
          <li>
            <strong>Your own design</strong> — send a sample or a drawing and we
            will make a prototype before committing to a run.
          </li>
        </UL>
      </ProseSection>

      <ProseSection heading="Minimum order and lead times">
        <P>
          Minimum is 100 pieces for a branded bulk order — below that, printing
          and set-up cost more per bag than the bag does.
        </P>
        <UL>
          <li>
            <strong>100–500 pieces</strong> — typically two to three weeks from
            an approved sample.
          </li>
          <li>
            <strong>500–2,000 pieces</strong> — typically three to five weeks.
          </li>
          <li>
            <strong>Larger than that</strong> — tell us the deadline and we will
            give you a straight answer, including no. We would rather decline an
            order than miss a delivery date on a programme launch.
          </li>
        </UL>
        <P>
          Add roughly a week at the start for sampling and approval on a design
          we have not made before.
        </P>
      </ProseSection>

      <ProseSection heading="Pricing">
        <P>
          Quoted per order, because it depends on the material, the size, the
          printing, and the quantity — a printed jute tote and a leather-trimmed
          office bag are not remotely the same cost.
        </P>
        <P>
          Send a specification and quantity and you will get a real figure, not
          a range that changes later. Sampling is charged separately and
          credited against the order if it goes ahead.
        </P>
      </ProseSection>

      <ProseSection heading="Retail wholesale">
        <P>
          If you are a shop rather than a brand — buying our own designs to
          resell rather than commissioning branded bags — the minimum is lower,
          at ten pieces mixed across designs. That lets a shop test whether
          these sell before committing to a season of them.
        </P>
      </ProseSection>

      <ProseSection heading="Shipping and payment">
        <P>
          Bulk orders ship by courier at cost, or you can collect from the
          workshop. International orders go by air freight or courier; duties
          and import charges are the buyer&rsquo;s responsibility.
        </P>
        <P>
          Payment is normally half on order and half before dispatch, by bank
          transfer. For institutional buyers we can work to your standard
          purchase-order and invoicing terms.
        </P>
      </ProseSection>

      <ProseSection heading="Tell us what you need">
        <P>
          The more specific the better: quantity, material, size, what branding
          goes on it, and the date you need it by.
        </P>
        <ContactForm
          type={MessageType.WHOLESALE}
          submitLabel="Send enquiry"
          successHeading="Enquiry sent"
          defaultSubject="Bulk order enquiry"
          messageHint="Quantity, material, size, the branding you need, and your deadline. A sample photo or drawing helps a lot."
        />
      </ProseSection>
    </ProsePage>
  );
}
