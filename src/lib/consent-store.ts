/**
 * Cookie-consent state, as a plain external store.
 *
 * Deliberately free of React and of any `'use client'` directive, for the same
 * reason `src/lib/password.ts` is: logic this important should be testable
 * without a browser or a renderer. It was not, and a crash-the-page bug
 * shipped as a result.
 *
 * THE BUG THIS FILE EXISTS TO PREVENT
 *
 * `useSyncExternalStore` compares snapshots with `Object.is`. A `getSnapshot`
 * that runs `JSON.parse` on every call returns a fresh object identity each
 * time, so React concludes the store changed on every render and re-renders
 * until the browser kills the tab.
 *
 * It shipped, and it took the page down — but only after someone accepted
 * cookies. With nothing stored, the function returned `null`, and
 * `Object.is(null, null)` is true, so it was stable and looked correct in
 * every fresh profile and every server-side test. Accepting flipped it to
 * returning objects, the loop began, and because the choice persisted in
 * localStorage every subsequent visit crashed too.
 *
 * `readConsent` therefore re-parses ONLY when the stored string changes, and
 * returns the identical reference otherwise. `scripts/test-consent.ts` asserts
 * exactly that.
 */

export const CONSENT_KEY = 'jc_cookie_consent';
export const CONSENT_EVENT = 'jc:consent-changed';

export interface ConsentState {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  /** ISO timestamp — consent must be renewable and auditable (§13.8). */
  decidedAt: string;
}

/**
 * Validates a stored value. Anything malformed is treated as "no decision
 * yet", which re-asks rather than silently assuming consent — the safe
 * direction to fail (§13.8).
 */
export function parseConsent(raw: string | null): ConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ConsentState;
    if (typeof parsed?.analytics !== 'boolean') return null;
    if (typeof parsed?.marketing !== 'boolean') return null;
    return parsed;
  } catch {
    return null;
  }
}

// Cache keyed on the raw string. See the header comment — removing this
// reintroduces an infinite render loop.
let cachedRaw: string | null | undefined;
let cachedValue: ConsentState | null = null;

/**
 * The `getSnapshot` for `useSyncExternalStore`.
 *
 * MUST return a referentially stable value when the underlying storage has
 * not changed.
 */
export function readConsent(): ConsentState | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(CONSENT_KEY);
  } catch {
    // Private mode or blocked storage. `null` has a stable identity, so
    // returning it repeatedly is safe.
    return null;
  }

  if (raw === cachedRaw) return cachedValue;

  cachedRaw = raw;
  cachedValue = parseConsent(raw);
  return cachedValue;
}

/** The server snapshot: nothing is known, so nothing gated may render. */
export function serverConsentSnapshot(): ConsentState | null {
  return null;
}

export function subscribeToConsent(onChange: () => void): () => void {
  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function writeConsent(analytics: boolean, marketing: boolean): void {
  const state: ConsentState = {
    necessary: true,
    analytics,
    marketing,
    decidedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  } catch {
    // Blocked storage — the banner simply asks again next visit.
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/** Clears the decision so the banner reappears (§15.3). */
export function clearConsent(): void {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/** Test seam: lets a test reset the module cache between cases. */
export function __resetConsentCache(): void {
  cachedRaw = undefined;
  cachedValue = null;
}
