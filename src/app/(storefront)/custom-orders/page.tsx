import type { Metadata } from 'next';
import { MessageType } from '@prisma/client';
import { ProsePage, ProseSection, P, UL } from '@/components/prose-page';
import { ContactForm } from '@/components/contact-form';
import { siteConfig, real } from '@/lib/site-config';

/**
 * Custom orders — plan §6.9 and §15.7.
 *
 * "What he can customize (size, color, strap length, monogram), lead time,
 * price range, and an enquiry form."
 *
 * §15.7 also wants custom order terms stated: deposit, lead time, and the fact
 * that custom items are not returnable. Those are here rather than buried in
 * the terms page, because this is where someone decides.
 */

export const metadata: Metadata = {
  title: 'Custom orders',
  description:
    'Have a bag made to your own size, colour, or strap length. What is possible, how long it takes, and what it costs.',
  alternates: { canonical: '/custom-orders' },
};

export default function CustomOrdersPage() {
  const maker = real(siteConfig.maker.name, 'the maker');

  return (
    <ProsePage
      title="Custom orders"
      intro="If the bag you want does not exist yet, it can sometimes be made."
      crumbs={[{ label: 'Custom orders' }]}
    >
      <ProseSection heading="What can usually be changed">
        <UL>
          <li>
            <strong>Size</strong> — within reason. Making an existing design
            larger or smaller is straightforward; a completely new shape needs a
            new pattern and costs more.
          </li>
          <li>
            <strong>Colour</strong> — from the leathers and jute currently in
            the workshop. We will not promise a colour we cannot source.
          </li>
          <li>
            <strong>Strap length and type</strong> — longer, shorter,
            detachable, or a different fitting.
          </li>
          <li>
            <strong>A monogram</strong> — initials, blind-embossed into the
            leather.
          </li>
          <li>
            <strong>Interior</strong> — an extra pocket, a padded laptop sleeve,
            a different lining.
          </li>
        </UL>
      </ProseSection>

      <ProseSection heading="What usually cannot">
        <P>
          Copies of another brand&rsquo;s design. Beyond the obvious problem
          with it, {maker} would rather make something that is his.
        </P>
        <P>
          Very large matching orders at short notice — see{' '}
          <a href="/wholesale" className="text-jute-deep underline underline-offset-4">
            wholesale
          </a>{' '}
          for what is realistic.
        </P>
      </ProseSection>

      <ProseSection heading="How long it takes">
        <P>
          Usually two to four weeks from agreeing the details, depending on what
          else is on the bench and whether the material is in stock. You will
          get a real date before anything is agreed, not an optimistic one.
        </P>
      </ProseSection>

      <ProseSection heading="What it costs">
        <P>
          A variation on an existing design — a different colour, a longer
          strap, a monogram — is usually the normal price plus a small amount
          for the extra work.
        </P>
        <P>
          A new pattern costs more, because the pattern itself takes time to
          make and get right. We will quote before starting, and the quote is
          the price.
        </P>
      </ProseSection>

      <ProseSection heading="The terms, stated up front">
        <UL>
          <li>
            <strong>Half up front</strong> for a genuinely custom piece, the
            rest before it ships. The deposit covers the material, which is
            bought specifically for you.
          </li>
          <li>
            <strong>Custom pieces are not returnable.</strong> A bag made to
            your measurements with your initials on it cannot be sold to anyone
            else. This is the one exception to our normal return policy, and it
            is why we agree everything in writing before starting.
          </li>
          <li>
            <strong>Faults are still faults.</strong> If a custom bag has a
            manufacturing defect we will repair or replace it, exactly as with
            anything else.
          </li>
        </UL>
      </ProseSection>

      <ProseSection heading="Tell us what you have in mind">
        <P>
          The more detail the better — what you want to carry in it, roughly
          what size, and any bag you already own that is nearly right.
        </P>
        <ContactForm
          type={MessageType.CUSTOM_ORDER}
          submitLabel="Send enquiry"
          successHeading="Enquiry sent"
          defaultSubject="Custom order enquiry"
          messageHint="What you want to carry, roughly what size, which colour, and when you need it by."
        />
      </ProseSection>
    </ProsePage>
  );
}
