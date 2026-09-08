import type { NextConfig } from 'next';

/**
 * Static security headers — plan §13.1.
 *
 * The Content-Security-Policy is NOT here: it needs a per-request nonce, so it
 * is set in src/middleware.ts. Everything below is the same on every response
 * and belongs in the config, where it cannot be forgotten.
 */
const securityHeaders = [
  {
    /**
     * §13.1 — exactly as specified. `preload` is included deliberately: it is
     * only honoured once the domain is submitted to the HSTS preload list,
     * which should happen after a real domain exists (CONTEXT.md Q4).
     *
     * Note this is a commitment. Once a browser has seen it, it will refuse
     * plain HTTP to this domain for a year, so it must not ship on a domain
     * that still needs to serve anything over HTTP.
     */
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    // Stops a browser guessing that an uploaded .txt is really a script.
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Belt and braces alongside the CSP's frame-ancestors, for older browsers.
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    /**
     * §13.1 — "disable camera, microphone, geolocation unless used." None of
     * them are, so all are denied. `payment` is disabled too: when a gateway
     * arrives it will use a hosted page rather than the Payment Request API.
     */
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'interest-cohort=()',
    ].join(', '),
  },
  {
    // Isolates this origin from cross-origin popups it opens.
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Every route.
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        /**
         * §17.1 — admin and account areas must never be indexed, and a header
         * is more reliable than a meta tag because it also covers non-HTML
         * responses and is honoured on redirects.
         */
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      {
        source: '/account/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
    ];
  },

  images: {
    // §19 — AVIF and WebP with a fallback, smallest first.
    formats: ['image/avif', 'image/webp'],
  },

  // Do not advertise the framework version in every response.
  poweredByHeader: false,
};

export default nextConfig;
