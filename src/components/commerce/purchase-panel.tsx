'use client';

import { useState } from 'react';
import { Minus, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney, resolvePrice, savingsAgainst, type Currency } from '@/lib/money';
import { useCart } from '@/lib/cart-store';
import { Button } from '@/components/ui/button';

/**
 * Variant selector, quantity stepper, and add-to-cart — plan §6.3, items 6–10.
 *
 * §6.3: "Unavailable combinations are visibly disabled, not hidden."
 * §14.5: stock signals report the real number. No fake scarcity.
 */

export interface PanelVariant {
  id: string;
  sku: string;
  colorName: string;
  colorHex: string;
  sizeLabel: string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  priceOverrideBdt: number | null;
  priceOverrideUsd: number | null;
}

interface Props {
  productId: string;
  variants: PanelVariant[];
  basePriceBdt: number;
  basePriceUsd: number;
  compareAtPrice: number | null;
  currency: Currency;
  madeToOrder: boolean;
  productionDays: number | null;
}

export function PurchasePanel({
  productId,
  variants,
  basePriceBdt,
  basePriceUsd,
  compareAtPrice,
  currency,
  madeToOrder,
  productionDays,
}: Props) {
  // Default to the first variant that is actually buyable.
  const [selectedId, setSelectedId] = useState(
    () => (variants.find((v) => v.stockQuantity > 0) ?? variants[0])?.id,
  );
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const add = useCart((s) => s.add);
  const selected = variants.find((v) => v.id === selectedId);

  if (!selected) {
    return (
      <p className="text-muted text-sm">
        This bag has no active options at the moment.
      </p>
    );
  }

  const price = resolvePrice(
    currency,
    { basePriceBdt, basePriceUsd },
    selected,
  );
  const savings = savingsAgainst(price, compareAtPrice);

  const soldOut = selected.stockQuantity <= 0 && !madeToOrder;
  const isLow =
    selected.stockQuantity > 0 &&
    selected.stockQuantity <= selected.lowStockThreshold;
  const maxQuantity = madeToOrder
    ? 10
    : Math.max(1, Math.min(selected.stockQuantity, 10));

  function handleAdd() {
    add({ productId, variantId: selected!.id, quantity });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 4000);
  }

  return (
    <div className="space-y-6">
      {/* --- Price (§6.3.4) --------------------------------------------- */}
      <div className="tabular flex flex-wrap items-baseline gap-3">
        <span className="font-display text-lg font-semibold">
          {formatMoney(price, currency)}
        </span>
        {compareAtPrice !== null && savings !== null && (
          <>
            <span className="text-muted line-through">
              {formatMoney(compareAtPrice, currency)}
            </span>
            <span className="text-clay text-sm font-medium">
              Save {formatMoney(savings, currency)}
            </span>
          </>
        )}
      </div>

      {/* --- Colour (§6.3.6) -------------------------------------------- */}
      {variants.length > 1 && (
        <fieldset>
          <legend className="mb-3 text-sm font-medium">
            Colour:{' '}
            <span className="text-muted font-normal">{selected.colorName}</span>
          </legend>
          <div className="flex flex-wrap gap-3">
            {variants.map((variant) => {
              const unavailable = variant.stockQuantity <= 0 && !madeToOrder;
              const isSelected = variant.id === selectedId;
              return (
                <label
                  key={variant.id}
                  className={cn(
                    'relative flex cursor-pointer items-center justify-center rounded-full',
                    // 44px tap target (§7.1, §20)
                    'tap-target',
                    unavailable && 'cursor-not-allowed',
                  )}
                >
                  <input
                    type="radio"
                    name="variant"
                    value={variant.id}
                    checked={isSelected}
                    disabled={unavailable}
                    onChange={() => {
                      setSelectedId(variant.id);
                      setQuantity(1);
                    }}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      'block size-8 rounded-full border-2 transition-colors duration-150',
                      isSelected ? 'border-forest' : 'border-line',
                      unavailable && 'opacity-40',
                    )}
                    style={{ backgroundColor: variant.colorHex }}
                  />
                  {/* Disabled, not hidden (§6.3.6) — with a visible strike so
                      the state is not conveyed by opacity alone (§2.3) */}
                  {unavailable && (
                    <span
                      aria-hidden="true"
                      className="bg-clay pointer-events-none absolute h-px w-9 rotate-45"
                    />
                  )}
                  <span className="sr-only">
                    {variant.colorName}
                    {unavailable ? ' — sold out' : ''}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* --- Quantity (§6.3.7) ------------------------------------------ */}
      <div>
        <label htmlFor="quantity" className="mb-2 block text-sm font-medium">
          Quantity
        </label>
        <div className="border-line-strong inline-flex items-center rounded-md border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="tap-target hover:bg-paper-sunk inline-flex items-center justify-center rounded-l-md disabled:opacity-40"
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <input
            id="quantity"
            type="number"
            inputMode="numeric"
            min={1}
            max={maxQuantity}
            value={quantity}
            onChange={(e) => {
              const next = Number(e.target.value);
              setQuantity(
                Number.isFinite(next)
                  ? Math.min(maxQuantity, Math.max(1, Math.floor(next)))
                  : 1,
              );
            }}
            className="tabular w-14 border-0 bg-transparent text-center text-base [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            disabled={quantity >= maxQuantity}
            aria-label="Increase quantity"
            className="tap-target hover:bg-paper-sunk inline-flex items-center justify-center rounded-r-md disabled:opacity-40"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* --- Add to cart (§6.3.8) — the one primary action here (§2.3) --- */}
      <div className="space-y-3">
        <Button
          size="lg"
          fullWidth
          onClick={handleAdd}
          disabled={soldOut}
        >
          {soldOut
            ? 'Sold out'
            : madeToOrder
              ? `Order now — ready in ${productionDays ?? 10} days`
              : 'Add to cart'}
        </Button>

        {/* §7.2: the verb in the button matches the confirmation.
            §20: announced politely rather than stealing focus. */}
        <p aria-live="polite" className="min-h-5 text-sm">
          {justAdded && (
            <span className="text-leaf inline-flex items-center gap-1.5">
              <Check className="size-4" aria-hidden="true" />
              Added to cart.
            </span>
          )}
        </p>
      </div>

      {/* --- Stock signal (§6.3.10) — real numbers only (§14.5) --------- */}
      <p className="text-sm">
        {soldOut ? (
          <span className="text-muted">
            Sold out. He makes these in small batches — check back, or get in
            touch about a custom order.
          </span>
        ) : madeToOrder ? (
          <span className="text-forest-soft">
            Made to order — ready in {productionDays ?? 10} days, then dispatched.
          </span>
        ) : isLow ? (
          <span className="text-clay font-medium">
            Only {selected.stockQuantity} left in this colour.
          </span>
        ) : (
          <span className="text-leaf">In stock — dispatched in 2–4 working days.</span>
        )}
      </p>

      <p className="text-muted text-xs">
        SKU <span className="tabular">{selected.sku}</span>
      </p>
    </div>
  );
}
