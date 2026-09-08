'use client';

import { useSyncExternalStore } from 'react';
import { X } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/social-icons';

/**
 * Floating WhatsApp click-to-chat — plan §14.1.
 *
 * "WhatsApp click-to-chat button (floating, bottom-right, dismissible) — huge
 * in Bangladesh, increasingly normal internationally."
 *
 * Dismissible is the operative word (§14.5 — no dark patterns): the close
 * button is real, it is a proper 44px target, and the dismissal persists
 * across visits rather than reappearing to nag.
 *
 * localStorage is an external store, so it is read through
 * `useSyncExternalStore` rather than an effect-plus-setState. That gives a
 * defined server snapshot (hidden), so the server HTML and the first client
 * render agree and a dismissed button never flashes back in.
 */

const DISMISS_KEY = 'jc_whatsapp_dismissed';
const CHANGE_EVENT = 'jc:whatsapp-dismissed';

function subscribe(onChange: () => void): () => void {
  // `storage` fires for other tabs; the custom event covers this one.
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    // Private mode or blocked storage — showing it is the safe default.
    return false;
  }
}

/**
 * Hidden on the server. The button is a client-side convenience, and
 * rendering it into the HTML would mean showing it for a moment to someone
 * who already dismissed it.
 */
function serverSnapshot(): boolean {
  return true;
}

export function WhatsAppButton({ href }: { href: string }) {
  const dismissed = useSyncExternalStore(subscribe, isDismissed, serverSnapshot);

  if (dismissed) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Non-fatal: it simply reappears next visit.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <div className="fixed right-4 bottom-4 z-40 flex items-end gap-2 print:hidden">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-leaf hover:bg-forest flex items-center gap-2 rounded-full py-3 pr-5 pl-4 text-sm font-medium text-white shadow-lg transition-colors duration-150"
      >
        <WhatsAppIcon className="size-5" />
        <span>Chat on WhatsApp</span>
      </a>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Hide the WhatsApp button"
        className="border-line bg-paper text-muted hover:text-forest tap-target inline-flex items-center justify-center rounded-full border shadow-sm"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
