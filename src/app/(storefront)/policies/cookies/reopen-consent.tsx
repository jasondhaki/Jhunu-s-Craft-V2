'use client';

import { useState } from 'react';
import { openConsentSettings } from '@/components/cookie-consent';

/**
 * §15.3 — "how to change preferences (link to reopen the consent manager)".
 *
 * Clears the stored decision, which brings the banner straight back so the
 * visitor can choose again.
 */
export function ReopenConsentButton() {
  const [reopened, setReopened] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          openConsentSettings();
          setReopened(true);
        }}
        className="border-forest text-forest hover:bg-paper-sunk min-h-11 rounded-md border px-5 text-sm font-medium"
      >
        Change my cookie choices
      </button>
      {reopened && (
        <p role="status" className="text-muted mt-2 text-sm">
          The cookie banner is back at the bottom of the page.
        </p>
      )}
    </div>
  );
}
