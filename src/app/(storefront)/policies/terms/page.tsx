import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ProsePage,
  ProseSection,
  P,
  UL,
  LegalReviewNotice,
} from '@/components/prose-page';
import { siteConfig, real } from '@/lib/site-config';

/**
 * Terms and conditions — plan §15.1.
 *
 * Covers §15.1's list: who the seller is, scope, how an order forms a
 * contract and our right to refuse, prices and currency, payment, shipping and
 * risk of loss, customs, returns (cross-referenced), the handmade variation
 * disclaimer, warranty, limitation of liability, IP, the user-generated
 * content licence, prohibited uses, changes, governing law, and contact.
 *
 * §14.5 rules out generator legalese, so this is written to be understood.
 * §15 still requires a Bangladeshi lawyer to review it — see the notice.
 */

export const metadata: Metadata = {
  title: 'Terms & conditions',
  description:
    'The terms you agree to when you buy from us: how an order works, prices, delivery, returns, and the limits of our liability.',
  alternates: { canonical: '/policies/terms' },
};

export default function TermsPage() {
  const legalName = real(siteConfig.legal.legalName) || siteConfig.name;

  return (
    <ProsePage
      title="Terms and conditions"
      intro="The agreement between you and us when you order. Written plainly on purpose."
      crumbs={[{ label: 'Policies' }, { label: 'Terms' }]}
      updated="8 September 2026"
    >
      <LegalReviewNotice />

      <ProseSection heading="Who you are dealing with">
        <P>
          This site is operated by {legalName}, based at{' '}
          {real(siteConfig.address.line1)}, {real(siteConfig.address.line2)},{' '}
          {real(siteConfig.address.city)} - {real(siteConfig.address.postcode)},{' '}
          {siteConfig.address.country}. You can reach us on{' '}
          <a
            href={`tel:${siteConfig.contact.phone}`}
            className="text-jute-deep underline underline-offset-4"
          >
            {siteConfig.contact.phoneDisplay}
          </a>
          .
        </P>
        {!real(siteConfig.legal.tradeLicence) && (
          <P>
            <em>
              Trade licence and BIN details will be added here once
              registration is complete.
            </em>
          </P>
        )}
      </ProseSection>

      <ProseSection heading="How an order becomes a contract">
        <P>
          Adding something to your cart is not an order. Placing an order is an
          offer to buy. The contract forms when we confirm your order — not when
          you click, and not when you receive the automatic acknowledgement.
        </P>
        <P>
          We may decline an order. In practice this happens for three reasons:
          the item sold out between your order and our confirmation, the price
          shown was clearly wrong, or we cannot deliver to your address. If we
          decline, you pay nothing and we will tell you why.
        </P>
      </ProseSection>

      <ProseSection heading="Prices">
        <P>
          Prices are shown in Bangladeshi taka or US dollars and are set
          separately for each currency — we do not convert one into the other at
          checkout, so what you see is what you pay. Delivery is shown before
          the payment step, never after.
        </P>
        <P>
          Prices can change, but never for an order already confirmed. If a
          price is obviously wrong — an evident typing error rather than a
          bargain — we may cancel and refund rather than honour it.
        </P>
      </ProseSection>

      <ProseSection heading="Payment">
        <P>
          Cash on delivery is currently the payment method available on the
          site, up to ৳15,000 per order and within Bangladesh only. Card and
          mobile wallet payment will follow.
        </P>
        <P>
          When card payment goes live it will run entirely through the payment
          gateway&rsquo;s own hosted page. We will never see or store your card
          number.
        </P>
      </ProseSection>

      <ProseSection heading="Delivery and risk">
        <P>
          We dispatch in {siteConfig.promises.dispatchDays}. Delivery estimates
          are estimates, not guarantees, and they exclude customs delays.
        </P>
        <P>
          Responsibility for the goods passes to you on delivery. If a parcel
          arrives damaged, tell us within 48 hours and it is our problem to fix.
        </P>
        <P>
          Please give an address someone can receive a parcel at. If a delivery
          fails because the address was wrong or nobody could be reached after
          reasonable attempts, we may charge the return cost before resending.
        </P>
      </ProseSection>

      <ProseSection heading="Customs and import duties">
        <P>
          For international orders, import duties and taxes are not included in
          the price and are your responsibility. We declare the true value on
          customs paperwork. We will not under-declare a parcel to reduce your
          duty — it voids the insurance and creates legal exposure for both of
          us.
        </P>
      </ProseSection>

      <ProseSection heading="Handmade variation">
        <P>
          Everything sold here is made by hand from natural materials. Weave,
          grain, colour, and dimensions vary slightly between pieces and from
          the photographs. That variation is a property of the product, not a
          defect, and it is described further in the{' '}
          <Link
            href="/policies/refund"
            className="text-jute-deep underline underline-offset-4"
          >
            refund policy
          </Link>
          .
        </P>
      </ProseSection>

      <ProseSection heading="Returns">
        <P>
          Your return rights are set out in full in the{' '}
          <Link
            href="/policies/refund"
            className="text-jute-deep underline underline-offset-4"
          >
            refund and returns policy
          </Link>
          , which forms part of these terms. Where consumer law in your country
          gives you more than that policy does, the law applies.
        </P>
      </ProseSection>

      <ProseSection heading="Faults">
        <P>
          If a bag fails through a manufacturing or material fault in normal
          use, tell us and we will repair, replace, or refund it. Fair wear,
          accidental damage, and the natural ageing of leather are not faults.
        </P>
      </ProseSection>

      <ProseSection heading="What we are not liable for">
        <P>
          We are responsible for loss that follows foreseeably from us breaking
          these terms. We are not liable for indirect or consequential loss —
          lost profits, lost opportunity, or loss of data.
        </P>
        <P>
          Except where the law does not allow it, our total liability for any
          order is limited to what you paid for that order. Nothing here limits
          liability for death, personal injury, or fraud, because it cannot.
        </P>
      </ProseSection>

      <ProseSection heading="Your account">
        <P>
          If you create an account, keep the password to yourself and tell us if
          you think someone else has it. You are responsible for what happens
          under your account until you do.
        </P>
      </ProseSection>

      <ProseSection heading="Reviews and photographs you send us">
        <P>
          If you submit a review, photograph, or comment, you keep ownership of
          it. You give us a non-exclusive, royalty-free licence to show it on
          this site and in our own marketing.
        </P>
        <P>
          Only submit things that are yours to submit, and that are honest. We
          will remove content that is untrue, abusive, or infringes someone
          else&rsquo;s rights — but we do not remove reviews for being critical.
        </P>
      </ProseSection>

      <ProseSection heading="Our content">
        <P>
          The photographs, text, and designs on this site belong to us and may
          not be copied for commercial use without permission. Details are in
          the{' '}
          <Link
            href="/policies/intellectual-property"
            className="text-jute-deep underline underline-offset-4"
          >
            intellectual property notice
          </Link>
          .
        </P>
      </ProseSection>

      <ProseSection heading="Things you must not do">
        <UL>
          <li>Buy to resell as if the bags were your own work.</li>
          <li>Scrape, copy, or republish the catalogue or photographs.</li>
          <li>Attempt to break into, overload, or probe the site.</li>
          <li>Submit fake reviews, for us or against us.</li>
        </UL>
      </ProseSection>

      <ProseSection heading="Changes to these terms">
        <P>
          We may update these terms. The version that applies to your order is
          the one published when you placed it, and we will not change the terms
          of an order after the fact.
        </P>
      </ProseSection>

      <ProseSection heading="Governing law">
        <P>
          These terms are governed by the laws of Bangladesh, and the courts of
          Bangladesh have jurisdiction. If you are a consumer elsewhere, this
          does not remove protections your own law gives you.
        </P>
        <P>
          If something goes wrong, please talk to us before anything formal. We
          are a small workshop and we would far rather fix a problem than argue
          about it.
        </P>
      </ProseSection>
    </ProsePage>
  );
}
