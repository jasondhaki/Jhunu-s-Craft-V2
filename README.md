# Jhunu's Crafts

Ecommerce site for a one-maker family workshop in Bangladesh making handmade jute and leather bags.

Built against [`ecommerce-master-plan.md`](ecommerce-master-plan.md) — a 28-section build specification that is the source of truth for what gets built. Code comments cite it as `§n`.

## Documentation

| File | What it is |
|---|---|
| [`ecommerce-master-plan.md`](ecommerce-master-plan.md) | The specification. Strategy, design system, data models, page-by-page spec, security, SEO, launch checklist. |
| [`CONTEXT.md`](CONTEXT.md) | Working memory — decisions with reasoning, action log, open questions, standing rules. **Start here.** |
| [`CLAUDE.md`](CLAUDE.md) | Conventions and non-negotiables for working in this repo. |

## Stack

One Next.js app, deployed as a single Vercel project (see `CONTEXT.md` D1 for why not Medusa).

```
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4
Prisma 7 → PostgreSQL (Neon)
Zod · Zustand · lucide-react
```

## Getting started

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL
npm run db:generate
npm run dev
```

The app runs at http://localhost:3000.

> **No database yet.** Per `CONTEXT.md` D4 the build runs against seed data until Postgres is provisioned. `npm run dev` and `npm run build` work without a live database; only `db:push`, `db:migrate`, and `db:seed` need one.

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run check` | Typecheck + lint + build — run before pushing |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Regenerate the Prisma client after a schema change |
| `npm run db:migrate` | Create and apply a migration (development) |
| `npm run db:deploy` | Apply migrations (production/CI) |
| `npm run db:seed` | Load the sample catalog |
| `npm run db:studio` | Browse the database |

## Conventions worth knowing before you touch the code

These are the ones easiest to break by accident. The full list is in `CLAUDE.md`.

- **Money is integer minor units** — poisha and cents. `৳3,450.00` is `345000`. No floats in pricing, discount, shipping, or tax. Everything goes through `src/lib/money.ts`.
- **Never convert currency at runtime.** BDT and USD are separate, manually-set fields (§8.4).
- **Only a signature-verified webhook marks an order paid** — never the browser redirect (§8.3).
- **Stock decrements are conditional updates inside a transaction**, never read-then-write (§23.3).
- **Order line items are snapshots.** Never join to the live product for a historical order (§5.5).
- **Real-world values live in `src/lib/site-config.ts`**, marked `[LIKE_THIS]` while unknown. Never inline them.
- **`--jute` (`#B87333`) is never body text** — 3.2:1 contrast. Use `--jute-deep` (§2.2 Option D).

## Design system

Palette is §2.2 Option D "Basket & Leaf", derived from the existing logo — deep forest green with copper/jute accents on a paper ground. Tokens live in [`src/app/globals.css`](src/app/globals.css); components use token names, never hex values.

## Status

Phase 0 (foundations) of the §27 roadmap. See `CONTEXT.md` §4 for the current phase and §5 for what's blocked on owner input.
