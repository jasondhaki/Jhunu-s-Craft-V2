'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/lib/cart-store';

/**
 * Empties the cart once the order is confirmed.
 *
 * Done HERE rather than before navigating, so a failed redirect or a network
 * blip never leaves someone with an order they cannot see and a cart they no
 * longer have.
 *
 * §23.3 requires that the back button after placing an order does not
 * re-submit. With the cart empty and the server cookie already cleared, going
 * back lands on an empty cart — there is nothing left to submit.
 *
 * The ref guards against React running the effect twice in development
 * Strict Mode, which would otherwise clear an already-refilled cart if the
 * customer opened a new tab and kept shopping.
 */
export function ClearCartOnMount() {
  const clear = useCart((s) => s.clear);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    clear();
  }, [clear]);

  return null;
}
