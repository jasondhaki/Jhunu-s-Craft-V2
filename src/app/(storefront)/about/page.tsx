import type { Metadata } from 'next';
import Link from 'next/link';
import { ProsePage, ProseSection, P } from '@/components/prose-page';
import { buttonClasses } from '@/components/ui/button';
import { siteConfig, real } from '@/lib/site-config';

/**
 * About / our story — plan §6.8, "the emotional core of the site".
 *
 * §6.8 asks for "his story in HIS VOICE: how he learned, how long, why bags,
 * what he cares about."
 *
 * That copy cannot be written here, and inventing it would be the single most
 * damaging thing on the site — §1.4 wants plain, warm, first-person truth, and
 * a fabricated origin story is exactly the "luxury cosplay" it warns against.
 * §14.5 rules it out outright.
 *
 * So this page ships with what is verifiably true (the maker's name, where he
 * works, how long, what he makes, how he makes it) and marks the places his
 * own words belong. It reads as a real, if short, page rather than as a
 * placeholder — and it is honest, which is the whole proposition.
 *
 * Tracked as CONTEXT.md Q17.
 */

export const metadata: Metadata = {
  title: 'Our story',
  description:
    'Who makes these bags, where, and how. One person, by hand, in a small workshop in Dhaka.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  const maker = real(siteConfig.maker.name, 'One maker');
  const location = real(siteConfig.maker.location);
  const years = siteConfig.maker.yearsOfExperience;

  return (
    <ProsePage
      title={`Made by ${maker}`}
      intro={`Every bag on this site is cut, stitched, and finished by one person${location ? `, in a small workshop in ${location}` : ''}.`}
      crumbs={[{ label: 'Our story' }]}
    >
      {/* §6.8 — "Opening portrait of your father, full-bleed." */}
      <div
        className="border-line bg-paper-sunk -mx-4 flex aspect-4/3 items-center justify-center border-y sm:mx-0 sm:rounded-lg sm:border"
        role="img"
        aria-label={`Portrait of ${maker} at work, coming soon`}
      >
        <p className="text-muted max-w-64 p-6 text-center text-sm">
          A portrait of {maker} at work goes here. We do not use stock
          photography, so this space stays empty until the real one exists.
        </p>
      </div>

      <ProseSection heading="What this is">
        <P>
          {maker} has been making bags by hand for {years} years. Not a
          workshop with staff, and not a factory — one person, one bench, and
          a small number of bags at a time.
        </P>
        <P>
          That is the whole proposition, and it is the one thing a large
          retailer cannot copy. It is also why stock runs out, why some pieces
          are made to order, and why no two bags are quite identical.
        </P>
      </ProseSection>

      <ProseSection heading="How a bag actually gets made">
        <P>
          Material is chosen and cut around its flaws — leather has scars and
          jute has slubs, and working around them is most of the skill. Panels
          are cut by hand against a pattern rather than stamped. Edges are
          skived, seams stitched, hardware set, and edges burnished by hand.
        </P>
        <P>
          The stitching is the slow part and the part that decides how long the
          bag lasts. Every stress point is double-stitched, and the leather on
          our mixed pieces is stitched <em>through</em> the jute rather than
          glued to it — which is why the handles do not come away.
        </P>
        <P>
          <Link
            href="/about/process"
            className="text-jute-deep underline underline-offset-4"
          >
            The full process, step by step
          </Link>
        </P>
      </ProseSection>

      <ProseSection heading="The materials">
        <P>
          Jute is grown here — Bangladesh produces most of the world&rsquo;s
          supply — and it is light, strong for its weight, and completely
          biodegradable. The leather is full-grain buffalo hide, 1.4 mm,
          vegetable tanned, with the outer surface left intact rather than
          sanded down and embossed with an artificial grain.
        </P>
        <P>
          <Link
            href="/about/materials"
            className="text-jute-deep underline underline-offset-4"
          >
            More about where the materials come from
          </Link>
        </P>
      </ProseSection>

      {/*
        §6.8 wants his own account here — how he learned, why bags, what he
        cares about. Left as a clearly-marked gap rather than invented.
      */}
      <ProseSection heading="In his own words">
        <div className="border-line rounded-md border border-dashed p-5">
          <p className="text-muted text-sm">
            <strong>To be written by {maker}.</strong> Plan §6.8 asks for this
            in his own voice — how he learned, why bags, and what he cares
            about — and §22 rules out writing it for him. A few honest
            paragraphs from him will do more for this page than anything we
            could draft.
          </p>
        </div>
      </ProseSection>

      <ProseSection heading="Why we are online now">
        <P>
          Because good work made by one person is hard to find unless you
          already know where to look. A website is simply a way for the bags to
          reach people who would want them.
        </P>
      </ProseSection>

      <div className="pt-4">
        <Link href="/shop" className={buttonClasses('primary', 'lg')}>
          See the bags
        </Link>
      </div>
    </ProsePage>
  );
}
