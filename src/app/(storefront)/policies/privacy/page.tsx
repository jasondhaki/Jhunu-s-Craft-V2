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
 * Privacy policy — plan §15.2 and §13.8.
 *
 * §15.2's checklist is followed section by section. The important discipline
 * is that this describes what the code ACTUALLY does — the data we really
 * collect, the processors we really use — rather than a generic template.
 * A privacy policy that overstates collection is as wrong as one that
 * understates it.
 */

export const metadata: Metadata = {
  title: 'Privacy policy',
  description:
    'What personal data we collect, why, who processes it, how long we keep it, and how to get it deleted.',
  alternates: { canonical: '/policies/privacy' },
};

export default function PrivacyPolicyPage() {
  const contactEmail = real(siteConfig.contact.email);

  return (
    <ProsePage
      title="Privacy policy"
      intro="What we collect, why, and how to get rid of it. We collect as little as we can get away with."
      crumbs={[{ label: 'Policies' }, { label: 'Privacy' }]}
      updated="8 September 2026"
    >
      <LegalReviewNotice />

      <ProseSection heading="Who is responsible for your data">
        <P>
          {siteConfig.name}, {real(siteConfig.address.line1)},{' '}
          {real(siteConfig.address.line2)}, {real(siteConfig.address.city)} -{' '}
          {real(siteConfig.address.postcode)}, {siteConfig.address.country}.
        </P>
        <P>
          Reach us on{' '}
          <a
            href={`tel:${siteConfig.contact.phone}`}
            className="text-jute-deep underline underline-offset-4"
          >
            {siteConfig.contact.phoneDisplay}
          </a>
          {contactEmail && (
            <>
              {' '}or at{' '}
              <a
                href={`mailto:${contactEmail}`}
                className="text-jute-deep underline underline-offset-4"
              >
                {contactEmail}
              </a>
            </>
          )}
          .
        </P>
      </ProseSection>

      <ProseSection heading="What we collect">
        <P>Only what an order actually needs:</P>
        <UL>
          <li>
            <strong>To deliver your order:</strong> your name, delivery address,
            phone number, and email. The courier needs the first three; the
            fourth is how we send your confirmation.
          </li>
          <li>
            <strong>If you create an account:</strong> the same, plus a hashed
            password. We never store your password itself — only an Argon2id
            hash of it, which cannot be reversed.
          </li>
          <li>
            <strong>Your order history:</strong> what you bought, when, and
            what you paid.
          </li>
          <li>
            <strong>Technical data with each order:</strong> your IP address and
            browser, kept for fraud review.
          </li>
          <li>
            <strong>If you write a review:</strong> your name, rating, and text.
          </li>
        </UL>
        <P>
          We do <strong>not</strong> collect your date of birth, your gender, or
          anything else that has no bearing on selling you a bag. We never see
          or store card numbers.
        </P>
      </ProseSection>

      <ProseSection heading="Why we are allowed to hold it">
        <P>Under GDPR terms, our lawful bases are:</P>
        <UL>
          <li>
            <strong>Performing a contract</strong> — we cannot deliver a bag
            without an address.
          </li>
          <li>
            <strong>Legal obligation</strong> — order and tax records must be
            kept for a period set by law.
          </li>
          <li>
            <strong>Legitimate interest</strong> — basic fraud prevention, and
            keeping the site working.
          </li>
          <li>
            <strong>Your consent</strong> — marketing emails and analytics
            cookies, both off unless you turn them on.
          </li>
        </UL>
      </ProseSection>

      <ProseSection heading="Who else sees it">
        <P>
          As few people as possible. Each of these receives only what it needs
          to do its job:
        </P>
        <UL>
          <li>
            <strong>Vercel</strong> — hosts the website. Sees requests and IP
            addresses.
          </li>
          <li>
            <strong>Neon</strong> — hosts the database, in Singapore. Stores
            everything above.
          </li>
          <li>
            <strong>Resend</strong> — sends order emails. Sees your email
            address and the contents of those emails.
          </li>
          <li>
            <strong>Couriers</strong> — receive your name, address, and phone so
            they can deliver.
          </li>
          <li>
            <strong>Payment gateway</strong> — when card payment goes live, it
            will handle payment details directly. We will never see them.
          </li>
          <li>
            <strong>Analytics</strong> — only if you agree to analytics cookies.
          </li>
        </UL>
        <P>
          We do not sell your data. We do not share it for anyone else&rsquo;s
          advertising.
        </P>
      </ProseSection>

      <ProseSection heading="Where it goes">
        <P>
          Our database is hosted in Singapore and our hosting and email
          providers are based outside Bangladesh, so your data is transferred
          internationally. Those providers operate under their own data
          protection commitments.
        </P>
      </ProseSection>

      <ProseSection heading="How long we keep it">
        <UL>
          <li>
            <strong>Orders and invoices</strong> — for as long as accounting and
            tax rules require, even if you delete your account.
          </li>
          <li>
            <strong>Account details</strong> — until you delete your account.
          </li>
          <li>
            <strong>Abandoned carts</strong> — 30 days.
          </li>
          <li>
            <strong>Technical logs</strong> — 30 to 90 days.
          </li>
        </UL>
      </ProseSection>

      <ProseSection heading="Your rights">
        <P>You can ask us to:</P>
        <UL>
          <li>show you what we hold about you;</li>
          <li>correct anything wrong;</li>
          <li>delete your account and personal details;</li>
          <li>give you your data in a portable format;</li>
          <li>stop sending you marketing, at any time.</li>
        </UL>
        <P>
          Account deletion is built into the site — go to{' '}
          <Link
            href="/account/profile"
            className="text-jute-deep underline underline-offset-4"
          >
            your profile
          </Link>
          . It permanently removes your name, email, phone, and saved addresses.
          Past orders stay as accounting records but are no longer linked to
          you. For anything else, just ask.
        </P>
      </ProseSection>

      <ProseSection heading="Security">
        <P>
          Everything runs over HTTPS. Passwords are hashed with Argon2id, never
          stored as text. Session tokens are stored only as hashes, so a
          database leak would not hand over live sessions. Admin access is
          restricted and every change is logged.
        </P>
        <P>
          No system is perfect. If we ever discover a breach affecting you, we
          will tell you rather than hope you do not notice.
        </P>
      </ProseSection>

      <ProseSection heading="Cookies">
        <P>
          Covered separately on the{' '}
          <Link
            href="/policies/cookies"
            className="text-jute-deep underline underline-offset-4"
          >
            cookie policy
          </Link>
          , including how to change your mind.
        </P>
      </ProseSection>

      <ProseSection heading="Children">
        <P>
          This site is not intended for children, and we do not knowingly
          collect data from anyone under 16. If you believe a child has given us
          personal data, tell us and we will delete it.
        </P>
      </ProseSection>

      <ProseSection heading="Changes, and how to complain">
        <P>
          If this policy changes materially we will update the date at the top.
          If you are unhappy with how we have handled your data, tell us first —
          we would rather fix it. You also have the right to complain to your
          local data protection authority.
        </P>
      </ProseSection>
    </ProsePage>
  );
}
