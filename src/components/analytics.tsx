'use client';

import Script from 'next/script';
import { useConsent } from './cookie-consent';

/**
 * Analytics — plan §18, gated by §13.8.
 *
 * "All analytics load only after consent for non-essential cookies."
 *
 * The gating is structural, not a flag passed to a tag that has already
 * loaded: if consent is absent or refused, `<Script>` is never rendered, so
 * the request is never made and no cookie is ever set. Consent management
 * platforms that load the tag and then ask it to behave are the common way
 * this requirement gets quietly broken.
 *
 * `useConsent` returns null on the server and until hydration, so nothing
 * here can render during SSR either.
 *
 * Nothing loads at all unless the corresponding environment variable is set,
 * so a missing measurement id is simply no analytics rather than a broken
 * script tag.
 */

export function Analytics() {
  const consent = useConsent();

  const ga4 = process.env.NEXT_PUBLIC_GA4_ID;
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const metaPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <>
      {/*
        Plausible is cookieless and does not collect personal data, but it is
        still an external request, so it waits for analytics consent too.
        §18.1 wants it as "a clean cross-check that isn't blocked by
        ad-blockers".
      */}
      {consent?.analytics && plausibleDomain && (
        <Script
          defer
          data-domain={plausibleDomain}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      )}

      {consent?.analytics && ga4 && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4}', {
                anonymize_ip: true,
                allow_google_signals: ${consent.marketing},
                allow_ad_personalization_signals: ${consent.marketing}
              });
            `}
          </Script>
        </>
      )}

      {/* Marketing consent only — the pixel exists to attribute ad spend. */}
      {consent?.marketing && metaPixel && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixel}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
