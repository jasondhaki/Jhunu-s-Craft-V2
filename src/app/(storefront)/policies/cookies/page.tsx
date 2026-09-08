import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ProsePage,
  ProseSection,
  P,
  LegalReviewNotice,
} from '@/components/prose-page';
import { ReopenConsentButton } from './reopen-consent';

/**
 * Cookie policy — plan §15.3.
 *
 * "What cookies are · the categories you use with a TABLE listing each
 * cookie, its purpose, provider, and duration · how to change preferences
 * (link to reopen the consent manager) · how to control cookies in the
 * browser."
 *
 * The table below lists what the code actually sets. Every name here appears
 * somewhere in the source; there is no generic filler.
 */

export const metadata: Metadata = {
  title: 'Cookie policy',
  description:
    'Exactly which cookies this site sets, what each one does, how long it lasts, and how to change your mind.',
  alternates: { canonical: '/policies/cookies' },
};

const COOKIES = [
  {
    name: 'jc_cart_lines',
    category: 'Necessary',
    purpose:
      'Remembers what is in your cart so the server can price it. Holds only product ids and quantities — never prices or names.',
    provider: 'This site',
    duration: '30 days',
  },
  {
    name: 'jc_session',
    category: 'Necessary',
    purpose: 'Keeps you signed in to your account. Not readable by JavaScript.',
    provider: 'This site',
    duration: '30 days',
  },
  {
    name: 'jc_admin_session',
    category: 'Necessary',
    purpose: 'Keeps the shop owner signed in to the admin panel.',
    provider: 'This site',
    duration: '8 hours',
  },
  {
    name: 'jc_currency',
    category: 'Necessary',
    purpose:
      'Remembers whether you want prices in taka or dollars, so you are not asked again.',
    provider: 'This site',
    duration: '1 year',
  },
  {
    name: 'jc_cookie_consent',
    category: 'Necessary',
    purpose:
      'Remembers the choice you made about cookies. Stored in your browser, not sent to us.',
    provider: 'This site',
    duration: 'Until you clear it',
  },
  {
    name: 'jc_whatsapp_dismissed',
    category: 'Necessary',
    purpose:
      'Remembers that you closed the WhatsApp button, so it does not come back.',
    provider: 'This site',
    duration: 'Until you clear it',
  },
  {
    name: '_ga, _ga_*',
    category: 'Analytics',
    purpose:
      'Google Analytics. Counts visits and shows which pages people leave from. Only set if you allow analytics.',
    provider: 'Google',
    duration: 'Up to 2 years',
  },
  {
    name: '_fbp',
    category: 'Marketing',
    purpose:
      'Meta Pixel. Lets us see whether an advert led to a sale. Only set if you allow marketing.',
    provider: 'Meta',
    duration: '3 months',
  },
] as const;

export default function CookiePolicyPage() {
  return (
    <ProsePage
      title="Cookie policy"
      intro="Every cookie this site can set, what it does, and how to turn the optional ones off."
      crumbs={[{ label: 'Policies' }, { label: 'Cookies' }]}
      updated="8 September 2026"
    >
      <LegalReviewNotice />

      <ProseSection heading="What cookies are">
        <P>
          Small pieces of text a website stores in your browser so it can
          remember something between pages — that you are signed in, or what is
          in your cart. Some are essential; most are not.
        </P>
      </ProseSection>

      <ProseSection heading="What we actually do">
        <P>
          Nothing optional loads until you say so. If you choose &ldquo;necessary
          only&rdquo;, no analytics or marketing script is requested at all —
          not loaded and disabled, but never fetched. That is the whole
          difference, and it is why the banner appears before anything else.
        </P>
      </ProseSection>

      <ProseSection heading="Every cookie we can set">
        {/* Wide content scrolls inside its own container so the page body
            never scrolls sideways (§20 — usable at 320px). */}
        <div className="border-line -mx-4 overflow-x-auto px-4 sm:mx-0 sm:rounded-md sm:border sm:px-0">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <caption className="sr-only">
              Cookies used on this site, with purpose, provider, and duration
            </caption>
            <thead>
              <tr className="border-line border-b text-left">
                <th scope="col" className="p-3 font-semibold">Name</th>
                <th scope="col" className="p-3 font-semibold">Category</th>
                <th scope="col" className="p-3 font-semibold">What it does</th>
                <th scope="col" className="p-3 font-semibold">Provider</th>
                <th scope="col" className="p-3 font-semibold">Lasts</th>
              </tr>
            </thead>
            <tbody>
              {COOKIES.map((cookie) => (
                <tr key={cookie.name} className="border-line border-b last:border-0">
                  <td className="p-3 align-top font-mono text-xs">{cookie.name}</td>
                  <td className="p-3 align-top">{cookie.category}</td>
                  <td className="text-forest-soft p-3 align-top">{cookie.purpose}</td>
                  <td className="text-forest-soft p-3 align-top">{cookie.provider}</td>
                  <td className="text-forest-soft p-3 align-top whitespace-nowrap">
                    {cookie.duration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <P>
          Analytics and marketing entries appear only if you have allowed them.
          If you have not, those rows describe cookies that do not exist on your
          machine.
        </P>
      </ProseSection>

      <ProseSection heading="Changing your mind">
        <P>
          You can change your choice whenever you like — there is no penalty and
          nothing stops working except the measurement.
        </P>
        <ReopenConsentButton />
      </ProseSection>

      <ProseSection heading="Controlling cookies in your browser">
        <P>
          Every browser lets you block or delete cookies in its settings,
          usually under &ldquo;Privacy&rdquo;. Blocking all cookies will break
          your cart and sign-in on this site — those are the necessary ones —
          but it is your machine and your call.
        </P>
      </ProseSection>

      <ProseSection heading="More detail">
        <P>
          What we do with personal data more broadly is covered in the{' '}
          <Link
            href="/policies/privacy"
            className="text-jute-deep underline underline-offset-4"
          >
            privacy policy
          </Link>
          .
        </P>
      </ProseSection>
    </ProsePage>
  );
}
