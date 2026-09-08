import type { Metadata } from 'next';
import { ProsePage, ProseSection, P, UL } from '@/components/prose-page';
import { siteConfig, real } from '@/lib/site-config';

/**
 * Intellectual property notice — plan §16.
 *
 * Covers §16.1 (protecting our own work) and §16.2 (respecting other
 * people's). The licence acknowledgements matter: §16.2 asks for a record of
 * every font and icon set with its licence and source, and this page is the
 * public half of that record.
 */

export const metadata: Metadata = {
  title: 'Intellectual property',
  description:
    'Who owns the photographs, designs, and text on this site, what you may do with them, and the licences behind the fonts and icons we use.',
  alternates: { canonical: '/policies/intellectual-property' },
};

export default function IpNoticePage() {
  return (
    <ProsePage
      title="Intellectual property"
      intro="What is ours, what you are welcome to do with it, and credit where it is due."
      crumbs={[{ label: 'Policies' }, { label: 'IP notice' }]}
      updated="8 September 2026"
    >
      <ProseSection heading="Our work">
        <P>
          © {siteConfig.legal.copyrightYear} {siteConfig.name}. The
          photographs, product designs, written descriptions, and the design of
          this site are ours.
        </P>
        <P>
          Every photograph here is taken by us, of bags we made. We do not use
          stock imagery — partly because it would be dishonest, and partly
          because the entire point is that these are real objects made by a real
          person.
        </P>
      </ProseSection>

      <ProseSection heading="What you are welcome to do">
        <UL>
          <li>Link to any page here, anywhere. Please do.</li>
          <li>
            Post a photograph of a bag you bought, including on social media.
            That photograph is yours.
          </li>
          <li>
            Quote a short passage with a link back, for a review or an article.
          </li>
        </UL>
      </ProseSection>

      <ProseSection heading="What you may not do">
        <UL>
          <li>
            Copy our photographs or descriptions to sell bags, whether ours or
            anyone else&rsquo;s.
          </li>
          <li>Use our name or logo in a way that implies we endorse you.</li>
          <li>Scrape the catalogue in order to republish it.</li>
        </UL>
        <P>
          If you have copied something and would like permission, just ask. The
          answer is often yes.
        </P>
      </ProseSection>

      <ProseSection heading="If you think we have infringed yours">
        <P>
          Tell us, with enough detail to identify the material. We will take it
          down while we look into it rather than argue first.
        </P>
      </ProseSection>

      <ProseSection heading="Licences we rely on">
        <P>
          §16.2 asks us to keep a record of what we use and under what licence,
          so here it is:
        </P>
        <UL>
          <li>
            <strong>Fraunces, Work Sans, and Hind Siliguri</strong> —
            typefaces, SIL Open Font Licence, free for commercial use.
            Self-hosted, so visiting this site makes no request to a font
            provider.
          </li>
          <li>
            <strong>Lucide</strong> — interface icons, ISC licence.
          </li>
          <li>
            <strong>Simple Icons</strong> — the social media marks, CC0. The
            marks themselves remain the trademarks of their owners and are used
            only to link to our own profiles.
          </li>
        </UL>
      </ProseSection>

      {!real(siteConfig.legal.legalName) && (
        <ProseSection heading="Registration">
          <P>
            <em>
              Trademark and business registration details will be added here
              once those are complete.
            </em>
          </P>
        </ProseSection>
      )}
    </ProsePage>
  );
}
