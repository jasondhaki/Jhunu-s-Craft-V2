/**
 * The cart cookie contract, shared by client and server.
 *
 * This module deliberately has NO `'use client'` directive.
 *
 * It used to live in `cart-store.ts`, which does. Importing a plain constant
 * from a `'use client'` module into a Server Component does not give you the
 * constant — Next.js turns every export of a client module into a client
 * *reference*, so `cookies().get(CART_COOKIE)` was looking up a proxy object
 * instead of the string `'jc_cart_lines'`. It found nothing, every
 * server-rendered cart came back empty, and checkout bounced to /cart even
 * with a full basket. Nothing threw; it simply behaved as though the cart
 * were empty.
 *
 * Values shared across the server/client boundary belong in a neutral module
 * like this one.
 */

/**
 * Name of the cookie the cart is mirrored into.
 *
 * Why mirror at all: §17.1 requires customer-facing pages to server-render,
 * and the cart and checkout pages need the basket during that render.
 * localStorage is invisible to the server, so the same ids are also written
 * to a cookie the server can read.
 *
 * It carries ONLY variant ids and quantities — never prices or names — and
 * the server re-resolves everything against the database (see lib/cart.ts).
 * The cookie is therefore a hint about what to look up, not a source of
 * truth: tampering with it changes which products get priced, never the
 * price (§13.4).
 *
 * Not httpOnly, deliberately — the client store has to keep it in sync.
 */
export const CART_COOKIE = 'jc_cart_lines';

/** 30 days — matches the cart retention window in §13.8. */
export const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
