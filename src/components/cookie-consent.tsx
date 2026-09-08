'use client';

import { useSyncExternalStore, useState } from 'react';
import Link from 'next/link';

/**
 * Cookie consent — plan §13.8 and §18.1.
 *
 * §13.8: "Cookie consent banner with GRANULAR choices (necessary / analytics
 * / marketing) and no non-essential scripts firing before consent. Required
 * for EU visitors, and you will have EU visitors."
 * §18.1: "All analytics load only after consent for non-essential cookies."
 *
 * The design decisions that matter here, and why:
 *
 *  - **Reject is as easy as accept.** Both are real buttons of equal weight
 *    on the first screen. A banner where refusing takes an extra click is a
 *    dark pattern (§14.5) and is non-compliant in the EU.
 *  - **Nothing is pre-ticked.** Analytics and marketing default to OFF, and
 *    stay off until someone actively turns them on.
 *  - **No scripts load before a choice.** Consent is not merely recorded —
 *    it gates whether the tags mount at all. See `<Analytics>`.
 *  - Necessary cookies (session, cart, currency) are not offered as a choice
 *    because the site cannot function without them, and pretending otherwise
 *    would be dishonest.
 */

const CONSENT_KEY = 'jc_cookie_consent';
const CONSENT_EVENT = 'jc:consent-changed';

export interface ConsentState {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  /** ISO timestamp — consent has to be renewable and auditable. */
  decidedAt: string;
}

function readConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (typeof parsed?.analytics !== 'boolean') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeConsent(analytics: boolean, marketing: boolean): void {
  const state: ConsentState = {
    necessary: true,
    analytics,
    marketing,
    decidedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  } catch {
    // Blocked storage — the banner will simply ask again next visit, which
    // is the safe direction to fail.
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * Reads the current consent. Returns null on the server and before hydration,
 * so nothing gated can ever render during SSR — which is exactly the point.
 */
export function useConsent(): ConsentState | null {
  return useSyncExternalStore(
    subscribe,
    readConsent,
    () => null, // server snapshot: no consent known, so nothing loads
  );
}

/** Lets the cookie policy page reopen the chooser (§15.3). */
export function openConsentSettings(): void {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function CookieConsent() {
  const consent = useConsent();
  const [customising, setCustomising] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Already decided, or not hydrated yet.
  if (consent !== null) return null;

  return (
    <div
      // §20 — a dialog that does not trap focus would be worse than this;
      // it is a non-modal region announced politely, and the page stays usable.
      role="region"
      aria-label="Cookie choices"
      className="border-line bg-paper fixed inset-x-0 bottom-0 z-50 border-t shadow-lg print:hidden"
    >
      <div className="mx-auto max-w-(--container-page) px-4 py-5">
        <h2 className="font-display text-md font-semibold">Cookies</h2>
        <p className="text-forest-soft prose-measure mt-2 text-sm">
          We need a few cookies to keep your cart and your sign-in working.
          Beyond that, we would like to measure how the site is used — only if
          you are happy with it.
        </p>

        {customising && (
          <fieldset className="border-line mt-4 space-y-3 border-t pt-4">
            <legend className="sr-only">Choose which cookies to allow</legend>

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked
                disabled
                className="mt-0.5 size-4"
                aria-describedby="consent-necessary"
              />
              <span>
                <span className="font-medium">Necessary</span>
                <span id="consent-necessary" className="text-muted block text-xs">
                  Your cart, your sign-in, and your currency choice. The site
                  does not work without these, so they cannot be turned off.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-0.5 size-4"
                aria-describedby="consent-analytics"
              />
              <span>
                <span className="font-medium">Analytics</span>
                <span id="consent-analytics" className="text-muted block text-xs">
                  Which pages people visit and where they get stuck, so we can
                  fix it. Never used to identify you.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-0.5 size-4"
                aria-describedby="consent-marketing"
              />
              <span>
                <span className="font-medium">Marketing</span>
                <span id="consent-marketing" className="text-muted block text-xs">
                  Lets us see whether an advert led to a sale. Off by default.
                </span>
              </span>
            </label>
          </fieldset>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {/* Accept and reject carry equal weight — refusing must not be the
              harder path (§14.5). */}
          <button
            type="button"
            onClick={() => writeConsent(true, true)}
            className="bg-forest text-paper hover:bg-forest-soft min-h-11 rounded-md px-5 text-sm font-medium"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={() => writeConsent(false, false)}
            className="border-forest text-forest hover:bg-paper-sunk min-h-11 rounded-md border px-5 text-sm font-medium"
          >
            Necessary only
          </button>

          {customising ? (
            <button
              type="button"
              onClick={() => writeConsent(analytics, marketing)}
              className="text-jute-deep min-h-11 px-2 text-sm underline underline-offset-4"
            >
              Save my choices
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCustomising(true)}
              className="text-jute-deep min-h-11 px-2 text-sm underline underline-offset-4"
            >
              Choose individually
            </button>
          )}

          <Link
            href="/policies/cookies"
            className="text-muted ml-auto min-h-11 text-sm underline underline-offset-4"
          >
            Cookie policy
          </Link>
        </div>
      </div>
    </div>
  );
}
