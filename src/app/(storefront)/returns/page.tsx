import { permanentRedirect } from 'next/navigation';

/**
 * /returns is the URL people guess and the one linked from product pages, but
 * the actual policy lives at /policies/refund. A permanent redirect keeps one
 * canonical page rather than two near-identical ones competing in search
 * (§17.1 — "never change a slug without a 301").
 */
export default function ReturnsPage() {
  permanentRedirect('/policies/refund');
}
