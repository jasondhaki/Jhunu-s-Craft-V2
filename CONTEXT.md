# CONTEXT.md — Jhunu's Crafts

**Purpose.** This is the project's working memory. Claude reads it at the start of a session and refreshes from it **every 10 prompts** to re-anchor context. Every decision taken, every action performed, and every open question gets written here as it happens.

**Read order for a cold start:** this file → `ecommerce-master-plan.md` (the spec) → `CLAUDE.md` (working rules).

---

## 1. What this is

An ecommerce site for **Jhunu's Crafts** — a bag workshop in Dhaka, Bangladesh, employing 10–20 people and founded by James Dilip Dhaki. It makes cotton canvas backpacks, jute side bags, and jute-and-leather office bags, and does substantial **bulk and contract work** for schools, companies, and development organisations.

- **Repo:** https://github.com/jasondhaki/Jhunu-s-Craft-V2 (auto-deploys on push to `main`)
- **Live:** https://jhunus-crafts.vercel.app
- **Database:** Neon Postgres 18.6, `ap-southeast-1`, 33 tables. ⚠ Password rotation outstanding — see **R1** in §1b.
- **Spec:** `ecommerce-master-plan.md` — 28 sections, treated as the source of truth. Section numbers are cited throughout this file as `§n`.
- **Hosting:** Vercel (temporary, per the owner's instruction).
- **Markets:** Bangladesh (primary — BDT, COD-heavy) + international (secondary — USD, card, courier).
- **Core positioning (CORRECTED — see D9):** a workshop of 10–20 people in Dhaka, founded and run by James Dilip Dhaki, keeping the work in-house. The plan’s §1.1 “one named person makes every bag” premise was **wrong for this business** and every claim repeating it has been removed.

---

## 1b. ⚠ Must be done before launch

Standing risks that are accepted *for now* and must not reach production unresolved. Each is also on the §25 pre-launch checklist.

| # | Item | Why it matters | Status |
|---|---|---|---|
| **R1** | **Rotate the Neon database password.** | The current password was shared in a chat transcript, so it must be treated as compromised — §13.7: "Rotate credentials if anything is ever committed — assume it's compromised." It grants full read/write to every customer, order, and address record. | **Deferred by owner (2026-09-08), deliberately.** Rotate in the Neon console, then update `.env` and all three Vercel environments. |
| **R2** | **Enable admin 2FA.** | §13.2 calls TOTP "the single highest-value security control on the whole site" and makes it mandatory on admin accounts. The schema, session gate, and `ADMIN_2FA_ENFORCED` switch exist; the enrolment flow does not. | Phase 3. The admin panel shows a standing red warning until it is on. |
| **R3** | **Confirm prices, dimensions, and weights on the real products.** | Prices were read from handwritten tags in the photographs, or are absent entirely. Dimensions and weights are estimates made from photographs — §9.2 warns that a wrong weight means wrong international shipping quotes that the business absorbs. Unpriced products are DRAFT and invisible until published (D10). | **Owner action — in the admin panel.** |
| **R8** | **More product photography.** | §21.1 asks for six shots per product; most have one. Missing: interiors, detail shots of stitching and hardware, and a scale shot with a person wearing the bag. The photographs supplied are genuine and good — there are simply not enough angles yet. | Owner action. |
| **R4** | **Replace the temporary admin password.** | Generated during setup and shown in a chat transcript. | Run `npm run admin:create`. |
| **R5** | **Legal review of the policy pages.** | §15 — a Bangladeshi lawyer should review the terms and refund policy before launch. | Phase 4. |
| **R6** | **Verify a sending domain in Resend, with SPF/DKIM/DMARC.** | Until then Resend permits only its sandbox sender (`onboarding@resend.dev`) and delivers **only to the account owner's own address** — so a real customer receives no confirmation at all. §10.2: without correct DNS "your confirmations will land in spam and customers will assume you're a scam." This is a DNS task, not a code task; the code is done and tested. | **Blocked on a domain (Q4), deferred by owner.** |
| **R7** | **Rotate the Resend API key.** | It was briefly pasted into `.env.example`, which is a tracked file, and appears in this session's transcript. It was caught before any commit and **never reached git history or GitHub** — verified with `git log -S`. Lower urgency than R1 because the key is sandbox-scoped until R6 is done, but it should still be rotated once the domain is live. | Deferred. |

---

## 2. Decisions locked

### D9 — ⚠ POSITIONING CORRECTION: this is a workshop with a team, not a lone maker
**Date:** 2026-09-08 · **Status:** locked · **Supersedes the plan's §1.1 premise**

**The site was making false claims and they have been removed.**

The plan's §1.1 asserts the core advantage is that "every bag is made by one named person, by hand", and everything built before this point repeated it: *"one person, one bench"*, *"Every bag made by one pair of hands"*, *"Handmade by one person"*, and a wholesale page telling buyers we could not fill a large order.

The owner corrected it: **James Dilip Dhaki is the founder and head of the workshop, not its only maker.** His own photographs show a production floor with rows of industrial machines and a team at work.

Confirmed facts now driving the copy:

| | |
|---|---|
| Team | 10 to 20 people, employed directly, not subcontracted |
| Equipment | Industrial sewing machines (JACK, JUKI), in their own premises |
| Founder | James Dilip Dhaki — founded it 3 years ago, still runs it |
| Main business | **Bulk / contract manufacturing**, not one-off artisan retail |
| Named clients | Swisscontact, B-SETS, Adhuna Bangladesh Limited, Ministry of Textiles and Jute, Bangladesh Climate Change Trust (owner gave permission to name them) |
| Real products | Cotton canvas backpacks, jute side bags, jute-and-leather office bags, branded promotional totes |

**Why this mattered enough to stop and fix:** §14.5 forbids fabricated trust signals and §1.4 demands plain truth. A claim of solo craftsmanship is not a harmless flourish — it is the kind of thing a customer or a journalist can disprove by looking at the company's own photographs, and it would have discredited everything else on the site. 16 false claims across 7 files were corrected.

**The positioning that replaces it** is not weaker, just different and true: a real workshop, work kept in-house rather than farmed out, a named person accountable for it, and institutional clients who already rely on them. Bulk capability is an asset to lead with, not a limitation to apologise for.

**Consequences carried forward:**
- The wholesale page was rewritten completely — it now leads with real clients and real capacity, and the minimum went from 10 pieces to 100 for branded work.
- `Material.COTTON` was added to the schema: the backpacks are cotton canvas, which the jute/leather/mixed enum could not express without lying about the material.
- The invented 24-product sample catalogue was deleted and replaced with the real products (see D10).
- There is **no leather-only category**, because there is no leather-only product. A category leading to an empty grid is worse than an absent one.

### D11 — External-store snapshots must be referentially stable, and testable outside React
**Date:** 2026-09-08 · **Status:** locked · **Plan §23.1**

A live crash prompted this, so it is a rule rather than a note.

Accepting cookies killed the page. `useSyncExternalStore` compares snapshots with `Object.is`, and `readConsent()` ran `JSON.parse` on every call — returning a new object identity each time. React concluded the store had changed on every render and re-rendered until the browser killed the tab.

**Why every safeguard missed it.** With nothing stored the function returned `null`, and `Object.is(null, null)` is true. So it was perfectly stable in a fresh profile, in `curl`, in server-side rendering, and in all 82 tests. It only became unstable **after** a visitor accepted — and because the choice persists in `localStorage`, every later visit crashed too. The first symptom reached us as "the page doesn't load", which sent the investigation towards DNS, CSP, and hosting regions before the real cause surfaced.

**Two rules from it:**

1. **Any `getSnapshot` passed to `useSyncExternalStore` must return a referentially stable value** when the underlying source has not changed. Primitives are safe; anything parsed or constructed must be cached against its raw input. Audited at the time: the cart count returns a number and the WhatsApp button a boolean, so consent was the only offender.
2. **Logic that can only run inside a renderer cannot be tested, and will eventually break in production.** The consent store moved to `src/lib/consent-store.ts` — no React, no `'use client'` — exactly as the Argon2 parameters moved to `src/lib/password.ts` for the same reason. `scripts/test-consent.ts` now asserts snapshot stability directly, and fails against the old implementation.

**A process note worth keeping:** three plausible-but-wrong causes were investigated first (hosting region, CSP, network). What settled it was the observation that **Vercel's logs contained no request from the browser at all** — the failure was client-side, not server-side. Checking whether the request even arrived should come earlier next time.

### D10 — Real products ship as DRAFT unless the price is known
**Date:** 2026-09-08 · **Status:** locked · **Plan §14.5**

The real catalogue was rebuilt from the owner's photographs. Some of those photographs contain handwritten price tags; most do not.

**Rule applied: a product with no known price is created as DRAFT, not ACTIVE.** A draft is invisible on the storefront until the owner sets a real price and publishes it in admin.

The alternative — inventing a plausible price so the shop looks full — would put a number in front of a customer that the business never agreed to. A made-up price is not a placeholder, it is a quote.

Current state: **1 live** (canvas backpack, price read from a handwritten tag and needing confirmation), **3 draft** (jute+leather office bag, jute side bag, nakshi panel backpack). Every product also carries an admin note saying dimensions and weight are photograph estimates — §9.2 warns a wrong weight means wrong international shipping.

---

## 2a. Earlier decisions

Recorded with the reasoning, so they don't get re-litigated.

### D1 — Tech stack: fully custom Next.js + Prisma + Postgres
**Date:** 2026-09-08 · **Status:** locked · **Plan §12**

The plan recommended Medusa + Next.js storefront. Rejected because **Medusa needs a long-running Node process plus Redis, which Vercel cannot host** — it would have meant a second hosting provider on day one, contradicting the "deploy to Vercel" instruction.

Built instead as **one Next.js 16 App Router project** containing storefront, admin, and API routes, with Prisma against Postgres. One Vercel project, no separate backend.

This takes on the risks §12.1 warns about. Mitigations are build requirements, not aspirations:

| Risk | Mitigation |
|---|---|
| Inventory races | Conditional update inside a transaction (`WHERE stock_quantity >= n`). Never read-then-write. §23.3 concurrency test is required. |
| Order state sprawl | One explicit state machine module. No ad-hoc status strings in route handlers. |
| Gateway lock-in | All gateways behind our own `PaymentProvider` interface (§8.3). |
| Money rounding | Integer minor units (poisha / cents) everywhere. No floats in pricing, discount, shipping, tax. |
| Duplicate orders / webhook retries | Idempotency key on order create; processed webhook event IDs recorded. |

Escape hatch: the Prisma schema maps onto Medusa's primitives and payments are already abstracted, so a later migration is a migration, not a rewrite.

**Plan updated:** §12.1 verdict + recommendation, §12.2 stack table, §12.3 repo structure.

### D2 — Palette: Option D "Basket & Leaf", derived from the logo
**Date:** 2026-09-08 · **Status:** locked · **Plan §2.1, §2.2**

The plan's recommended Option A was ink-black + gold. The **existing logo is deep forest green + copper** on white, with the tagline "Eco-Friendly Products / পরিবেশবান্ধব পণ্য". Option A would have left the logo's green appearing nowhere else on the site.

Kept the plan's *strategy* (dark structural frame, paper product canvas, jute-copper accent) and swapped the ink base for the logo's forest green:

| Token | Hex | Use |
|---|---|---|
| `--forest` | `#14401F` | Header, footer, hero, primary text on light |
| `--forest-soft` | `#2E5339` | Secondary text, borders on dark |
| `--paper` | `#FAF8F3` | Page background, product canvas |
| `--jute` | `#B87333` | Accent, CTA fill, price |
| `--jute-deep` | `#8C5524` | CTA hover/active, focus rings |
| `--hide` | `#5C3A24` | Leather category accent, secondary buttons |
| `--leaf` | `#4C7A3F` | Success, in-stock, eco messaging |
| `--clay` | `#A6432F` | Errors, sale badges, low stock |

**Accessibility constraint carried forward:** `--jute` is 3.2:1 on paper — **not usable for body text**. Reserved for large text, button fills (white on it is 4.6:1), borders, non-text UI. `--jute-deep` (4.8:1) is the token for links and small text. This is a standing rule, not a one-off note.

**Plan updated:** §2.1 decision note, §2.2 Option D inserted as SELECTED, Option A relabelled rejected.

### D3 — Catalog scope: bags only, per §4
**Date:** 2026-09-08 · **Status:** locked · **Plan §4**

The logo says "Eco-Friendly Products" and shows a basket, which suggested a wider range. Owner confirmed **bags only** — jute / leather / mixed, exactly the taxonomy, filters, and SKU convention (`JUT-TOT-NAT-001`) in §4. No speculative extensibility work.

### D4 — Database: seed data now, provision later
**Date:** 2026-09-08 · **Status:** locked

No Postgres instance yet. Building the full Prisma schema (§5) plus a realistic seed script (20–30 sample bags — §28 warns against launching with 4 products). Owner provisions Neon and supplies `DATABASE_URL` before deployment. Nothing is blocked by this.

### D5 — Number grouping: by locale, not by currency
**Date:** 2026-09-08 · **Status:** locked · **Plan §22**

§22 flags this as an open choice: "Bangladeshi number grouping differs (lakh/crore) — decide whether to use it and be consistent."

**Decision: group by UI locale, not by currency.** Bangla pages use Bengali digits and lakh/crore grouping (`৳৩,৪৫০`); English pages use Latin digits and thousands grouping (`৳3,450`), including for BDT. A Bangladeshi expat reading the English site with BDT prices gets thousands grouping, which is what that reader expects.

Never mixed within one page. Implemented in `formatMoney` in `src/lib/money.ts` — the single place a money value becomes a string.

### D6 — Bangla content fields are nullable, with English fallback
**Date:** 2026-09-08 · **Status:** locked · **Plan §22**

The schema originally made every `*Bn` column required. That would have forced machine-translated Bangla into the seed data on day one — precisely what §22 forbids ("it undermines the handmade authenticity").

All 15 `*Bn` columns are now optional. Content is authored in English first; a human adds Bangla later. `src/lib/i18n.ts` falls back to English when a Bangla field is null, and sets `lang="en"` on that element so a screen reader switches voice correctly.

Consequence: the storefront must always tolerate a half-translated catalog. That is the normal state, not an error state.

### D7 — Storefront pages render dynamically, not edge-cached (revisit in Phase 5)
**Date:** 2026-09-08 · **Status:** accepted, revisit · **Plan §8.4 vs §19**

§8.4 requires currency to be detected per visitor (IP → country → BDT/USD) with an overridable cookie. §19 wants category and product pages edge-cached.

These conflict: reading cookies or headers forces per-request rendering, so every storefront route currently builds as `ƒ` (server-rendered on demand) rather than a cached static page.

Accepted for now because correct pricing beats cache hit rate, and the pages are cheap. **Not the final answer.** Phase 5 options, in rough order of preference:
1. Render the page currency-agnostic and swap prices in a small client island, so the HTML caches.
2. Set the currency cookie in middleware and cache per cookie value (two variants per page).
3. Serve separate `/bd` and `/intl` URL prefixes and cache each.

Left as-is rather than guessed at, because the right choice depends on real traffic mix, which we do not have yet.

### D8 — Positioning rests on "one named person" — ⚠ **SUPERSEDED BY D9**
**Date:** 2026-09-08 · **Status:** ~~locked~~ **superseded by D9 the same day** · **Plan §1.1, §1.4, §14.5**

> **Do not act on the struck-through part of this decision.** Its second clause was factually wrong and the site was corrected. Kept per the rule in `CLAUDE.md` that superseded decisions are marked, never deleted — and because the mistake is instructive.

The owner confirmed the founder has been making bags for **3 years**. The plan's own example copy in §1.4 is "He's been making bags for 22 years", which invited a heritage angle that would be false here.

**Still in force:** state three years plainly, and rule out vague time language designed to imply more ("years of experience", "long-established", "traditional craft passed down", "generations"). §14.5 treats that as a dark pattern and §1.4 demands specific over superlative. Also still in force: describing the *work* in detail — technique, materials, why a step is slow — is where credibility actually comes from.

**~~Superseded:~~** this decision went on to lean the positioning on "every bag is made by one named person, by hand". That is **not true of this business** — it is a workshop of 10–20 people. See **D9**, which replaced it a few hours later.

**The lesson worth keeping:** D8 took the plan's §1.1 premise as established fact and built a decision on top of it, rather than checking it against the business. A spec is a set of assumptions until the owner confirms each one.

---

## 3. Action log

Newest last. Every action Claude takes on this project is recorded here.

### 2026-09-08 — Session 1

| # | Action | Detail |
|---|---|---|
| 1 | Read the spec | `ecommerce-master-plan.md`, all 1568 lines / 28 sections. |
| 2 | Inspected the logo | `Logo of Jhunu's Craft.jpeg`. Found forest green + copper, "Eco-Friendly Products / পরিবেশবান্ধব পণ্য". Conflicts with plan §2.2 Option A — raised it rather than building on a mismatch. |
| 3 | Checked toolchain | Node v24.16.0, npm 12.0.2, git 2.52.0. |
| 4 | Asked the 4 structural questions | Stack, palette, catalog scope, database. All answered → D1–D4 above. |
| 5 | Scaffolded Next.js | `create-next-app` → Next.js 16.3.4, React 19.2.8, Tailwind 4, TypeScript, ESLint, App Router, `src/`, `@/*` alias. Scaffolded into a temp subdir and moved up, because the folder name `Jhunu's Craft - V2` is not a valid npm package name. |
| 6 | Initialised git | `git init`, branch `main`, remote `origin` → github.com/jasondhaki/Jhunu-s-Craft-V2. |
| 7 | Installed dependencies | prisma, @prisma/client, zod, zustand, clsx, tailwind-merge, lucide-react, tsx. |
| 8 | Applied D1 + D2 to the plan | 8 surgical edits to `ecommerce-master-plan.md` (§2.1, §2.2, §12.1 ×2, §12.2 ×3, §12.3). Rejected options kept in place, labelled, with reasoning — nothing deleted. 88,022 → 92,453 chars. |
| 9 | Created this file | `CONTEXT.md`. |
| 10 | Wrote `CLAUDE.md` | Working rules: read order, non-negotiables table (each row traced to a plan section), stack, structure, conventions, definition of done. |
| 11 | Hit a Prisma trap | `npm install prisma` resolved to **8.0.0-rc.13** — npm's `latest` dist-tag points at a release candidate whose CLI is completely different (no `generate`, `migrate`, or `db seed`). Pinned to **7.10.0** (npm's `prev` tag = current stable) with `--save-exact`. |
| 12 | Approved blocked install scripts | npm 12 blocks postinstall scripts by default. Approved exactly the four toolchain packages that need them: `@prisma/engines`, `esbuild` (tsx depends on it), `prisma`, `unrs-resolver`. Recorded in `allowScripts` in package.json. |
| 13 | Wrote the Prisma schema | `prisma/schema.prisma` — every §5 model plus Session, VerificationToken, OrderEvent, CouponRedemption, BackInStockAlert, WebhookEvent, ShippingZone/Rate, AdminUser, AuditLog. All money columns are `Int` (minor units). Validates clean. |
| 14 | Adapted to Prisma 7 | Prisma 7 removed `url` from the datasource block. Added `prisma.config.ts` (connection URL + seed command) and `@prisma/adapter-pg` for the runtime client. Credentials now live only in the environment (§13.7). |
| 15 | Created env files | `.env.example` committed as the annotated template; `.env` gitignored with dev placeholders. Patched `.gitignore` so `.env*` still ignores real env files but `!.env.example` stays tracked. Verified with `git check-ignore`. |
| 16 | Built the design system | `src/app/globals.css` — §2.2 Option D palette, §2.4 type scale + Bangla line-height, §2.5 radius/elevation (deliberately differentiated per §2.5), §2.6 breakpoints, §2.7 motion + `prefers-reduced-motion`, §20 focus ring and skip link. |
| 17 | Wrote `src/lib/money.ts` | Integer minor units with runtime guards that throw on a non-integer. Percentages in basis points. `formatMoney` is the only place a value becomes a string. Resolved §22's open lakh/crore question — see D5. |
| 18 | Wrote `src/lib/site-config.ts` | Every unknown real-world value in ONE file as `[PLACEHOLDER]`, with `placeholdersRemaining()` for the §25 pre-launch check and `real()` so no page ever renders `[MAKER_NAME]` to a customer. |
| 19 | Built layout, header, footer, homepage | Fonts self-hosted via next/font, which satisfies §2.4's no-hotlinking rule. Header §3.2, footer §3.3, homepage §6.1 in the specified section order. No carousel (§6.1, §28). No stock photography — marked photo slots instead (§28). |
| 20 | Handled lucide's dropped brand icons | lucide-react no longer ships Facebook/Instagram icons (they are trademarks, not generic glyphs). Added `src/components/ui/social-icons.tsx` with inline CC0 Simple Icons paths plus a §16.2 note on trademark vs artwork licensing. |
| 21 | Verified the toolchain | `tsc --noEmit` clean · `eslint` clean · `next build` succeeds (compiled in 16.1s, 2 static routes). |
| 22 | Added scripts + README | `npm run check` (typecheck + lint + build) as the pre-push gate. README rewritten from the create-next-app default. |
| 23 | First commit + push | 2 commits to `main` on GitHub. Verified `.env` was not staged before committing. |
| 24 | Fixed the deploy blocker | `vercel-build` was `prisma generate && prisma migrate deploy && next build`, which would fail on the first deploy — no database, no migrations. Reduced to `prisma generate && next build`; kept the full command as `vercel-build:with-db` for once Neon existed. |
| 25 | Owner supplied real details | Maker name, phone, address, Neon URL. Answered Q1, Q3, Q9; raised Q11–Q13 for the things that must not be guessed. |
| 26 | Wired the database | Derived Neon's direct (unpooled) host from the pooled one, tested **both** connections before trusting either — Postgres 18.6, both OK. Pointed `prisma.config.ts` at the direct URL for migrations and left the app on the pooled one. |
| 27 | Applied the initial migration | `20260907205001_init` → 31 tables live on Neon. Versioned migration rather than `db push`, per §24 ("versioned, forward-only"). |
| 28 | Vercel login + link | Signed in via device flow. `vercel link` also auto-connected the GitHub repo, so pushes to `main` now deploy automatically. |
| 29 | Set Vercel env vars | `DATABASE_URL`, `DIRECT_DATABASE_URL`, `SESSION_SECRET` (freshly generated 32 random bytes, not the dev placeholder) across production/preview/development — 9 variables. |
| 30 | Fixed canonical URL resolution | `metadataBase` would have fallen back to `localhost` in production. Now resolves `NEXT_PUBLIC_SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → localhost. Deliberately **not** `VERCEL_URL`, which is per-deployment and would emit a different canonical URL on every push (§17.1). |
| 31 | Deployed to production | **https://jhunus-crafts.vercel.app** — HTTP 200, served from `bom1` (Mumbai), which gives the South Asian point of presence §19 asks for. Verified brand name, hero, maker name, phone, address, skip link, and palette token all present in the served HTML. |

### 2026-09-08 — Session 1, Phase 1 (catalog)

| # | Action | Detail |
|---|---|---|
| 32 | Made Bangla fields nullable | 15 `*Bn` columns → optional, with a schema comment explaining why so nobody "fixes" it back. Migration `20260907212150_bangla_fields_optional`. See D6. |
| 33 | Wrote `src/lib/i18n.ts` | English fallback for missing Bangla, plus `langAttr()` so an untranslated string gets `lang="en"` and a screen reader switches voice (§20). Removed a `defaultCurrencyFor` stub that returned the same value on both branches — currency follows region, not language (§8.4). |
| 34 | Created an honest photo placeholder | `public/photo-pending.svg` — a brand-coloured diagram that reads unmistakably as a missing photo. §28 forbids stock imagery, so no fake product shots anywhere. |
| 35 | Wrote the seed | 24 products / 41 variants / 144 images / 7 shipping zones / 4 collections / 5 tags. Idempotent (upserts on slug/sku/code). USD prices set by hand next to BDT, never converted (§8.4). Every product carries a real `weight_grams` (§9.2). |
| 36 | Hit a stale-client error | Seed failed with "Argument `nameBn` is missing" — `prisma migrate dev` had not regenerated the client. `prisma generate` fixed it. Worth remembering after any schema edit. |
| 37 | Wrote `src/lib/currency.ts` | Country → currency via Vercel's `x-vercel-ip-country`, overridable by cookie, one-year persistence (§8.4). Nothing converts between currencies; it only picks which stored column to read. |
| 38 | Wrote `src/lib/catalog.ts` | All storefront queries in one place, so the "only ACTIVE and published" rule cannot be forgotten on a new page. Facet counts, filters, sorting, related products. Price filtering is applied to the active currency's own column — never a converted value. |
| 39 | Built the catalog UI | Product card (§6.2, hover image, real stock badges), grid (2 cols mobile per §6.2), filters and sort. Filters are **plain links, not a client form** — they work with JS disabled, every filter state is a crawlable URL, and there is no hydration cost on slow connections (§19). |
| 40 | Restructured into `(storefront)` | Route group with a shared header/main/footer layout, matching the §12.3 structure. Admin will deliberately not share it. |
| 41 | Built `/shop` and `/shop/[category]` | jute · leather · mixed · new · bestsellers, each with real 150–300 word intro copy per §17.3, not just a grid. |
| 42 | Built the PDP (§6.3) | Gallery, purchase panel, trust row, all five accordions including the natural-variation paragraph §6.3.12 says prevents returns, maker credit, related products, `Product` + `Offer` JSON-LD. |
| 43 | Wrote the cart store | Zustand + localStorage per §6.4. Stores **only** variant ids and quantities — no prices or names. A localStorage cart is attacker-controlled, so anything that decides what the customer pays is resolved server-side (§13.4). |
| 44 | Handled a security-hook flag | The `dangerouslySetInnerHTML` used for JSON-LD was flagged twice. Kept it (React cannot render script content otherwise) but corrected my own inaccurate comment: admin-entered product names **do** reach it. Documented why `JSON.stringify` + escaping `<` is the correct mitigation for a JSON sink, and why an HTML sanitiser would be the wrong tool. |
| 45 | Recorded a caching tradeoff | Every storefront route builds as `ƒ` because currency detection reads cookies/headers, which conflicts with §19's edge-caching goal. Accepted and documented as D7 with three Phase 5 options, rather than silently shipping a performance regression. |
| 46 | Deployed Phase 1 | Verified 6 live URLs including a filtered listing and a PDP — all 200, all with expected content. |
| 47 | Triaged an npm audit finding | 4 high-severity advisories (`mysql2`, `deepmerge-ts`). Traced both to the **Prisma CLI only** — `npm ls` confirmed no other path, and `grep` confirmed app code imports only `@prisma/client` and `@prisma/adapter-pg`. Moved `prisma` to devDependencies. Did **not** run `audit fix --force`: it downgrades to Prisma 6, which would break the Prisma 7 config architecture. `npm audit --omit=dev` still reports them because the lockfile could not be regenerated (registry blocks a Tailwind wasm optional dep) — a tooling limitation, not exposure. |
| 48 | Built admin authentication | Argon2id (19 MiB / t=2 / p=1), session token stored as SHA-256 so a database leak yields no live sessions, httpOnly + SameSite=Lax cookie, 8-hour TTL, per-email and per-IP rate limiting, and a constant-time-ish path that hashes even for unknown accounts so response timing does not leak account existence. `server-only` import guard so this can never be pulled into a client bundle. |
| 49 | Hit an ambient const enum | `@node-rs/argon2` exports `Algorithm` as a `const enum`, which has no runtime value and breaks under `isolatedModules` (the mode Next builds in). Pinned the numeric literal `2` with a comment explaining why, rather than dropping the parameter — §13.2 names Argon2id specifically. |
| 50 | Built the admin panel | Dashboard with the §11.1 action queue, products list with search/filter, product editor with full server-side Zod validation and audit logging, and an inline stock editor. Orders and Messages are honest stubs that say what is missing rather than showing empty tables that look broken. |
| 51 | Wrote `src/lib/inventory.ts` | The D1 mitigation made real: `decrementStock` is a conditional `updateMany` (`WHERE stockQuantity >= n`) inside a transaction, so a race matches zero rows and fails cleanly instead of overselling. Every movement writes a `StockMovement` row so levels stay reconstructable. |
| 52 | Fixed a broken admin-creation script | The script exited 0 having done nothing when the password was piped in: the first `readline` buffered **both** lines, so the second `question` never fired and the event loop simply drained. Now reads stdin in one pass when not a TTY. The role validation had also correctly rejected a shell-mangled argument earlier — that part worked as designed. |
| 53 | Verified admin auth against the running app | 17 checks: unauthenticated redirects on 4 routes, forged token rejected, session cookie flags, token entropy, and — confirmed separately — that a wrong password and a nonexistent account produce **byte-identical** responses, so accounts cannot be enumerated (§13.2). All pass. |
| 54 | Owner supplied the remaining details | Bangla name জেমস দিলিপ ঢাকি, 3 years making bags, WhatsApp same as the phone. Closed Q11–Q13; raised Q14 (Bangla place names, not guessed). |
| 55 | Recorded D8 on positioning | Three years is real but short, and §1.4's own example copy ("22 years") invited a heritage angle that would now be false. Locked the positioning onto §1.1's actual advantage — one named person, by hand — and explicitly ruled out vague time language that implies more (§14.5). |
| 56 | Added `whatsappUrl()` | Caught before shipping: the footer was about to render the raw phone number as an `href`, which would have produced a dead link — exactly the broken trust signal §14.1 warns is worse than no button. The helper builds a proper `wa.me` URL and returns null while the number is a placeholder, so nothing renders. |
| 57 | Built the floating WhatsApp button | §14.1, dismissible per §14.5 with a real 44px close control and persistent dismissal. |
| 58 | Hit a React 19 lint rule | `react-hooks/set-state-in-effect` rejected the effect-plus-setState pattern for reading localStorage. Rewrote with `useSyncExternalStore`, the correct hook for an external store, which also gives a defined server snapshot — so a dismissed button never flashes back in on hydration. |
| 59 | Added §1b to this file | Five must-do-before-launch risks (R1–R5) promoted out of the buried question table, since the Neon rotation was deliberately deferred and must not be lost. |
| 60 | Owner supplied the Bangla address | মনিপুরিপাড়া, তেজগাঁও, ঢাকা - ১২১৫, kept as one string with Bengali numerals rather than split into fields — Bangla address order is the owner's to decide (§22). Closed Q14. |

### 2026-09-08 — Session 1, Phase 2 (commerce)

| # | Action | Detail |
|---|---|---|
| 61 | Wrote `src/lib/shipping.ts` | Zone resolution with real precedence (country+region beats country beats rest-of-world), weight-banded international rates, free-shipping thresholds, and COD/duties predicates (§9.1, §9.2, §8.4). |
| 62 | Wrote the `PaymentProvider` interface | §8.2 says international acceptance is unresolved and "could change the plan structurally", so §8.3's swappable-module instruction is the seam. Order logic knows only this interface. The COD adapter is the first implementation. |
| 63 | Wrote `src/lib/orders.ts` | The §9.4 state machine as the single doorway for status changes — every transition writes an OrderEvent, and cancelling returns stock automatically rather than relying on a caller to remember. Order creation snapshots line items (§5.5), takes an idempotency key (§8.3), and decrements stock before persisting so a failure cannot leak inventory. |
| 64 | Built cart, checkout, confirmation | Server-rendered cart with a real free-delivery progress bar, single-page accordion checkout (§6.5) with guest default and no account wall, cascading Division→District for BD, and a confirmation page looked up by unguessable `publicToken` rather than order number (§13.3 IDOR). |
| 65 | Built admin order management | List with status tabs, detail with the big one-click advance button §11.2 calls the most-used control in the panel, full timeline, and a COD "record cash received" action — audited, MANAGER-only. |
| 66 | **Proved the §23.3 race** | 10 tests: two simultaneous buyers of one unit → exactly one succeeds, stock lands at 0 and never negative, only the winner writes a StockMovement. Plus idempotency (a double-submit returns the same order and does not decrement twice) and snapshot integrity (renaming/repricing a product does not rewrite a historical order). This is the test CONTEXT.md D1 promised. |
| 67 | **Found a real bug: cookies are not URL-decoded** | Next.js returns the stored cookie value as-is. `parseCartCookie` was calling `JSON.parse` on percent-encoded text, throwing, and the untrusted-input `catch` swallowed it into an empty cart. Fixed by decoding first. Noted because the silent catch is exactly the failure mode that hid it. |
| 68 | **Found a second real bug: `'use client'` exports become client references** | `CART_COOKIE` was exported from `cart-store.ts`, which carries `'use client'`. Importing it into a Server Component yielded a proxy, not the string, so `cookies().get()` silently missed and checkout bounced to /cart with a full basket. Moved to `src/lib/cart-cookie.ts`, a neutral module. Nothing threw in either case — both bugs only surfaced because the e2e test asserted on rendered content. |
| 69 | Added a test suite | `npm run test` → 29 checks across orders and shipping. Uses `tsx --conditions=react-server` so `server-only`-guarded modules resolve to their no-op build outside Next, keeping the guard intact in the app. |
| 70 | **Caught a live secret in a tracked file** | The Resend key was pasted into `.env.example`, which IS committed. Verified with `git log -S` that it never reached history or GitHub, restored the file from git, and moved the key into `.env` (gitignored). It had also been added under the wrong name — `SENDER_API_KEY` rather than `RESEND_API_KEY` — so nothing was reading it. Logged as **R7**. |
| 71 | Built the email layer (§10) | `send.ts` (Resend transport that never throws), `templates.ts` (branded HTML **and** plain-text fallback per §10.2, inline-styled tables because Outlook has no flexbox), `notify.ts` (one place mapping a status change to its email). Confirmation, shipped-with-tracking, and cancelled-with-refund-timeline. |
| 72 | Wired notifications into the state machine | `transitionOrder` notifies last, once the database has settled, so a mail failure can never roll back a transition that already returned stock. Order placement awaits the confirmation rather than firing-and-forgetting — a Vercel function can freeze the moment it responds, so a dangling promise may simply never run. |
| 73 | Tested email properly | 18 checks including: money renders from minor units (৳2,910 from 291000 poisha), the tracking link uses the unguessable token not the order number, no opt-out link in transactional mail (§10.2), and **product names are HTML-escaped** so catalog data cannot inject markup (§13.4). One genuine finding: my own HTML comment contained the word "unsubscribe" and was shipping in every email — moved out of the markup. Finished with a real send, delivered. |
| 74 | Set email env vars on Vercel | `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` across production/preview/development. |

### 2026-09-08 — Session 1, Phase 3 (accounts, no external dependency)

| # | Action | Detail |
|---|---|---|
| 75 | Built customer authentication | `customer-auth.ts`, deliberately separate from `admin-auth.ts` — a customer session and an admin session are different credentials with different blast radii, and one must never satisfy a check meant for the other (§13.3). 30-day customer sessions vs the admin's 8 hours. |
| 76 | Implemented the HIBP breach check | §13.2 asks for it explicitly. Uses the k-anonymity range API, so only the first five characters of the SHA-1 leave the server. **Fails open** — a third party being down is not a reason to block a sale. Verified working: `password123` is rejected. |
| 77 | Built the account area | Register, log in, forgot/reset password, email verification, overview, order list, order detail, saved addresses, profile. Guest checkout is untouched — §6.5 and §28 forbid an account wall, and the log-in link on checkout is an offer, not a gate. |
| 78 | Built guest order tracking (§6.9) | Order number **plus** email or phone, or the unguessable token from the confirmation email. An order number alone is never sufficient: they are sequential by design so a customer can read one out over the phone, which makes them guessable. Rate-limited per IP so it cannot be walked. |
| 79 | Built GDPR account deletion (§13.8, §6.7) | Anonymises rather than deletes: orders are unlinked and the personal fields scrubbed, so historical invoices survive as accounting records without a person attached. §5.5 requires those records to stay intact. |
| 80 | **Refactored the Argon2 parameters into one module** | They had been copy-pasted into three files with a comment asking future edits to keep them in sync — which is not a mechanism. Now `src/lib/password.ts` is the single definition. It also has no Next.js import, which is what makes the crypto testable outside a request context at all. Verified the existing admin password still verifies after the move. |
| 81 | **Tested the IDOR surface directly** | 20 checks that actively attempt the attack: reading another customer's order by id, using an order number with no proof, using a wrong email, using a *valid token from a different order*. All refused. §13.3 calls IDOR "the most common serious flaw in small ecommerce sites", so these are assertions rather than assumptions. |

### 2026-09-08 — Session 1, Phase 4 (trust & content)

| # | Action | Detail |
|---|---|---|
| 82 | Technical SEO | `robots.ts` blocks admin, account, cart, checkout, and faceted URLs (§17.1); returns a blanket disallow unless `NEXT_PUBLIC_ALLOW_INDEXING` is true, so preview deployments cannot be indexed. `sitemap.ts` is generated from the live catalogue and deliberately excludes everything robots.txt blocks — listing a blocked page is a contradiction Search Console flags. |
| 83 | Structured data (§17.2) | `Organization` site-wide, `WebSite` + `SearchAction`, `FAQPage` from the same array the FAQ renders, `BreadcrumbList` already in place. `LocalBusiness` is emitted **only** on /contact and only when a real address exists — claiming a visitable storefront that does not exist would be a false trust signal. |
| 84 | Cookie consent (§13.8) | Granular necessary/analytics/marketing, nothing pre-ticked, and **reject is as easy as accept** — a banner where refusing takes an extra click is a dark pattern (§14.5) and non-compliant. Gating is structural: `<Analytics>` does not render the script tags at all without consent, so no request is made and no cookie is set. |
| 85 | Wrote the policy pages | Terms, privacy, cookies, refund, accessibility, IP notice — plain language per §14.5, not generator legalese. The privacy policy describes what the code **actually** does (real processors, real retention), and the cookie table lists real cookie names from the source. Every page carries a visible note that §15 requires a Bangladeshi lawyer's review (R5). |
| 86 | Wrote the content pages | FAQ (30 questions across 7 groups, including the awkward ones §6.9 names), care (with the mould section §6.9 calls a real credibility signal), materials, process, size guide, shipping, custom orders, wholesale, contact, reviews. |
| 87 | **Did not write the About page's story** | §6.8 wants the maker's account "in his voice". Inventing it would be the single most damaging thing on the site — §1.4 wants plain first-person truth and §14.5 rules out fabricated authenticity. The page ships with what is verifiably true and a clearly-marked gap for his own words. Raised as Q17. |
| 88 | Reviews page ships empty, and says why | §14.3 and §28 forbid fake reviews. Rather than hide the section, the page states plainly that inventing praise would make every real review worthless later. Only APPROVED reviews render, and the verified badge is tied to a real delivered order. |
| 89 | Live data, not duplicated copy | The shipping page reads the same `ShippingZone` rows checkout quotes from, and the size guide reads real product dimensions. Neither can drift out of sync with what a customer is actually charged or sent. |
| 90 | 404 and 500 pages (§7.3, §25) | Real copy, real routes out. The 500 page carries the phone number and tells anyone mid-order to call before retrying, so a broken site cannot cause a double charge. |
| 91 | Declined to embed a map | §6.9 asks for one on /contact, but a Google Maps iframe sets third-party cookies before consent, which §13.8 forbids. Linked out instead — same usefulness, no violation. |

### 2026-09-08 — Session 1, Phase 5 (security hardening)

| # | Action | Detail |
|---|---|---|
| 92 | **Set every §13.1 security header** | None were set at all. Now: HSTS (with `preload`), `nosniff`, `X-Frame-Options: DENY` + `frame-ancestors 'none'`, `Referrer-Policy`, a `Permissions-Policy` denying camera/mic/geolocation/payment, COOP, and `X-Robots-Tag: noindex` on /admin and /account. `poweredByHeader` off. All verified live. |
| 93 | Nonce-based CSP in middleware | The policy needs a fresh nonce per request, which a static config header cannot produce, so it lives in `src/middleware.ts`. **Zero scripts without a nonce, and no `unsafe-inline` in `script-src`** — verified on three page types. |
| 94 | Documented the one CSP compromise | `style-src` keeps `unsafe-inline`, because React writes inline `style` attributes for dynamic values (the free-shipping progress bar, colour swatches) and a nonce cannot cover a style attribute. The exposure is CSS injection, not script execution. Written into the middleware rather than left silent. |
| 95 | **Caught silently-broken structured data** | A strict `script-src` gates *every* `<script>` element, including `type="application/ld+json"` which the browser never executes. All our JSON-LD would have been blocked — and the failure is invisible: the page renders perfectly and Google simply sees nothing. Routed all four schema emitters plus the product page through one `<JsonLd>` component that attaches the nonce. |
| 96 | Accepted a cost, and said so | Reading `headers()` for the nonce opts content and policy pages out of static generation. Accepted because D7 already records the storefront as per-request for currency detection, these pages are cheap, and silently-dropped structured data defeats the point of writing it. Flagged in `json-ld.tsx` as something to revisit alongside D7. |
| 97 | Built verified-purchase reviews | Eligibility is structural, not a flag: `createReview` independently re-checks that the order contains the product **and** has been delivered, whichever path called it. Submission requires proof of holding the order — a session that owns it, or the token from the confirmation email — checked in the action rather than by whether the form rendered (§13.3). |
| 98 | **Tested that the badge cannot be forged** | 16 checks that attempt it: reviewing before delivery, a product not in the order, a made-up order id, a 6-star rating, and the same product twice. All refused. A "verified purchase" badge is only worth having if this is true. |
| 99 | `aggregateRating` only when reviews exist | `getRatingSummary` returns **null** rather than zero, and callers must render nothing. An invented or empty rating is both a Google structured-data violation and precisely the fabricated social proof §14.3 forbids. Verified live: the PDP emits no `aggregateRating` and shows no empty star row. |
| 100 | Built review moderation (§11.4) | Approve, reject, reply publicly. The screen states §14.3's editorial rule where the decision is actually made: publish the critical ones, reject only spam and abuse — a wall of five stars reads as fake. Every action audited. |
| 101 | Star input is a real radio group | Keyboard-operable, announced as "3 of 5 stars", works without JavaScript. A row of clickable icons gives none of that (§20). |
| 102 | Added `/api/health` (§24) | For the uptime monitoring §24 asks for. Returns 503 when the database is unreachable so a monitor needs no body parsing, and deliberately reveals nothing useful to a stranger — no versions, no connection details. Email being unconfigured is reported but does not fail the check: it is a launch blocker (R6), not an outage. |
| 103 | ⚠ **Owner correction: the positioning was wrong** | The owner said his father is the head and founder, but not the only maker — there is a team of 10–20. The plan's §1.1 premise ("one person, one bench") had been taken as fact and built on. Locked as **D9**; **D8 marked superseded**. |
| 104 | Audited and fixed 16 false claims across 7 files | "Every bag is made by one pair of hands", "Handmade by one person", "one person, one bench", and similar. Each was replaced with what is actually true — a founder who leads a workshop — not softened. Grep-verified that no variant survives. |
| 105 | Rewrote `/wholesale` completely | It had said bulk orders were impossible because one person cannot make them. That was the exact opposite of the truth and would have turned away the business the workshop is best placed to win. It now states real capacity, names the B2B clients the owner listed, and invites enquiries. |
| 106 | Wired in the owner's 14 photographs | Dropped into `public/` with random filenames. Renamed descriptively, sorted by product, and mapped to the catalogue. Alt text written for each from what is actually visible in the frame, in both languages (§5.3, §20) — never generated from the filename. |
| 107 | Deleted the 24 invented products | They were placeholder inventions from before real photos existed. Keeping them would have meant a shop selling bags that do not exist — the §14.5 line, not a content problem. |
| 108 | Rebuilt the catalogue from the photographs (`prisma/seed-real.ts`) | 4 real products. **1 ACTIVE** (Canvas School Backpack, ৳740 — read off the handwritten tag in the photo). **3 DRAFT** because no price is known for them: Jute and Leather Office Bag, Natural Jute Side Bag, Nakshi Panel Backpack. Locked as **D10**. |
| 109 | Migration: added `COTTON` to the `Material` enum | The photos show cotton-canvas bags, which the enum could not express. `JUTE \| LEATHER \| COTTON \| MIXED`. |
| 110 | ⚠ **Found the site running on the wrong continent** | `x-vercel-id: bom1::iad1` — functions were executing in Washington DC while the database sits in Singapore. Every query crossed the Pacific twice. 4.3 s cold, 1.4 s warm. |
| 111 | Pinned functions to `sin1` (`vercel.json`) | Same region as the Neon database. **1.4 s → 254 ms warm.** Nothing in the application code changed; it was pure geography. Logged as §19. |
| 112 | ⚠ **Owner-reported crash: accepting cookies killed the page** | Diagnosed to `readConsent()` running `JSON.parse` on every call, so `useSyncExternalStore` saw a new object identity each render and looped until the browser killed the tab. Invisible in 82 prior tests because with nothing stored it returns `null`, and `Object.is(null, null)` is true. |
| 113 | Fixed it, and moved the logic out of React | New `src/lib/consent-store.ts` — no React, no `'use client'` — caching the parsed value against the raw string so the snapshot is referentially stable. Same reasoning that produced `src/lib/password.ts`. Locked as **D11**. |
| 114 | Added `scripts/test-consent.ts` — 14 tests | The headline test asserts snapshot stability directly and **fails against the old implementation**. Also covers corrupt storage re-asking rather than assuming consent (§13.8). Total suite now **96 tests**. |
| 115 | Audited every other `useSyncExternalStore` call | Cart count returns a number, WhatsApp availability a boolean — both primitives, both stable. Consent was the only offender. |
| 116 | Diagnostic note worth keeping | Three plausible causes were investigated first (hosting region, CSP, DNS). What settled it was noticing **Vercel's logs held no request from the browser at all** — so the failure was client-side. "Did the request even arrive?" belongs earlier in the sequence. |
| 117 | Postgres SSL: `require` → `verify-full` | The driver was logging an SSL warning at `error` level on every request. Behaviourally identical today, but `pg` v9 will downgrade `require` to weaker libpq semantics, so this is the setting that stays correct. Changed in `.env` and in all 6 Vercel environment variables (pooled + direct × production/preview/development). |
| 118 | Verified both connections after the change | POOLED and DIRECT both connect; the warning is gone. |

---

## 4. Build progress against §27

| Phase | Scope | Status |
|---|---|---|
| **0 — Foundations** | Repo, tooling, design tokens, component skeleton, DB schema, staging | **Mostly done** — repo, tooling, tokens, schema, money/config libs, header/footer/homepage all built and building clean. Remaining: staging environment, and the rest of the §2.9 primitives. |
| **1 — Catalog** | Product model, admin CRUD, image pipeline, home, category, PDP, search, filters | **Done** — seed catalog, home, /shop, categories, PDP, filters, sort, pagination, admin auth + dashboard + product CRUD + stock editing. Remaining: image upload pipeline, storefront search. |
| **2 — Commerce** | Cart, guest checkout, COD, order creation, confirmation email, admin orders | **Mostly done** — cart, guest checkout, COD, order creation, confirmation page, admin order management, order state machine. Transactional email (§10) is now built, tested and verified with a real send. Remaining: SMS (§10.3), deferred by the owner (Q16). |
| **3 — Payments & accounts** | Gateway + webhooks, accounts, order history, guest tracking, wishlist, emails | **Partly done** — customer accounts, order history, guest order tracking, saved addresses, GDPR account deletion, and transactional email are built and tested. Remaining: the payment gateway and its webhooks (blocked on §8.2 / Q7), wishlist, and TOTP for admin (R2). |
| **4 — Trust & content** | Reviews, content + policy pages, FAQ, SEO, structured data, analytics | **Mostly done** — all six policy pages, ten content pages, 30-question FAQ, robots, sitemap, structured data, consent-gated analytics, 404/500. Verified-purchase reviews and admin moderation are now built and tested (16 tests). Remaining: the About page in the founder's own words (Q17) and the optional blog (§17.5). |
| **5 — Polish & launch** | Performance, a11y, cross-device QA, security review, real payment test | **Started** — all §13.1 security headers set with a nonce-based CSP, `/api/health` for uptime monitoring, functions pinned to `sin1` beside the database (1.4 s → 254 ms warm), and the cookie-consent render loop found and fixed. Remaining: screen-reader pass, Lighthouse run, cross-device QA on a real Android phone, and the real payment test (blocked on a gateway). |

§27 note being honoured: **the admin panel is not left until last** (§28's first listed mistake) — the owner's father is the content bottleneck and cannot add products without it.

---

## 5. Open questions — need input from the owner

Blocking items are marked. Unblocked ones are being built around with clearly-marked placeholders in a single config file, not scattered through the code.

| # | Question | Why it matters | Blocking? |
|---|---|---|---|
| ~~Q1~~ | ~~The maker's name~~ | **ANSWERED 2026-09-08: James Dilip Dhaki.** Wired into `site-config.ts`. | — |
| Q2 | **Brand name spelling** — logo says "Jhunu's Craft**s**", repo says "Jhunu-s-Craft-V2" | Affects title tags, `Organization` schema, footer copyright, emails. Using **"Jhunu's Crafts"** (matching the logo) until told otherwise. | No |
| ~~Q3~~ | ~~Phone and address~~ | **ANSWERED 2026-09-08:** +880 1730 431932 · Monipuripara, Tejgaon, Dhaka - 1215. WhatsApp split out to Q12. | — |
| Q4 | **Domain name** | §24. Needed for SPF/DKIM/DMARC, canonical URLs, and a real sender address. **Deferred by owner 2026-09-08.** Now the single biggest blocker: without it, order confirmations reach nobody except the Resend account owner — see **R6**. Running on the `.vercel.app` URL meanwhile. | **Deferred — blocks customer email** |
| Q5 | **Social links** (Facebook, Instagram, Pinterest) | Footer, `sameAs` in `Organization` schema. §14.1: a dead social link is worse than none, so unfilled entries render nothing. | No |
| ~~Q6~~ | ~~Real product photos~~ | **ANSWERED 2026-09-08:** the owner supplied 14 photographs of real products and the workshop floor. All wired in with alt text written from what is visible in each frame. §21 asks for six angles per product and most have one, so *more* photography is still needed — tracked as **R8**, not as an open question. | — |
| Q7 | **Payment gateway account** — SSLCommerz / aamarPay / ShurjoPay? | §8.1. Determines the first `PaymentProvider` adapter. COD works without it. | No — blocks Phase 3 |
| Q8 | **International payment acceptance** — unresolved in §8.2 | Plan flags this as the one thing that could change the plan structurally. Stripe/PayPal do not support BD merchants. Needs confirmation with the owner's bank + gateway. | No — blocks international sales only |
| ~~Q9~~ | ~~Neon `DATABASE_URL`~~ | **ANSWERED 2026-09-08.** Neon `ap-southeast-1`, Postgres 18.6, 33 tables live. Password rotation deferred by the owner — tracked as **R1** in §1b. | — |
| Q10 | **Bangla copy** | §22 forbids machine translation — it "undermines the handmade authenticity". Bangla fields exist in the schema but must be written by a human. | No — blocks bilingual launch |
| ~~Q11~~ | ~~His name in Bangla~~ | **ANSWERED 2026-09-08: জেমস দিলিপ ঢাকি** — his own spelling, supplied by the owner rather than transliterated. | — |
| ~~Q12~~ | ~~WhatsApp number~~ | **ANSWERED 2026-09-08: same as the phone line.** Floating click-to-chat button now live (§14.1), dismissible per §14.5. | — |
| ~~Q13~~ | ~~How long he has been making bags~~ | **ANSWERED 2026-09-08: 3 years.** Stated plainly on the homepage. See D8 for why the copy was NOT rewritten to imply more heritage than exists. | — |
| ~~Q14~~ | ~~Bangla workshop address~~ | **ANSWERED 2026-09-08: মনিপুরিপাড়া, তেজগাঁও, ঢাকা - ১২১৫** | — |
| ~~Q15~~ | ~~Transactional email provider~~ | **ANSWERED 2026-09-08: Resend.** Key configured locally and in all three Vercel environments. A real confirmation email was sent and delivered during testing. Deliverability to real customers still needs a verified domain — tracked as **R6**. | — |
| Q17 | **The maker’s own account of his work** — how he learned, why bags, what he cares about | §6.8 calls the About page “the emotional core of the site” and asks for it in his voice. A few honest paragraphs from him are worth more than anything drafted for him, and §14.5 rules out inventing it. The page currently has a marked gap. | No — blocks a convincing About page |
| Q16 | **SMS gateway** (Bangladesh) | §10.3: local customers respond to SMS far more than email. Minimum is order confirmation and shipped-with-tracking. **Deferred by owner 2026-09-08.** Notification code is structured so adding an SMS transport is a new module beside the email one, not a rewrite. | **Deferred** |

---

## 6. Standing rules

Carried from the plan; violated at the project's peril. These are the ones easiest to break by accident.

1. **Never auto-convert currency** (§8.4, §28). BDT and USD are separate manually-set fields.
2. **Never mark an order paid on the browser redirect** (§8.3, §28). Only a signature-verified webhook does that.
3. **Money is integer minor units.** No floats. (D1)
4. **No forced registration at checkout** (§6.5, §28).
5. **Shipping cost is visible before the payment step** (§6.5, §28).
6. **Never remove focus outlines** (§20, §28).
7. **No dark patterns** (§14.5) — no fake urgency, no fake view counts, no pre-ticked marketing boxes, no fake reviews.
8. **Alt text is required, not optional**, on every product image (§5.3, §20).
9. **Every product needs `weight_grams`** (§9.2, §28) or international rates break.
10. **Snapshot order line items** (§5.5). Never join to the live product for historical orders.
11. **No secrets in the repo** (§13.7). `.env` is gitignored from day one.
12. **`--jute` is never body text** (D2). Use `--jute-deep`.
13. **Mobile-first, 375px built first** (§2.6). Most traffic is Android on mobile data.
14. **No carousel hero** (§6.1, §28).
15. **Server-render everything customer-facing** (§17.1).
16. **A `getSnapshot` must be referentially stable** (D11). Parsed or constructed values must be cached against their raw input, or `useSyncExternalStore` loops forever. Store logic lives outside React so it can be tested.
17. **Never state a fact about the workshop the owner has not confirmed** (D9). The plan is a set of assumptions until he says otherwise. This one shipped 16 false claims before it was caught.

---

## 7. Refresh protocol

When re-reading this file (every 10 prompts, or on a cold start):

1. Re-read §2 (decisions) and §6 (standing rules) — these constrain all new work.
2. Check §4 for the current phase; do not skip ahead.
3. Check §5 for anything now unblocked by owner input.
4. Append new actions to §3. **Never rewrite history** — add rows, don't edit old ones.
5. When a decision changes, add a new `D<n>` entry with the date and reason and mark the old one `superseded by D<n>`. Do not delete it.
