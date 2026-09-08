'use client';

import { useRouter } from 'next/navigation';
import { useSyncExternalStore, useTransition } from 'react';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-store';

/**
 * Client controls for the cart page — plan §6.4.
 *
 * The cart page itself is a Server Component: it reads the cart cookie and
 * resolves real prices from the database. These small islands mutate the
 * client store and then refresh the server render, so the authoritative
 * totals always come from the server rather than being recomputed here.
 */

export function QuantityStepper({
  variantId,
  quantity,
  max,
  productName,
}: {
  variantId: string;
  quantity: number;
  max: number;
  productName: string;
}) {
  const setQuantity = useCart((s) => s.setQuantity);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function update(next: number) {
    setQuantity(variantId, next);
    // Re-render the server component so prices and totals are recalculated
    // server-side rather than trusted from here.
    startTransition(() => router.refresh());
  }

  return (
    <div
      className="border-line-strong inline-flex items-center rounded-md border"
      aria-busy={pending}
    >
      <button
        type="button"
        onClick={() => update(quantity - 1)}
        aria-label={`Decrease quantity of ${productName}`}
        className="tap-target hover:bg-paper-sunk inline-flex items-center justify-center rounded-l-md"
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <span className="tabular w-10 text-center text-sm" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => update(quantity + 1)}
        disabled={quantity >= max}
        aria-label={`Increase quantity of ${productName}`}
        className="tap-target hover:bg-paper-sunk inline-flex items-center justify-center rounded-r-md disabled:opacity-40"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function RemoveLineButton({
  variantId,
  productName,
}: {
  variantId: string;
  productName: string;
}) {
  const remove = useCart((s) => s.remove);
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        remove(variantId);
        startTransition(() => router.refresh());
      }}
      className="text-muted hover:text-clay inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:underline"
    >
      <Trash2 className="size-3.5" aria-hidden="true" />
      Remove
      <span className="sr-only"> {productName} from cart</span>
    </button>
  );
}

/**
 * Drops lines the server could not resolve — deleted or unpublished products
 * (§23.3, "product deleted while it's in someone's cart").
 */
export function PruneRemovedLines({ variantIds }: { variantIds: string[] }) {
  const remove = useCart((s) => s.remove);
  const router = useRouter();

  function prune() {
    variantIds.forEach(remove);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={prune}
      className="text-jute-deep text-sm underline underline-offset-4 hover:no-underline"
    >
      Remove them and continue
    </button>
  );
}

// ---------------------------------------------------------------------------
// Header cart count
// ---------------------------------------------------------------------------

function subscribe(onChange: () => void) {
  return useCart.subscribe(onChange);
}

/**
 * Live item count in the header.
 *
 * Uses `useSyncExternalStore` with a server snapshot of 0 so the server HTML
 * and first client render agree — otherwise every page would hydrate with a
 * mismatch warning and the count would flicker.
 */
export function CartCount() {
  const count = useSyncExternalStore(
    subscribe,
    () => useCart.getState().lines.reduce((n, l) => n + l.quantity, 0),
    () => 0,
  );

  return (
    <Link
      href="/cart"
      // §20 — the accessible name carries the count, not just the icon.
      aria-label={
        count === 0 ? 'Cart, empty' : `Cart, ${count} item${count === 1 ? '' : 's'}`
      }
      className="text-paper hover:bg-forest-soft tap-target relative inline-flex items-center justify-center rounded-full transition-colors duration-150"
    >
      <ShoppingBag className="size-5" aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="bg-jute tabular absolute -top-0.5 -right-0.5 inline-flex size-5 items-center justify-center rounded-full text-[11px] font-semibold text-white"
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
