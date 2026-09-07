'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Client cart — plan §6.4.
 *
 * "Cart persists in localStorage for guests and syncs to the database on
 * login. Stock is re-validated at checkout, not just at add-time."
 *
 * DELIBERATELY MINIMAL. This stores variant ids and quantities and nothing
 * else — no prices, no names, no stock counts. Everything that decides what
 * the customer pays is resolved on the server from the database at render
 * and again at order creation.
 *
 * That is a security property, not a style preference: a cart in localStorage
 * is fully attacker-controlled. If a price lived here, someone would edit it
 * (§13.4 — client input is never trusted).
 */

export interface CartLine {
  variantId: string;
  productId: string;
  quantity: number;
  /** Monogram, custom strap length, etc. (§5.5) */
  personalizationNote?: string;
}

interface CartState {
  lines: CartLine[];
  /** Guards against rendering server HTML with a client-only cart (hydration). */
  hydrated: boolean;

  add: (line: CartLine) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  totalItems: () => number;
}

/** Hard ceiling per line — a stock check still happens server-side (§23.3). */
const MAX_PER_LINE = 20;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      hydrated: false,

      add: (line) =>
        set((state) => {
          const existing = state.lines.find((l) => l.variantId === line.variantId);
          if (!existing) {
            return {
              lines: [
                ...state.lines,
                { ...line, quantity: clamp(line.quantity) },
              ],
            };
          }
          return {
            lines: state.lines.map((l) =>
              l.variantId === line.variantId
                ? { ...l, quantity: clamp(l.quantity + line.quantity) }
                : l,
            ),
          };
        }),

      setQuantity: (variantId, quantity) =>
        set((state) => ({
          // Setting a line to zero removes it, which is what the quantity
          // stepper stepping down to 0 should mean.
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.variantId !== variantId)
              : state.lines.map((l) =>
                  l.variantId === variantId ? { ...l, quantity: clamp(quantity) } : l,
                ),
        })),

      remove: (variantId) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.variantId !== variantId),
        })),

      clear: () => set({ lines: [] }),

      totalItems: () => get().lines.reduce((n, l) => n + l.quantity, 0),
    }),
    {
      name: 'jc_cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines }) as CartState,
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

function clamp(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_PER_LINE, Math.max(1, Math.floor(quantity)));
}
