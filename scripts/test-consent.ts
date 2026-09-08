/**
 * Cookie-consent store — regression tests.
 *
 *   npm run test:consent
 *
 * The headline test is SNAPSHOT STABILITY. `useSyncExternalStore` compares the
 * value from `getSnapshot` with `Object.is`, so a function that parses JSON on
 * every call returns a new identity each time, React sees the store change on
 * every render, and the page re-renders until the browser kills the tab.
 *
 * That shipped and crashed the live site. It was invisible in every test until
 * now because with no stored consent the function returns `null`, and
 * `Object.is(null, null)` is true — so it was only unstable AFTER someone
 * accepted cookies, and then stayed broken because the choice persists.
 *
 * These run in plain Node with a fake localStorage, which is the whole reason
 * the logic was moved out of the React component.
 */

import {
  readConsent,
  parseConsent,
  writeConsent,
  clearConsent,
  serverConsentSnapshot,
  __resetConsentCache,
  CONSENT_KEY,
} from '../src/lib/consent-store';

const results: [string, boolean, string][] = [];
const check = (name: string, pass: boolean, detail = '') =>
  results.push([name, pass, detail]);

// --- Minimal browser stubs -------------------------------------------------
class FakeStorage {
  private data = new Map<string, string>();
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
  setItem(k: string, v: string) { this.data.set(k, String(v)); }
  removeItem(k: string) { this.data.delete(k); }
  clear() { this.data.clear(); }
}

const g = globalThis as unknown as {
  localStorage: FakeStorage;
  window: { dispatchEvent: () => boolean; addEventListener: () => void; removeEventListener: () => void };
  Event: typeof Event;
};

g.localStorage = new FakeStorage();
g.window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

function reset() {
  g.localStorage.clear();
  __resetConsentCache();
}

function main() {
  // === THE REGRESSION ====================================================
  reset();

  const a1 = readConsent();
  const a2 = readConsent();
  check(
    'With no consent stored, repeated reads are identical',
    Object.is(a1, a2) && a1 === null,
    'both null',
  );

  writeConsent(true, true);

  const b1 = readConsent();
  const b2 = readConsent();
  const b3 = readConsent();

  check(
    'AFTER accepting, repeated reads return the SAME object reference',
    Object.is(b1, b2) && Object.is(b2, b3),
    Object.is(b1, b2)
      ? 'stable — no render loop'
      : '!!! NEW OBJECT EACH CALL — this is the crash',
  );

  check(
    'The stored value is actually read back correctly',
    b1?.analytics === true && b1?.marketing === true && b1?.necessary === true,
    JSON.stringify(b1),
  );

  // Changing the decision must produce a NEW snapshot, or the UI would not
  // update — stability must not become staleness.
  writeConsent(false, false);
  const c1 = readConsent();
  check(
    'Changing the decision returns a new, updated snapshot',
    !Object.is(b1, c1) && c1?.analytics === false,
    `analytics now ${c1?.analytics}`,
  );

  const c2 = readConsent();
  check('...and that new snapshot is itself stable', Object.is(c1, c2));

  // Clearing must go back to a stable null (the cookie policy page does this).
  clearConsent();
  const d1 = readConsent();
  const d2 = readConsent();
  check(
    'Clearing consent returns to a stable null',
    d1 === null && Object.is(d1, d2),
  );

  // === Parsing =============================================================
  check('Empty storage parses to null', parseConsent(null) === null);
  check('Malformed JSON parses to null, not a throw', parseConsent('{not json') === null);
  check(
    'JSON missing the analytics flag is rejected',
    parseConsent(JSON.stringify({ necessary: true, marketing: true })) === null,
  );
  check(
    'JSON missing the marketing flag is rejected',
    parseConsent(JSON.stringify({ necessary: true, analytics: true })) === null,
  );
  check(
    'A valid payload parses',
    parseConsent(
      JSON.stringify({ necessary: true, analytics: true, marketing: false, decidedAt: 'x' }),
    )?.analytics === true,
  );

  // Corrupt storage must re-ask rather than assume consent (§13.8).
  reset();
  g.localStorage.setItem(CONSENT_KEY, 'garbage');
  const corrupt = readConsent();
  check(
    'Corrupt stored consent re-asks rather than assuming consent (§13.8)',
    corrupt === null,
    'banner shows again',
  );

  // === Server snapshot =====================================================
  check(
    'The server snapshot is null, so nothing gated renders during SSR',
    serverConsentSnapshot() === null,
  );

  // === Defaults ============================================================
  reset();
  writeConsent(false, false);
  const necessaryOnly = readConsent();
  check(
    '"Necessary only" records both optional categories as false',
    necessaryOnly?.analytics === false && necessaryOnly?.marketing === false,
  );

  console.log('');
  for (const [name, pass, detail] of results) {
    console.log(
      `${(pass ? 'PASS' : '**FAIL**').padEnd(10)} ${name}${detail ? '  —  ' + detail : ''}`,
    );
  }
  const failed = results.filter((r) => !r[1]).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exitCode = failed ? 1 : 0;
}

main();
