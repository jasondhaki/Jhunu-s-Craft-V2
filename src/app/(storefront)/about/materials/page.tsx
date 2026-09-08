import type { Metadata } from 'next';
import Link from 'next/link';
import { ProsePage, ProseSection, P, UL } from '@/components/prose-page';

/**
 * Materials — plan §6.9.
 *
 * "Where the jute comes from, what kind of leather, why, what the hardware is."
 *
 * §1.4: specific over superlative. "Full-grain buffalo leather, 1.4 mm" beats
 * "premium quality leather", and it is also the answer to the FAQ question
 * customers actually ask — is the leather real.
 *
 * §17.5 lists "how to tell real leather from PU" and "why jute is a
 * sustainable material" as content that both ranks and genuinely helps.
 */

export const metadata: Metadata = {
  title: 'Materials',
  description:
    'What full-grain leather actually means, why jute is grown here, and how to tell real leather from the labels that pretend to be it.',
  alternates: { canonical: '/about/materials' },
};

export default function MaterialsPage() {
  return (
    <ProsePage
      title="Materials"
      intro="What everything is made of, in enough detail to check we are telling the truth."
      crumbs={[{ label: 'Our story', href: '/about' }, { label: 'Materials' }]}
    >
      <ProseSection heading="Jute">
        <P>
          Jute is a plant fibre, and Bangladesh grows most of the
          world&rsquo;s supply — so using it here is not a marketing decision,
          it is simply the material that is to hand and grown well.
        </P>
        <P>
          It needs little irrigation and few pesticides, it grows in months
          rather than years, and it biodegrades completely at the end of its
          life. For carrying shopping it is genuinely better than a synthetic
          bag: lighter, stronger for its weight, and it does not sweat.
        </P>
        <P>
          Its honest weakness is water. Jute does not like being wet and it
          will grow mould if put away damp, which matters here more than in
          most places. That is covered on the{' '}
          <Link href="/care" className="text-jute-deep underline underline-offset-4">
            care page
          </Link>
          .
        </P>
      </ProseSection>

      <ProseSection heading="Leather">
        <P>
          Full-grain buffalo leather, 1.4 mm, vegetable tanned.
        </P>
        <P>
          Each of those words is doing work, so here is what they mean:
        </P>
        <UL>
          <li>
            <strong>Full-grain</strong> means the outer surface of the hide is
            left intact. Most leather sold as &ldquo;genuine leather&rdquo; has
            been sanded smooth to remove blemishes and then embossed with a
            printed grain — it looks flawless and it wears badly, because the
            strongest fibres have been ground away.
          </li>
          <li>
            <strong>1.4 mm</strong> is the thickness. Thick enough to hold
            structure and take a burnished edge, thin enough not to make the
            bag a burden.
          </li>
          <li>
            <strong>Vegetable tanned</strong> means tanned with plant tannins
            rather than chromium salts. It takes weeks instead of days, and it
            is why the leather darkens and softens with use instead of staying
            the same until it cracks.
          </li>
        </UL>
      </ProseSection>

      <ProseSection heading="How to tell real leather from the alternatives">
        <P>
          A fair question, and one worth being able to answer for yourself
          rather than taking our word for it:
        </P>
        <UL>
          <li>
            <strong>Look at a cut edge.</strong> Real leather is fibrous
            through its thickness. Coated fabric shows a uniform backing.
          </li>
          <li>
            <strong>Look for variation.</strong> Real hide has pores, grain
            that changes across a panel, and the occasional scar. A perfectly
            even texture repeating every few centimetres is a print.
          </li>
          <li>
            <strong>Press it.</strong> Full-grain wrinkles into fine lines and
            settles back. Coated surfaces crease.
          </li>
          <li>
            <strong>Smell it.</strong> Vegetable-tanned leather smells of
            leather. Synthetic smells faintly of plastic.
          </li>
        </UL>
      </ProseSection>

      <ProseSection heading="Hardware and thread">
        <P>
          Solid brass rings, buckles, and fittings, in an antique finish. Brass
          is used rather than plated steel because plating wears through and
          the steel underneath rusts — particularly in humidity.
        </P>
        <P>
          Thread is waxed: cotton on jute pieces, polyester on leather ones,
          where the extra strength matters more than the material matching.
          Linings are cotton twill.
        </P>
      </ProseSection>

      <ProseSection heading="Being straight about the eco claim">
        <P>
          Our logo says eco-friendly, so it is worth being precise rather than
          leaning on the word.
        </P>
        <P>
          Jute genuinely is: locally grown, low-input, fully biodegradable. A
          jute-only bag is the more sustainable thing we sell, by a distance.
        </P>
        <P>
          Leather is not biodegradable in the same way, and brass hardware is
          mined metal. What leather has instead is longevity — a well-made
          leather bag replaces several cheap ones, and the most wasteful bag is
          the one thrown away after a year. Both of those things are true at
          once, and we would rather say so than imply everything here is
          equally green.
        </P>
      </ProseSection>
    </ProsePage>
  );
}
