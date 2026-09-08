import type { Metadata } from 'next';
import Link from 'next/link';
import { ProsePage, P } from '@/components/prose-page';
import { siteConfig, real } from '@/lib/site-config';

/**
 * How a bag is made — plan §6.9.
 *
 * "Step-by-step, photographed: selecting material → pattern → cutting →
 * skiving/edging → stitching → hardware → finishing → inspection."
 *
 * This genuinely IS a sequence, so numbering is appropriate here (§6.1.9 makes
 * that distinction explicitly — numbers elsewhere would be decoration).
 *
 * §17.5 flags process content as strong SEO: "how a leather bag is stitched by
 * hand" is a real search, and this is the page that answers it.
 */

export const metadata: Metadata = {
  title: 'How a bag is made',
  description:
    'From choosing the hide to the final inspection — the eight steps that go into every handmade jute and leather bag, and why the slow ones matter.',
  alternates: { canonical: '/about/process' },
};

const STEPS = [
  {
    title: 'Choosing the material',
    body: 'A hide is not uniform. It has scars, stretch marks, and areas that will not hold shape. The same is true of jute — slubs and uneven weave run through every roll. The first job is deciding which part of the material becomes which panel, and working around what cannot be used. Get this wrong and everything after it is wasted.',
  },
  {
    title: 'The pattern',
    body: 'Every design is a set of paper or card patterns, adjusted over time as the bag is made and remade. A pattern that produces a bag which sits well on the shoulder is worth more than the design drawing it came from.',
  },
  {
    title: 'Cutting',
    body: 'Cut by hand, against the pattern, with a knife rather than a press. Slower than stamping, and the reason panels can be placed around a flaw instead of through it.',
  },
  {
    title: 'Skiving and edging',
    body: 'Leather is pared thinner where it will be folded or seamed, so the finished corner sits square rather than bulging. This is the step that separates a bag that looks handmade from one that looks homemade, and it is entirely invisible when done right.',
  },
  {
    title: 'Stitching',
    body: 'The slowest part, and the part that decides how long the bag lasts. Every stress point — handle anchors, strap fixings, base corners — is double-stitched. On the mixed pieces the leather is stitched through the jute rather than glued to it, which is why the handles do not pull away.',
  },
  {
    title: 'Hardware',
    body: 'Solid brass rings, buckles, and zips, set by hand and checked for movement. Hardware is where cheap bags save money, and it is the first thing to fail on them.',
  },
  {
    title: 'Finishing',
    body: 'Edges are burnished by hand rather than sealed with a coating that will crack. Linings are set. Jute pieces are brushed down; leather is conditioned once before it leaves.',
  },
  {
    title: 'Inspection',
    body: 'Every bag is looked over before it is packed — seams, hardware, lining, and the inside of the base, which is where a rushed bag shows first. Anything that is not right goes back to the bench.',
  },
] as const;

export default function ProcessPage() {
  const maker = real(siteConfig.maker.name, 'the maker');

  return (
    <ProsePage
      title="How a bag is made"
      intro="Eight steps, most of them slow. This is what you are paying for, and where the time actually goes."
      crumbs={[{ label: 'Our story', href: '/about' }, { label: 'How a bag is made' }]}
    >
      <ol className="space-y-10">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <div className="flex items-baseline gap-3">
              <span
                aria-hidden="true"
                className="text-jute font-display tabular text-lg font-semibold"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2 className="font-display text-lg font-semibold">{step.title}</h2>
            </div>

            <P>{step.body}</P>

            {/* §21 — a photograph belongs with each step. No stock imagery
                (§28), so the slot is marked rather than filled. */}
            <div
              className="border-line bg-paper-sunk mt-4 flex aspect-video items-center justify-center rounded-md border border-dashed"
              role="img"
              aria-label={`Photograph of the ${step.title.toLowerCase()} step, coming soon`}
            >
              <p className="text-muted p-4 text-center text-xs">
                Photograph of this step
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="border-line mt-12 rounded-md border p-5">
        <h2 className="font-display text-md font-semibold">
          Why some bags are made to order
        </h2>
        <P>
          Pieces with hand-fitted hardware or a lot of hand-stitching are built
          when you order rather than kept on a shelf. It takes longer, and it
          means {maker} is not making bags nobody has asked for. The product
          page always shows the lead time before you buy.
        </P>
        <p className="mt-4">
          <Link href="/shop" className="text-jute-deep underline underline-offset-4">
            See what is ready now
          </Link>
        </p>
      </div>
    </ProsePage>
  );
}
