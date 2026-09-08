import type { Metadata } from 'next';
import { MessageType } from '@prisma/client';
import { ProsePage, ProseSection, P, UL } from '@/components/prose-page';
import { ContactForm } from '@/components/contact-form';

/**
 * Wholesale — plan §6.9 and §15.7.
 *
 * "MOQ, lead times, pricing approach, an enquiry form. International boutiques
 * and gift shops are a real channel for handmade goods."
 *
 * §26.5 rates wholesale outreach highly: "one wholesale account can equal
 * months of retail orders." The honest constraint — one maker, real lead
 * times — is stated plainly rather than discovered later, because a buyer who
 * is let down once does not come back.
 */

export const metadata: Metadata = {
  title: 'Wholesale',
  description:
    'Handmade jute and leather bags for shops, galleries, and gift stores. Small minimums, honest lead times.',
  alternates: { canonical: '/wholesale' },
};

export default function WholesalePage() {
  return (
    <ProsePage
      title="Wholesale"
      intro="For shops, galleries, museum stores, and anyone selling to people who care where things come from."
      crumbs={[{ label: 'Wholesale' }]}
    >
      <ProseSection heading="The honest constraint, first">
        <P>
          Everything is made by one person. That is the selling point for your
          customers and the limitation for you, and it would be unfair to bury
          it below the pricing.
        </P>
        <P>
          It means we cannot fill a large order quickly, and we would rather
          turn one down than accept it and miss the date. What we can do is a
          steady, reliable supply of small batches — which for most independent
          shops is what actually sells.
        </P>
      </ProseSection>

      <ProseSection heading="Minimum order">
        <P>
          Ten pieces, which can be mixed across designs and colours. We keep it
          low deliberately: a shop should be able to test whether these sell
          before committing to a season of them.
        </P>
      </ProseSection>

      <ProseSection heading="Lead times">
        <UL>
          <li>
            <strong>10–20 pieces</strong> — usually three to four weeks.
          </li>
          <li>
            <strong>20–50 pieces</strong> — six to eight weeks.
          </li>
          <li>
            <strong>More than that</strong> — talk to us before you plan around
            it. We will give you a real answer, including no.
          </li>
        </UL>
        <P>
          Repeat orders of something already in production are faster than a
          first order of something new.
        </P>
      </ProseSection>

      <ProseSection heading="Pricing">
        <P>
          Wholesale pricing is tiered by volume and quoted per order, because it
          depends on the mix — leather pieces have a very different material
          cost from jute ones.
        </P>
        <P>
          As a guide, expect a meaningful discount on retail at the minimum
          order, improving with volume. We will not quote a headline percentage
          here that turns out to have conditions attached.
        </P>
      </ProseSection>

      <ProseSection heading="What we provide">
        <UL>
          <li>Photographs you may use for your own listings and marketing.</li>
          <li>
            The maker&rsquo;s name and the story behind the bags, which is
            usually what sells them.
          </li>
          <li>Care cards to pass on to your customers.</li>
          <li>Consistent SKUs, so reordering is simple.</li>
        </UL>
      </ProseSection>

      <ProseSection heading="Shipping and payment">
        <P>
          Wholesale orders ship by courier, at cost. International orders go by
          DHL; duties and import charges are the buyer&rsquo;s responsibility,
          as with any import.
        </P>
        <P>
          Payment is half on order and half before dispatch. For a first order
          we will usually arrange a bank transfer directly rather than through
          the website.
        </P>
      </ProseSection>

      <ProseSection heading="Get in touch">
        <P>
          Tell us about your shop, what you are drawn to, rough quantities, and
          any date you are working towards.
        </P>
        <ContactForm
          type={MessageType.WHOLESALE}
          submitLabel="Send enquiry"
          successHeading="Enquiry sent"
          defaultSubject="Wholesale enquiry"
          messageHint="Your shop and where it is, which pieces interest you, rough quantities, and any deadline."
        />
      </ProseSection>
    </ProsePage>
  );
}
