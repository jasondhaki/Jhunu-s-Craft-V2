import { headers } from 'next/headers';

/**
 * Renders a JSON-LD block that survives our Content-Security-Policy.
 *
 * WHY THIS EXISTS
 *
 * §17.2 wants structured data on every page; §13.1 wants a CSP with no
 * `unsafe-inline` scripts. Those two pull against each other, because a strict
 * `script-src` gates *every* `<script>` element — including
 * `type="application/ld+json"`, which is a data block the browser never
 * executes. Browsers block it anyway, and the failure is silent: the page
 * renders perfectly and Google simply sees no structured data.
 *
 * So the nonce that middleware.ts generates is attached here too.
 *
 * THE TRADEOFF
 *
 * Reading `headers()` opts a route into dynamic rendering, so the content and
 * policy pages that were statically generated now render per request. That is
 * accepted rather than ideal:
 *
 *  - CONTEXT.md D7 already records that the storefront renders dynamically
 *    because currency detection reads cookies, so this is consistent rather
 *    than a new class of cost.
 *  - These pages are cheap — a template and no database work in most cases.
 *  - The alternative is structured data that is silently dropped, which
 *    defeats the point of writing it.
 *
 * If D7 is revisited in a later performance pass, this is one of the things to
 * revisit with it: per-page CSP hashes would let the static pages stay static.
 */
export async function JsonLd({ data }: { data: unknown }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // JSON context, not HTML: JSON.stringify escapes quotes and backslashes,
      // and escaping `<` makes a `</script>` breakout impossible. Values here
      // include admin-entered product names, so they are not trusted input —
      // this escaping is the mitigation, and nothing may be interpolated into
      // the string without going through JSON.stringify (§13.4).
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
