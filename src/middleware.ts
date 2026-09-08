import { NextResponse, type NextRequest } from 'next/server';

/**
 * Security headers — plan §13.1.
 *
 * The Content-Security-Policy lives here rather than in next.config.ts because
 * it needs a fresh nonce per request. §13.1 is explicit: "No `unsafe-inline`
 * scripts." Next.js injects inline bootstrap scripts, so the only way to keep
 * that promise is a per-request nonce, which a static config header cannot
 * produce.
 *
 * Everything else is a static header and lives in next.config.ts.
 *
 * §13.1 suggests starting in report-only and tightening. We are pre-launch
 * with a small, known set of external origins, so this is enforced from the
 * start — a report-only policy nobody reads is not a control. `CSP_REPORT_ONLY`
 * flips it back if something unexpected surfaces in production.
 */

/**
 * Third-party origins we actually use.
 *
 * Analytics scripts only ever load AFTER consent (§13.8), but the policy has
 * to permit them or the consented case breaks. Allowing an origin in CSP is
 * not the same as loading it — nothing here is requested until the visitor
 * agrees.
 */
const ANALYTICS_SCRIPTS = [
  'https://www.googletagmanager.com',
  'https://plausible.io',
  'https://connect.facebook.net',
];

const ANALYTICS_CONNECT = [
  'https://www.google-analytics.com',
  'https://plausible.io',
  'https://connect.facebook.net',
  'https://*.google-analytics.com',
];

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const csp = [
    `default-src 'self'`,

    // 'strict-dynamic' lets a nonced script load the chunks it needs without
    // us enumerating every hashed filename. Modern browsers honour it and
    // ignore the host list; older ones fall back to the hosts.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${ANALYTICS_SCRIPTS.join(' ')}`,

    // Styles are the one place we cannot avoid 'unsafe-inline'. Tailwind
    // emits a stylesheet, but React still writes inline `style` attributes
    // for dynamic values (the free-shipping progress bar, colour swatches),
    // and a nonce does not cover style attributes. The exposure is CSS
    // injection, not script execution.
    `style-src 'self' 'unsafe-inline'`,

    // Fonts are self-hosted by next/font (§2.4), so no external font origin
    // is needed at all.
    `font-src 'self'`,

    `img-src 'self' data: blob: https:`,
    `connect-src 'self' ${ANALYTICS_CONNECT.join(' ')}`,

    // No Flash, no Java, nothing embedded.
    `object-src 'none'`,

    // Replaces X-Frame-Options for browsers that support it. Nothing here
    // should ever be framed — clickjacking a checkout is the classic attack.
    `frame-ancestors 'none'`,

    // The payment gateway will need an entry here when it arrives (§8.3
    // hosted pages). Empty until then rather than pre-authorised.
    `frame-src 'self'`,

    `base-uri 'self'`,
    `form-action 'self'`,

    // Stops a compromised page from navigating to a data: or javascript: URL.
    `manifest-src 'self'`,

    // Upgrade any stray http:// subresource rather than blocking the page.
    `upgrade-insecure-requests`,
  ].join('; ');

  // The nonce is passed to the app through a request header so the framework
  // can attach it to its own inline scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  const headerName =
    process.env.CSP_REPORT_ONLY === 'true'
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';

  response.headers.set(headerName, csp);

  return response;
}

export const config = {
  matcher: [
    /*
     * Every page, but not static assets or image optimisation output — those
     * are served straight from the CDN, carry no scripts, and adding a
     * per-request header to them would cost cache efficiency for nothing.
     */
    {
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
