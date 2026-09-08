import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ProsePage,
  ProseSection,
  P,
  UL,
  LegalReviewNotice,
} from '@/components/prose-page';
import { siteConfig } from '@/lib/site-config';

/**
 * Refund and return policy — plan §15.4.
 *
 * "The most-read policy page." Written in plain language per §14.5, which
 * rules out copy-pasted legalese from a generator.
 *
 * §15.4's required points, all covered below: return window, condition,
 * what is non-returnable, how to start a return, who pays return shipping
 * (domestic vs international, explicitly), refund method and timeline,
 * exchanges, damaged or wrong items, the handmade-variation clause,
 * cancellation before dispatch, and COD refusal.
 */

export const metadata: Metadata = {
  title: 'Refunds & returns',
  description:
    'Our return window, who pays return postage, how long refunds take, and what natural variation in a handmade bag does and does not mean.',
  alternates: { canonical: '/policies/refund' },
};

const DAYS = siteConfig.promises.returnWindowDays;

export default function RefundPolicyPage() {
  return (
    <ProsePage
      title="Refunds and returns"
      intro="Written to be read, not to be survived. If anything here is unclear, call us and ask."
      crumbs={[{ label: 'Policies' }, { label: 'Refunds & returns' }]}
      updated="8 September 2026"
    >
      <LegalReviewNotice />

      <ProseSection heading={`The short version`}>
        <P>
          You have {DAYS} days from delivery to send anything back, unused and
          in its original packaging, for any reason at all. If something is
          faulty, wrong, or damaged, we pay the postage both ways and we do not
          argue about it.
        </P>
      </ProseSection>

      <ProseSection heading="Your return window">
        <P>
          {DAYS} days from the day your order is delivered. Tell us inside that
          window — you do not have to have posted it back by then, just told us
          you are returning it.
        </P>
        <P>
          If you are in the EU or the UK, you have a statutory right to cancel a
          distance purchase within 14 days regardless of what this page says.
          Where the law gives you more than we do, the law wins.
        </P>
      </ProseSection>

      <ProseSection heading="What condition it needs to be in">
        <P>
          Unused, with any tags still attached, in the packaging it arrived in.
          Trying a bag on and deciding it is not for you is fine. Carrying your
          shopping in it for a week is not.
        </P>
      </ProseSection>

      <ProseSection heading="What cannot be returned">
        <UL>
          <li>
            Custom or monogrammed pieces, because nobody else can use them.
          </li>
          <li>Anything visibly used or damaged after delivery.</li>
        </UL>
        <P>
          Sale items <strong>can</strong> be returned on the same terms as
          anything else. We do not think a discount should cost you your rights.
        </P>
      </ProseSection>

      <ProseSection heading="Natural variation is not a fault">
        <P>
          This is the one that matters most, so please read it before ordering.
        </P>
        <P>
          Every bag is cut and stitched by hand from natural materials. Jute
          weave varies. Leather grain varies, and so does how it takes dye. Two
          bags of the same design will not be identical, and neither will match
          a photograph exactly — screens differ too.
        </P>
        <P>
          That variation is what handmade means and it is not a defect. It is
          not, on its own, grounds for us to treat a return as faulty. You can
          still return the bag under the {DAYS}-day window like any other change
          of mind — you would just be covering the return postage.
        </P>
        <P>
          If something is genuinely wrong — a seam coming apart, hardware that
          does not work, damage in transit — that is a different thing entirely,
          and it is on us.
        </P>
      </ProseSection>

      <ProseSection heading="How to start a return">
        <P>Three steps, no forms to download:</P>
        <UL>
          <li>
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
              message us
            </Link>{' '}
            with your order number and what is wrong.
          </li>
          <li>
            We will confirm the return address and tell you whether we are
            covering the postage.
          </li>
          <li>
            Send it back. Keep the receipt until your refund arrives — we may
            need the tracking number.
          </li>
        </UL>
      </ProseSection>

      <ProseSection heading="Who pays the return postage">
        <UL>
          <li>
            <strong>Faulty, damaged, or the wrong item:</strong> we do, always,
            domestic or international.
          </li>
          <li>
            <strong>Changed your mind, inside Bangladesh:</strong> you do.
          </li>
          <li>
            <strong>Changed your mind, international:</strong> you do, and it is
            worth checking the cost first — returning a bag from Europe can
            approach what the bag cost.
          </li>
        </UL>
        <P>
          Original delivery charges are refunded only when the return is our
          fault.
        </P>
      </ProseSection>

      <ProseSection heading="Refunds">
        <P>
          Five to ten working days after the bag reaches us and we have checked
          it. We refund to the way you paid wherever possible.
        </P>
        <P>
          For a cash-on-delivery order there is nothing to refund
          automatically — we will arrange it with you directly, usually by
          mobile transfer.
        </P>
      </ProseSection>

      <ProseSection heading="Exchanges">
        <P>
          We do not run a formal exchange process, because with small batches
          the thing you want may not exist right now. Return the bag for a
          refund and order the one you want; if it is a stock problem, call us
          and we will hold something for you.
        </P>
      </ProseSection>

      <ProseSection heading="Cancelling before it ships">
        <P>
          Free and easy. Call us with your order number. Once it is with the
          courier we cannot recall it, but you can still return it.
        </P>
      </ProseSection>

      <ProseSection heading="Refusing a cash-on-delivery parcel">
        <P>
          Please do not do this if you have simply changed your mind — call us
          instead and cancel. A refused parcel costs us the courier fee in both
          directions on a bag that was made by hand for you.
        </P>
        <P>
          Repeatedly refusing cash-on-delivery orders may mean we ask for
          payment up front on future orders.
        </P>
      </ProseSection>

      <ProseSection heading="If we get it wrong">
        <P>
          Wrong bag, missing item, or damage in transit: tell us within 48 hours
          of delivery with a photograph if you can, and we will replace it or
          refund you in full, including all postage. No return postage, no
          argument.
        </P>
      </ProseSection>
    </ProsePage>
  );
}
