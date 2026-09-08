import type { Metadata } from 'next';
import { ProsePage, ProseSection, P, UL } from '@/components/prose-page';

/**
 * Bag care — plan §6.9.
 *
 * "Separate care blocks for jute and leather, storage advice, what to do if it
 * gets wet, HOW TO HANDLE MOLD IN HUMID WEATHER (very relevant in Bangladesh,
 * and a real credibility signal)."
 *
 * §17.5 lists "how to care for a jute bag in humid weather" as content that
 * both ranks and genuinely helps — written for Dhaka, not copied from a
 * temperate-climate care card.
 */

export const metadata: Metadata = {
  title: 'Bag care',
  description:
    'How to look after jute and leather bags in a humid climate — cleaning, drying, storage, and what to do about mould.',
  alternates: { canonical: '/care' },
};

export default function CarePage() {
  return (
    <ProsePage
      title="Looking after your bag"
      intro="Written for the weather here, not copied from a care card made for somewhere cold and dry."
      crumbs={[{ label: 'Bag care' }]}
    >
      <ProseSection heading="Jute — the short version">
        <UL>
          <li>Spot-clean with a barely damp cloth. Never soak or machine wash.</li>
          <li>Dry in the shade, never in direct sun — sun fades and weakens the fibre.</li>
          <li>Never put it away damp. This is the one that actually matters.</li>
          <li>Store somewhere airy with the flap open, stuffed with paper to hold its shape.</li>
        </UL>
      </ProseSection>

      <ProseSection heading="Mould, and how to deal with it">
        <P>
          In a Dhaka monsoon, a jute bag put away damp in a closed cupboard will
          grow mould. This is not a defect in the bag; it is what natural fibre
          does in still, humid air. It is also entirely preventable and usually
          fixable.
        </P>
        <P>
          <strong>Preventing it:</strong> let the bag dry completely before
          storing, leave it somewhere with moving air rather than a sealed
          plastic box, and take it out every few weeks in the wet season. A
          silica sachet inside helps. A plastic bag is the worst possible
          storage — it traps every bit of moisture against the fibre.
        </P>
        <P>
          <strong>If it has already happened:</strong> take the bag outside and
          brush the surface mould off with a dry brush — do this outdoors so you
          are not spreading spores indoors. Wipe with a cloth barely dampened
          with a weak vinegar solution, roughly one part white vinegar to four
          parts water. Then dry it fully in shade with good airflow, which may
          take a day or two. Do not use bleach; it will destroy the fibre and
          the colour.
        </P>
        <P>
          If the mould has gone through into the lining and come back after
          drying, the bag is probably past saving. Tell us anyway — if it
          happened quickly and in normal use, we want to know.
        </P>
      </ProseSection>

      <ProseSection heading="Leather — the short version">
        <UL>
          <li>Wipe with a dry cloth after use.</li>
          <li>Condition with a neutral leather cream two or three times a year.</li>
          <li>Keep it away from direct heat. Never dry it with a hairdryer.</li>
          <li>Store in the cotton dust bag, never in plastic.</li>
        </UL>
      </ProseSection>

      <ProseSection heading="If leather gets soaked">
        <P>
          Blot it with a dry cloth — do not rub, which pushes water into the
          grain. Stuff the bag with paper to hold its shape and let it dry
          slowly at room temperature, away from any heat source. Drying leather
          fast is what makes it go hard and crack, and it cannot be undone.
        </P>
        <P>
          Once it is completely dry, condition it. Leather loses oils when it
          gets wet and dries, and putting them back is the difference between a
          bag that recovers and one that stiffens.
        </P>
        <P>
          Water marks may remain. On vegetable-tanned leather they usually blend
          in over a few weeks of use.
        </P>
      </ProseSection>

      <ProseSection heading="Mould on leather">
        <P>
          Less common than on jute but it happens in a long wet season. Wipe it
          off outdoors with a cloth lightly dampened with the same weak vinegar
          solution, let it dry fully in the shade, then condition it. Never use
          bleach or a household cleaner on leather.
        </P>
      </ProseSection>

      <ProseSection heading="Ageing is not damage">
        <P>
          Vegetable-tanned leather darkens with use and light. The parts you
          handle most darken first. Corners soften. On drum-dyed pieces a scuff
          shows the same colour underneath rather than a pale scar.
        </P>
        <P>
          None of that is wear in the sense of damage — it is the material doing
          what it is supposed to do, and it is why the bag will look like yours
          rather than like everyone else&rsquo;s.
        </P>
      </ProseSection>

      <ProseSection heading="Mixed jute and leather bags">
        <P>
          Treat the two parts separately. Spot-clean the jute and dry it in
          shade; wipe the leather dry and condition it a few times a year. Never
          soak the whole bag to clean one part of it — the jute will take days
          to dry and the leather will not thank you either.
        </P>
      </ProseSection>

      <ProseSection heading="Repairs">
        <P>
          If a seam goes or hardware fails, tell us. We made it, so we can
          usually mend it — and a bag repaired is better than a bag replaced, for
          you and for us.
        </P>
      </ProseSection>
    </ProsePage>
  );
}
