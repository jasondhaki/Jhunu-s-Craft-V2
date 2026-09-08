import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
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
    'Who makes these bags, where, and how. A workshop of ten to twenty people in Dhaka, founded and run by James Dilip Dhaki.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  const maker = real(siteConfig.maker.name, 'One maker');
  const location = real(siteConfig.maker.location);
  const years = siteConfig.maker.yearsOfExperience;

  return (
    <ProsePage
      title={`Made by ${maker}`}
      intro={`A workshop of ten to twenty people${location ? ` in ${location}` : ''}, founded and run by ${maker}.`}
      crumbs={[{ label: 'Our story' }]}
    >
      {/* §6.8 asks for a portrait of the founder. We do not have one yet, so
          this is the workshop itself — which is arguably the more honest
          opening image for a business whose correction was "it is a team, not
          one man". A portrait can replace it when one exists. */}
      <figure className="-mx-4 sm:mx-0">
        <Image
          src="/Employees at work.jpeg"
          alt="The workshop floor: around eight people working at rows of blue industrial sewing machines, with finished bags stacked in the foreground"
          width={1280}
          height={960}
          priority
          sizes="(min-width: 1140px) 1140px, 100vw"
          className="aspect-4/3 w-full object-cover sm:rounded-lg"
        />
        <figcaption className="text-muted mt-2 px-4 text-xs sm:px-0">
          The workshop in {location || 'Dhaka'}.
        </figcaption>
      </figure>

      <ProseSection heading="What this is">
        <P>
          {maker} founded this workshop {years} years ago and still runs it. He
          does not make every bag himself — a team of ten to twenty people
          does, on industrial machines, in our own premises in{' '}
          {location || 'Dhaka'}.
        </P>
        <P>
          That distinction matters, so we would rather state it than let a
          photograph imply otherwise. This is not one craftsman at a bench, and
          it is not an anonymous factory taking whatever order comes in. It is
          a small workshop where the person whose name is on the door is in the
          building, and where the people cutting and stitching are employed by
          us rather than subcontracted out.
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
        <figure>
          <Image
            src="/sewers at work.jpeg"
            alt="A woman stitching a printed panel at an industrial sewing machine, with a stack of cut panels beside her"
            width={1200}
            height={1600}
            loading="lazy"
            sizes="(min-width: 768px) 560px, 100vw"
            className="border-line rounded-md border object-cover"
          />
          <figcaption className="text-muted mt-2 text-xs">
            Cut panels going through the machine.
          </figcaption>
        </figure>

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
          Most of our work has been bulk orders — promotional totes, school
          bags, branded bags for organisations. Those are made to someone
          else&rsquo;s brief and carry someone else&rsquo;s logo. Selling
          directly is how the workshop&rsquo;s own designs reach people who
          would want them.
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
