# CLAUDE.md — working rules for Jhunu's Crafts

## Read this first

1. **`CONTEXT.md`** — the project's working memory: decisions, action log, open questions, standing rules. **Re-read it every 10 prompts** and on every cold start.
2. **`ecommerce-master-plan.md`** — the specification. 28 sections. It is the source of truth for *what* to build. Cite it as `§n` in commits and notes.
3. This file — *how* to work in this repo.

If this file and the plan disagree, the plan wins on product decisions; this file wins on code conventions. If a locked decision in `CONTEXT.md §2` contradicts the plan, the decision wins — it was made deliberately and the plan was updated to match.

---

## Keeping CONTEXT.md current

This is not optional bookkeeping — it is how the project survives context loss.

- **After any meaningful action**, append a row to `CONTEXT.md §3` (action log). Newest last.
- **Never rewrite log history.** Add rows; don't edit old ones.
- **New decision** → new `D<n>` entry in §2 with date, reasoning, and what it rules out. Superseding an old decision means marking it `superseded by D<n>`, not deleting it.
- **Owner answers an open question** → update §5, and note in §3 that it unblocked something.
- **Phase completed** → update the §4 table.

---

## Non-negotiables

These come from the plan's own "common mistakes" list (§28) and its security section (§13). Breaking one is a bug, not a style difference.

| Rule | Source |
|---|---|
| Money is **integer minor units** (poisha / cents). No floats in pricing, discount, shipping, or tax. | D1 |
| **Never auto-convert currency.** BDT and USD are separate, manually-set fields. | §8.4, §28 |
| **Only a signature-verified webhook marks an order paid.** Never the browser redirect. | §8.3, §28 |
| Stock decrement is a **conditional update inside a transaction** (`WHERE stock_quantity >= n`). Never read-then-write. | D1, §23.3 |
| **Order line items are snapshots.** Never join to the live product for a historical order. | §5.5 |
| **No forced registration** at checkout. Guest is the default. | §6.5, §28 |
| **Shipping cost visible before the payment step.** | §6.5, §28 |
| **Never `outline: none`** without an equivalent replacement. | §20, §28 |
| **Alt text is required** on every product image, both languages. | §5.3, §20 |
| **Every product needs `weight_grams`.** | §9.2, §28 |
| **No secrets in the repo.** `.env` is gitignored. Use `.env.example` with dummy values. | §13.7 |
| **No dark patterns** — no fake urgency, fake view counts, pre-ticked marketing boxes, or fake reviews. | §14.5 |
| **`--jute` (`#B87333`) is never body text** — 3.2:1. Use `--jute-deep` for links and small text. | D2 |
| Every admin endpoint does a **server-side permission check**. Every customer resource checks **object ownership** (IDOR). | §13.3 |
| Validate every input **server-side with Zod**. Client validation is UX, not security. | §13.4 |

---

## Stack

Per `CONTEXT.md` D1 — one Next.js app, deployed as a single Vercel project.

```
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4
Prisma → PostgreSQL (Neon)
Zod (validation) · Zustand (cart) · lucide-react (icons)
```

There is **no separate backend service**. Route Handlers and Server Actions are the API. Do not introduce one without a new `D<n>` decision.

## Structure

```
/prisma          schema.prisma, seed.ts, migrations
/src
  /app
    /(storefront) customer site
    /admin        admin panel (§11)
    /api          route handlers, webhooks
  /components
    /ui           primitives (§2.9)
    /commerce     product card, gallery, variant selector, cart
  /lib
    money.ts      integer minor units, BDT/USD formatting
    cart.ts       cart logic
    inventory.ts  transactional stock movement
    orders.ts     order state machine (§9.4)
    /payments     PaymentProvider interface + adapters (§8.3)
    /shipping     zone + rate resolution (§9)
  /styles         design tokens (§2.2 Option D)
/docs            ADRs, runbooks
```

---

## Conventions

- **Server Components by default.** `'use client'` only where interaction genuinely requires it — cart, filters, gallery, variant selector. Everything customer-facing must server-render (§17.1).
- **Mobile-first.** Build the 375px view first; desktop is the easier problem (§2.6).
- **Design tokens only.** No hardcoded hex values in components. Tokens live in `/src/styles` and map to Tailwind theme config.
- **One primary CTA per screen** (§2.3). Never two `--jute` buttons competing in one view.
- **Bilingual fields** are `*_en` / `*_bn` columns, not a translation layer (§22). Never machine-translate Bangla — leave it empty and add it to `CONTEXT.md §5` instead.
- **Button verb matches the confirmation** (§7.2): "Add to cart" → "Added to cart". Never "Submit".
- **Errors say what happened and what to do next** (§7.3). They don't apologise and they aren't vague.
- Sentence case everywhere. Never all-caps labels (§2.4).
- Prices use `font-variant-numeric: tabular-nums` (§2.4).

## Placeholders

Unknown real-world values (maker's name, phone, address, domain) live in **one config file** as clearly-marked constants like `[MAKER_NAME]` — never scattered as inline strings. Each one has a matching row in `CONTEXT.md §5`. This makes "fill in the real details" a single-file edit rather than a hunt.

---

## Git

- Branch `main`. Remote: `github.com/jasondhaki/Jhunu-s-Craft-V2`.
- Conventional Commits, with the plan section in the body where it applies.
- Commit or push **only when asked**.
- End commit messages with:
  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  ```

## Before calling anything done

- `npm run build` passes.
- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- Keyboard-only walkthrough of anything interactive (§20).
- Checked at 375px, not just desktop (§23.2).
- `CONTEXT.md` action log updated.
