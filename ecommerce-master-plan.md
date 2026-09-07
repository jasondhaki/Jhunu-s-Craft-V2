# Ecommerce Build Plan — Handmade Jute & Leather Bags

**Business:** One-maker family workshop in Bangladesh. Your father hand-makes jute and leather bags — women's side bags, handbags, shopping bags, totes.
**Markets:** Bangladesh (primary, BDT, COD-heavy) + international (secondary, USD, card/gateway, courier shipping).
**Builder:** You. Logo already exists.

This document is the complete specification. Build against it section by section.

---

## Table of contents

1. [Strategy & positioning](#1-strategy--positioning)
2. [Brand identity & design system](#2-brand-identity--design-system)
3. [Information architecture — full sitemap](#3-information-architecture--full-sitemap)
4. [Product taxonomy & catalog structure](#4-product-taxonomy--catalog-structure)
5. [Data models](#5-data-models)
6. [Page-by-page specification](#6-page-by-page-specification)
7. [Buttons, CTAs & microcopy inventory](#7-buttons-ctas--microcopy-inventory)
8. [Cart, checkout & payments](#8-cart-checkout--payments)
9. [Shipping & fulfilment](#9-shipping--fulfilment)
10. [Transactional email & notifications](#10-transactional-email--notifications)
11. [Admin panel specification](#11-admin-panel-specification)
12. [Tech stack](#12-tech-stack)
13. [Security](#13-security)
14. [Trust & credibility measures](#14-trust--credibility-measures)
15. [Legal pages & policies](#15-legal-pages--policies)
16. [Copyright, trademark & IP](#16-copyright-trademark--ip)
17. [SEO](#17-seo)
18. [Analytics & measurement](#18-analytics--measurement)
19. [Performance budget](#19-performance-budget)
20. [Accessibility](#20-accessibility)
21. [Photography & content production](#21-photography--content-production)
22. [Internationalization & localization](#22-internationalization--localization)
23. [Testing & QA](#23-testing--qa)
24. [Deployment & infrastructure](#24-deployment--infrastructure)
25. [Pre-launch checklist](#25-pre-launch-checklist)
26. [Post-launch operations](#26-post-launch-operations)
27. [Build roadmap in phases](#27-build-roadmap-in-phases)
28. [Common mistakes to avoid](#28-common-mistakes-to-avoid)

---

## 1. Strategy & positioning

### 1.1 The core advantage

You are not competing with Aarong on scale, price, or catalog breadth. You compete on a single fact large retailers cannot claim: **every bag is made by one named person, by hand.** Every design and copy decision should reinforce that.

Practical consequences:
- The maker's name, face, hands, and workshop appear throughout the site — not buried on an About page.
- Stock is genuinely limited. Say so. "Made in small batches" and real low-stock counts are honest and they convert.
- Natural variation is a feature, not a defect. State it on every product page so nobody files a return over a slightly different jute weave.
- Slower fulfilment is acceptable if you set expectations up front ("dispatched in 2–4 working days").

### 1.2 Two audiences, one site

| | Bangladesh customer | International customer |
|---|---|---|
| Currency | BDT (৳) | USD (optionally EUR/GBP) |
| Payment | COD, bKash, Nagad, cards | Cards, digital wallets |
| Shipping | Local courier, 1–5 days | DHL/FedEx/EMS, 7–21 days |
| Price sensitivity | High | Lower; pays for provenance |
| Main objection | "Is this real leather / worth the price?" | "Will it actually arrive? Is this a scam site?" |
| Trust lever | Phone number, COD, Facebook presence | Reviews, secure checkout, clear returns, tracking |
| Language | Bangla + English | English |

The site must serve both without feeling bolted together. Detect region, default sensibly, always allow manual override.

### 1.3 Positioning statement (working draft)

> Handmade jute and leather bags from a one-man workshop in Bangladesh. Cut, stitched, and finished by [Father's name] — no factory, no shortcuts, no two bags exactly alike.

### 1.4 Brand voice

- **Plain, warm, first-person.** "He's been making bags for 22 years." Not "Our brand embodies timeless craftsmanship."
- **Singular for making, plural for the business.** "He stitches every bag by hand." / "We ship across Bangladesh." Accurate is more credible than uniform.
- **No luxury cosplay.** Avoid "curated," "artisanal excellence," "bespoke journey." Say what the thing is.
- **Specific over superlative.** "Full-grain buffalo leather, 1.4 mm" beats "premium quality leather."
- **Bangla voice matters too.** Don't machine-translate. Write the Bangla copy separately, in natural Bangla.

---

## 2. Brand identity & design system

### 2.1 Design direction

Jute is called the golden fibre. Leather is chestnut and oxblood. The obvious move — cream background, big serif headline, terracotta accent — is the exact look every AI-generated and template craft store already has, and international buyers have seen it a hundred times. Go somewhere more specific.

**Recommended direction: "Loom & Hide."** A deep, dark ink base for structural surfaces (header, footer, hero) with raw jute-gold and leather-chestnut as the working colors, and a paper-white product canvas so the bags themselves carry the color. The darkness is the differentiator — most craft sites are washed-out light; a confident dark frame makes handmade goods look considered rather than rustic-by-accident.

> **DECISION (2026-09-08).** The strategy above is kept, but the *hue* is taken from the existing logo rather than invented. The Jhunu's Crafts mark is deep forest green + copper on white, with the tagline "Eco-friendly products / পরিবেশবান্ধব পণ্য". Building on ink-black + gold would have left the logo's green appearing nowhere else on the site. The selected palette — **Basket & Leaf**, section 2.2 — keeps the dark-frame / paper-canvas structure and the jute-copper accent, and swaps the ink base for the logo's forest green. See CONTEXT.md for the full decision log.

### 2.2 Color palettes

Pick one. Don't mix. **Option D is the selected palette** — it is derived from the existing logo. Options A–C are retained as the rejected alternatives.

**Option D — Basket & Leaf (SELECTED — derived from the logo)**

| Token | Hex | Use |
|---|---|---|
| `--forest` | `#14401F` | Header, footer, hero panel, primary text on light |
| `--forest-soft` | `#2E5339` | Secondary text, borders on dark |
| `--paper` | `#FAF8F3` | Page background, product canvas |
| `--jute` | `#B87333` | Primary accent, CTAs, links, price |
| `--jute-deep` | `#8C5524` | CTA hover/active, focus rings |
| `--hide` | `#5C3A24` | Leather category accent, secondary buttons |
| `--leaf` | `#4C7A3F` | Success states, "in stock", eco messaging |
| `--clay` | `#A6432F` | Errors, sale badges, low-stock warnings |

Contrast, verified against `--paper` `#FAF8F3`: `--forest` 11.4:1, `--forest-soft` 7.6:1, `--jute-deep` 4.8:1, `--hide` 8.1:1, `--clay` 5.3:1 — all pass WCAG AA for body text. `--jute` `#B87333` is **3.2:1 and is therefore not used for body text** — it is reserved for large text, button fills (white on it reaches 4.6:1), borders, and non-text UI, per section 2.3 and section 20.

**Option A — Loom & Hide (rejected — logo mismatch)**

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#1C2321` | Header, footer, hero panel, primary text on light |
| `--ink-soft` | `#39423F` | Secondary text, borders on dark |
| `--paper` | `#FBFAF7` | Page background, product canvas |
| `--jute` | `#B8862F` | Primary accent, CTAs, links, price |
| `--jute-deep` | `#8A6320` | CTA hover/active, focus rings |
| `--hide` | `#5C3A24` | Leather category accent, secondary buttons |
| `--sage` | `#7D8A73` | Success states, "in stock", eco messaging |
| `--clay` | `#A6432F` | Errors, sale badges, low-stock warnings |

**Option B — Indigo & Fibre**
Draws on Bengali indigo dyeing and nakshi kantha embroidery. More colorful, more explicitly Bangladeshi, better for international storytelling.

| Token | Hex | Use |
|---|---|---|
| `--indigo` | `#243B53` | Header/footer, headings |
| `--indigo-deep` | `#16293D` | Hover states |
| `--rice` | `#F7F5EF` | Background |
| `--fibre` | `#C9A227` | Accent, CTAs |
| `--madder` | `#9E3B2E` | Sale, errors |
| `--leaf` | `#5F7A61` | Success, eco |

**Option C — Workshop Neutral**
Quietest option. Lets photography do everything. Safest if your product photos are excellent; boring if they aren't.

| Token | Hex | Use |
|---|---|---|
| `--charcoal` | `#232323` | Text, header |
| `--bone` | `#F4F2ED` | Background |
| `--tan` | `#A8763E` | Accent, CTAs |
| `--stone` | `#D8D3C8` | Borders, dividers |
| `--brick` | `#8C3B2B` | Errors |
| `--moss` | `#6B7A5A` | Success |

### 2.3 Color rules

- Body text on `--paper` must be `--ink` or darker — verify 4.5:1 minimum contrast.
- CTA color is used for **one** thing: the primary action on any given screen. Never two jute-gold buttons competing on the same view.
- Never use color alone to convey meaning (out-of-stock also needs a label; sale also needs the word "Sale").
- Product photography backgrounds should be a consistent neutral. Pick one and never deviate — mixed backgrounds make a small catalog look chaotic.

### 2.4 Typography

Two families, clearly distinct, both with real Bengali support or a paired Bengali face.

**Recommended pairing**

| Role | Family | Fallback stack |
|---|---|---|
| Display / headings (Latin) | **Fraunces** (variable serif, has real character at large sizes) | `Georgia, 'Times New Roman', serif` |
| Body / UI (Latin) | **Work Sans** or **Inter** | `system-ui, -apple-system, sans-serif` |
| Bengali headings | **Tiro Bangla** or **Anek Bangla** | `'Noto Serif Bengali', sans-serif` |
| Bengali body | **Hind Siliguri** or **Noto Sans Bengali** | `sans-serif` |

Self-host the fonts (`woff2`, subset, `font-display: swap`). Don't hotlink Google Fonts — it's slower from Bangladesh and creates a GDPR wrinkle for EU visitors.

**Type scale** (1.25 major third, 16px base):

```
--fs-xs:   0.8rem   /* 12.8px — meta, captions, legal */
--fs-sm:   0.9rem   /* 14.4px — labels, helper text */
--fs-base: 1rem     /* 16px   — body */
--fs-md:   1.25rem  /* 20px   — lead paragraph, product title in grid */
--fs-lg:   1.563rem /* 25px   — section headings */
--fs-xl:   1.953rem /* 31px   — page titles */
--fs-2xl:  2.441rem /* 39px   — hero on mobile */
--fs-3xl:  3.052rem /* 49px   — hero on desktop */
```

**Rules**
- Body line-height 1.6 for sans, 1.7 for serif. Bengali needs more: 1.75–1.9, and slightly larger font-size (Bengali glyphs read smaller at the same px).
- Max line length 65–75 characters. Set `max-width: 68ch` on prose blocks.
- Never all-caps for labels. Sentence case everywhere.
- Prices: tabular numerals (`font-variant-numeric: tabular-nums`) so grids align.

### 2.5 Spacing, radius, elevation

```
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
--space-5: 24px;  --space-6: 32px;  --space-7: 48px;  --space-8: 64px;
--space-9: 96px;  --space-10: 128px;

--radius-sm: 2px;   /* inputs, badges */
--radius-md: 4px;   /* buttons, cards */
--radius-lg: 8px;   /* modals, image containers */
--radius-full: 999px; /* pills, avatars */

--shadow-sm: 0 1px 2px rgba(28,35,33,.06);
--shadow-md: 0 4px 12px rgba(28,35,33,.08);
--shadow-lg: 0 12px 32px rgba(28,35,33,.12);
```

Don't put the same radius and the same shadow on everything — that's the tell of a template. Product images: square corners. Buttons: small radius. Modals: larger radius. Hierarchy through difference.

### 2.6 Layout & grid

- Container max-width: 1280px, with 1140px for prose-heavy pages.
- 12-column grid on desktop, 6 on tablet, 4 on mobile. Gutter 24px desktop / 16px mobile.
- Breakpoints: `sm 480px`, `md 768px`, `lg 1024px`, `xl 1280px`.
- **Mobile-first.** Most Bangladeshi traffic will be Android phones on mobile data. Build the 375px view first and make it excellent; desktop is the easier problem.

### 2.7 Motion

- One orchestrated moment on the homepage (a single hero reveal), nothing else automatic.
- Everything else is response-to-action: drawer slides, accordion opens, add-to-cart confirmation, image zoom.
- Durations: 150ms for micro-feedback, 250ms for panels, 400ms max for anything.
- Respect `prefers-reduced-motion: reduce` — disable transforms, keep opacity changes.

### 2.8 Logo usage

Since the logo exists, define its rules now so the site stays consistent:
- Clear space equal to the logo's cap-height on all sides.
- Minimum size: 120px wide desktop header, 96px mobile.
- Export SVG for web, PNG at 1x/2x/3x for fallback, plus a monochrome version for the dark footer and a square version for favicon/social/WhatsApp.
- Favicon set: `favicon.ico` (32×32), `icon.svg`, `apple-touch-icon.png` (180×180), `icon-192.png`, `icon-512.png`, `og-image.jpg` (1200×630).

### 2.9 Component inventory

Build these once, reuse everywhere:

**Primitives:** Button (primary/secondary/ghost/destructive/icon), Link, Input, Textarea, Select, Checkbox, Radio, Switch, Quantity stepper, Badge, Tag, Tooltip, Avatar, Divider, Spinner, Skeleton loader, Progress bar.

**Composites:** Product card, Product grid, Image gallery with thumbnails + zoom, Variant selector (color/size swatches), Price display (with compare-at and currency), Star rating, Review card, Breadcrumbs, Pagination, Filter sidebar, Sort dropdown, Accordion, Tabs, Modal/Dialog, Slide-over drawer (cart, filters, mobile nav), Toast/notification, Announcement bar, Newsletter form, Search bar with autocomplete, Empty state, Error state, Order summary, Address form, Step indicator (checkout), Trust badge row, Size guide table, Care instructions block, FAQ accordion, Instagram/social strip, Sticky mobile add-to-cart bar.

---

## 3. Information architecture — full sitemap

### 3.1 Complete page list

```
/                                   Homepage
/shop                               All products
/shop/jute                          Jute bags
/shop/jute/tote-bags
/shop/jute/shopping-bags
/shop/jute/side-bags
/shop/jute/handbags
/shop/leather                       Leather bags
/shop/leather/handbags
/shop/leather/side-bags
/shop/leather/crossbody
/shop/leather/tote-bags
/shop/mixed                         Jute + leather combination pieces
/shop/new                           New arrivals
/shop/bestsellers
/shop/sale                          (only if you actually discount)
/shop/gifts                         Gift-ready / under ৳X
/collections/[slug]                 Curated collections (seasonal, festival, etc.)
/product/[slug]                     Product detail page
/search                             Search results
/cart                               Cart page (plus slide-over drawer)
/checkout                           Checkout
/checkout/success                   Order confirmation
/checkout/failed                    Payment failure
/checkout/cancelled                 Payment cancelled

/account                            Dashboard
/account/orders
/account/orders/[id]                Order detail
/account/addresses
/account/wishlist
/account/profile
/account/change-password
/login
/register
/forgot-password
/reset-password/[token]
/verify-email/[token]
/track-order                        Guest order tracking (order # + email/phone)

/about                              The maker's story
/about/process                      How a bag is made
/about/materials                    Jute and leather sourcing
/custom-orders                      Bespoke / made-to-order enquiry
/wholesale                          B2B / bulk enquiry
/care                               Bag care & maintenance guide
/size-guide                         Dimensions explained + comparison
/faq
/contact
/blog                               Journal (optional but valuable for SEO)
/blog/[slug]
/reviews                            All customer reviews
/shipping                           Shipping information & rates
/returns                            Returns & exchanges

/policies/terms                     Terms & conditions
/policies/privacy                   Privacy policy
/policies/cookies                   Cookie policy
/policies/refund                    Refund & return policy
/policies/shipping                  Shipping policy (may merge with /shipping)
/policies/accessibility             Accessibility statement
/policies/intellectual-property     Copyright & IP notice

/sitemap.xml
/robots.txt
/404
/500
/offline                            PWA offline fallback (optional)
```

### 3.2 Header structure

**Announcement bar** (dismissible, one message only):
`Free delivery inside Dhaka on orders over ৳3,000` — or for international visitors, `We ship worldwide — DHL delivery in 7–14 days`

**Main header (desktop):**
```
[Logo]   Jute ▾   Leather ▾   Collections   Our Story   Care        [Search] [Account] [Wishlist] [Cart ▸ 2]
```
- Currency/language switcher sits top-right in the announcement bar or as a small control in the header.
- Sticky on scroll, condensed height after 100px.

**Main header (mobile):**
```
[☰]        [Logo]        [Search] [Cart ▸ 2]
```
- Hamburger opens a full-height slide-over with accordion categories, account links, currency switcher, and contact/WhatsApp.

**Mega-menu content for "Jute" / "Leather":** category links in one column, a "shop by use" column (Everyday / Work / Travel / Gift), and a featured product image with a link. Keep it to two columns and one image — anything more is noise.

### 3.3 Footer structure

Four columns + a bottom bar.

**Column 1 — Shop:** Jute bags · Leather bags · New arrivals · Best sellers · Gifts · All products
**Column 2 — Help:** Contact · Shipping · Returns & exchanges · Track your order · FAQ · Size guide · Bag care
**Column 3 — About:** Our story · How a bag is made · Materials · Custom orders · Wholesale · Journal · Reviews
**Column 4 — Stay in touch:** Newsletter form (single field + button), social icons (Facebook, Instagram, WhatsApp, Pinterest), phone number, email, physical address.

**Bottom bar:** `© 2026 [Brand]. All rights reserved.` · Terms · Privacy · Cookies · Accessibility · IP notice · Payment method logos (bKash, Nagad, Visa, Mastercard, Amex) · "Made in Bangladesh 🇧🇩"

Include the **full physical address and a working phone number** in the footer. Nothing signals "real business" harder, in either market.

---

## 4. Product taxonomy & catalog structure

### 4.1 Primary axis: material

- **Jute** — natural fibre, eco angle, lighter price point
- **Leather** — premium, durability angle, higher price point
- **Jute + Leather** — combination pieces (jute body, leather straps/trim), often the most distinctive product and the best margin story

### 4.2 Secondary axis: bag type

| Type | Description | Typical dimensions |
|---|---|---|
| Handbag | Structured, top-handle, women's | 30×24×12 cm |
| Side bag / Shoulder bag | Single strap, worn on shoulder | 28×22×8 cm |
| Crossbody | Long adjustable strap | 24×18×7 cm |
| Tote | Large, open, two handles | 38×36×12 cm |
| Shopping bag | Utility, foldable, jute | 40×35×15 cm |
| Laptop / office bag | Padded sleeve | 40×30×8 cm |
| Clutch / purse | Small, no strap or wrist strap | 22×13×4 cm |
| Backpack | If he makes them | 40×28×14 cm |

### 4.3 Filter facets (on category pages)

- Material — Jute / Leather / Jute + Leather
- Type — as above
- Color
- Price range (slider, in active currency)
- Size — Small / Medium / Large (define the cm ranges)
- Availability — In stock / Made to order
- Closure — Zip / Magnetic / Drawstring / Open
- Strap — Shoulder / Crossbody / Handle / Detachable

### 4.4 Sort options

Newest · Price low→high · Price high→low · Best selling · Highest rated

### 4.5 Collections (merchandising, not taxonomy)

Cross-cutting curated sets that can contain anything: "Eid gifts," "Everyday carry," "Under ৳2,000," "The jute edit," "New this month," "One-of-a-kind." Give each a hero image and a short intro paragraph — collections are strong SEO landing pages.

### 4.6 Naming convention

`[Color] [Material] [Type]` — e.g. "Chestnut Leather Crossbody," "Natural Jute Shopping Bag."
Optionally give a signature product line a name ("The Shitalakshya Tote") — memorable, but only if you can be consistent about it. Include the descriptive words in the page title regardless, for search.

### 4.7 SKU convention

`[MAT]-[TYPE]-[COLOR]-[NNN]`
Examples: `JUT-TOT-NAT-001`, `LEA-CRS-CHE-014`, `MIX-HND-TAN-003`

---

## 5. Data models

### 5.1 Product

```
Product
├─ id
├─ slug                       (unique, URL-safe)
├─ name_en, name_bn
├─ short_description_en/bn    (1–2 lines, used in cards & meta)
├─ description_en/bn          (rich text)
├─ material                   enum: jute | leather | mixed
├─ bag_type                   enum
├─ collections[]              many-to-many
├─ tags[]
├─ base_price_bdt
├─ base_price_usd             (set manually — don't auto-convert; round to clean numbers)
├─ compare_at_price_bdt/usd   (nullable — for showing a strikethrough)
├─ cost_price                 (admin-only, for margin reports)
├─ dimensions {l, w, h}       cm
├─ strap_drop                 cm (nullable)
├─ weight_grams               (needed for international shipping quotes)
├─ capacity_note              e.g. "Fits a 13" laptop, A4 documents"
├─ materials_detail           e.g. "Full-grain buffalo leather 1.4mm, cotton twill lining, antique brass hardware"
├─ care_instructions          (can reference a shared care template)
├─ made_to_order              bool
├─ production_days            int (if made to order)
├─ variants[]
├─ images[]
├─ status                     draft | active | archived
├─ featured                   bool
├─ meta_title, meta_description
├─ created_at, updated_at, published_at
└─ view_count, sold_count
```

### 5.2 Variant

```
Variant
├─ id, product_id
├─ sku                        (unique)
├─ color_name, color_hex
├─ size_label                 (nullable)
├─ price_override_bdt/usd     (nullable)
├─ stock_quantity
├─ low_stock_threshold        default 3
├─ barcode                    (nullable)
├─ image_id                   (which gallery image represents this variant)
└─ is_active
```

### 5.3 Image

```
ProductImage
├─ id, product_id, variant_id (nullable)
├─ url_original, url_2000, url_1200, url_600, url_300  (or a transform-on-demand CDN)
├─ blur_placeholder           (base64 LQIP)
├─ alt_text_en, alt_text_bn   (REQUIRED — not optional)
├─ position
└─ type                       product | lifestyle | detail | scale | maker
```

### 5.4 Order

```
Order
├─ id
├─ order_number               human-readable, e.g. BD-2026-00412
├─ customer_id                (nullable — guests allowed)
├─ email, phone
├─ status                     pending | confirmed | in_production | packed | shipped | delivered | cancelled | returned | refunded
├─ payment_status             unpaid | paid | partially_refunded | refunded | failed
├─ payment_method             cod | bkash | nagad | card | bank_transfer
├─ payment_reference          gateway transaction id
├─ currency                   BDT | USD
├─ subtotal, discount_total, shipping_total, tax_total, grand_total
├─ coupon_code                (nullable)
├─ shipping_address {}        snapshot, not a reference
├─ billing_address {}         snapshot
├─ shipping_method
├─ courier_name, tracking_number, tracking_url
├─ customer_note
├─ internal_note              admin-only
├─ ip_address, user_agent     (fraud review)
├─ placed_at, confirmed_at, shipped_at, delivered_at, cancelled_at
└─ items[]
```

### 5.5 OrderItem

```
OrderItem
├─ id, order_id, product_id, variant_id
├─ product_name_snapshot      (never join to live product for historical orders)
├─ sku_snapshot
├─ variant_label_snapshot
├─ image_url_snapshot
├─ unit_price, quantity, line_total
└─ personalization_note       (monogram, custom strap length, etc.)
```

Snapshotting matters. If your father renames a product or changes its price, three-year-old invoices must not change.

### 5.6 Other models

```
Customer        id, email (unique), phone, password_hash, first_name, last_name,
                email_verified_at, marketing_opt_in, accepts_sms, default_address_id,
                total_orders, total_spent, created_at, last_login_at, is_blocked

Address         id, customer_id, label, recipient_name, phone, line1, line2,
                area/thana, city/district, division/state, postcode, country, is_default

Review          id, product_id, customer_id, order_id, rating (1–5), title, body,
                images[], verified_purchase (bool), status (pending|approved|rejected),
                admin_reply, created_at

Coupon          id, code, type (percent|fixed|free_shipping), value, min_order_value,
                usage_limit_total, usage_limit_per_customer, used_count,
                applies_to (all|collection|product), starts_at, ends_at, is_active

Wishlist        id, customer_id, product_id, variant_id, created_at

Cart            id, customer_id (nullable), session_token, currency, items[],
                created_at, updated_at, abandoned_email_sent_at

Newsletter      id, email, source, confirmed (double opt-in), unsubscribed_at

ContactMessage  id, name, email, phone, subject, message, type (general|custom|wholesale|complaint),
                status (new|in_progress|resolved), created_at

Page            id, slug, title_en/bn, body_en/bn, meta_title, meta_description,
                status, updated_at         ← for CMS-managed pages

AuditLog        id, admin_user_id, action, entity_type, entity_id, before_json,
                after_json, ip, created_at

StockMovement   id, variant_id, delta, reason (sale|restock|adjustment|return|damage),
                order_id (nullable), note, created_by, created_at
```

---

## 6. Page-by-page specification

### 6.1 Homepage

Order of sections, top to bottom:

1. **Announcement bar** — one message, dismissible, stores dismissal in localStorage.
2. **Header.**
3. **Hero.** One large photograph of the most characteristic bag, shot in real light. Overlaid headline (max 8 words) + one supporting sentence + one primary CTA ("Shop the bags") + one secondary text link ("Meet the maker"). Do **not** use a rotating carousel — carousels measurably reduce clicks and hurt LCP.
4. **Category entry.** Three or four large image tiles: Jute · Leather · Jute + Leather · Gifts.
5. **Featured products.** 4–8 items in a grid (desktop) / horizontal scroll (mobile). Real products, real prices.
6. **The maker strip.** A photo of your father at work, 2–3 sentences, link to `/about`. This is the section that differentiates you — give it real space, full-bleed if the photo is good.
7. **Why these bags.** Four short value points with small icons or numbers: Handmade by one person · Natural jute & full-grain leather · Ships worldwide · 7-day easy return. Keep to one line each.
8. **Reviews.** Three real reviews with names, star ratings, and — if possible — customer photos. Link to `/reviews`.
9. **How a bag is made.** A short visual sequence (this genuinely is a sequence, so numbering is appropriate here): material selection → cutting → stitching → finishing. Link to `/about/process`.
10. **Instagram / social strip.** 6 recent images, linked out.
11. **Newsletter.** One field, one button, one line of copy stating what they'll get and how often.
12. **Footer.**

**Homepage rules**
- LCP element is the hero image: preload it, serve AVIF/WebP, size it correctly, no lazy-loading on it.
- Total homepage weight target: under 1.2 MB on first load.
- Every image below the fold: `loading="lazy"` + explicit width/height to prevent layout shift.

### 6.2 Category / listing page

**Above the fold:** breadcrumb, H1 (category name), a 2–3 sentence category description (SEO value + helps shoppers), result count.

**Layout:** filter sidebar (desktop, left) / filter drawer button (mobile) + product grid.
- Grid: 4 columns xl, 3 columns lg, 2 columns mobile. Two columns on mobile beats one — more products visible, less scrolling.
- Filters update the URL (`?material=jute&color=natural&sort=newest`) so states are shareable and indexable.
- Applied filters show as removable chips above the grid, plus a "Clear all."
- Pagination: prefer "Load more" button over infinite scroll (infinite scroll breaks the footer and back-button behavior). Include real paginated URLs underneath for crawlers.
- Empty state: "No bags match these filters" + a "Clear filters" button + 4 suggested products. Never a blank screen.

**Product card contents:** image (with a second image on hover, desktop only), product name, price (with compare-at if discounted), color swatches if multiple variants, badge (New / Low stock / Made to order / Sold out), wishlist heart, and a quick-add button on hover for single-variant products.

### 6.3 Product detail page (the most important page)

**Layout:** two columns desktop (gallery left 55%, info right 45%), stacked on mobile with a sticky add-to-cart bar.

**Gallery**
- 5–8 images minimum: front, back, side, interior (open, with contents), detail shot of stitching/hardware, scale shot (worn by a person), maker shot (his hands on this bag).
- Thumbnail rail (vertical desktop, horizontal mobile).
- Click to zoom (2–3x) or lightbox. Pinch-zoom on mobile.
- Optional: a short 10–20s video of the bag rotating. Big trust win for international buyers.

**Info column, in order**
1. Breadcrumb
2. Product name (H1)
3. Star rating + review count (jumps to reviews section)
4. Price, with currency. If discounted, show compare-at struck through + savings.
5. Short description — two sentences on what it is and who it's for.
6. Variant selector — color swatches showing actual color, size buttons. Unavailable combinations are visibly disabled, not hidden.
7. Quantity stepper.
8. **Primary CTA: "Add to cart"** — full width, unmissable.
9. Secondary: "Buy it now" (skip to checkout) and a wishlist button.
10. Stock signal — "In stock, ships in 2 days" / "Only 2 left" / "Made to order — ready in 7–10 days."
11. Trust row — small icons: Handmade to order · Free delivery over ৳3,000 · 7-day returns · Secure checkout.
12. **Accordion sections** (first one open by default):
    - **Details & dimensions** — exact cm, strap drop, weight, capacity ("fits A4, a 13-inch laptop, a water bottle").
    - **Materials** — specific: leather type and thickness, lining fabric, hardware finish, thread.
    - **Care** — how to clean, how to store, what to avoid.
    - **Shipping & returns** — summarized, with links to full policies.
    - **About natural variation** — one short paragraph explaining that handmade means slight differences in grain, weave, and tone. This single paragraph prevents a meaningful share of returns.
13. Maker credit — a small line with his photo: "Made by hand by [Name] in [Location]."
14. **Reviews section** — average rating, distribution bars, individual reviews with photos, sorting, and a "Write a review" entry point (verified purchasers only).
15. **You may also like** — 4 related products (same category or complementary).
16. **Recently viewed** — 4 items.

**Mobile sticky bar:** appears after the main CTA scrolls out. Contains thumbnail + price + "Add to cart."

**Structured data:** `Product` schema with `offers`, `aggregateRating`, `review`, `brand`, `sku`, `image`, `availability`.

### 6.4 Cart

Two forms: a slide-over drawer (opens on add-to-cart) and a full `/cart` page.

**Contents:** line items with thumbnail, name, variant, unit price, quantity stepper, line total, remove link. Order summary with subtotal, estimated shipping, discount, total. Coupon code field (collapsed by default — an open coupon field makes people leave to hunt for codes). Free-shipping progress bar ("Add ৳400 more for free delivery"). Primary CTA "Proceed to checkout" and a secondary "Continue shopping." Trust icons and payment logos.

**Empty cart state:** friendly line + "Shop all bags" button + 4 best sellers.

**Behavior:** cart persists in localStorage for guests and syncs to the database on login. Stock is re-validated at checkout, not just at add-time.

### 6.5 Checkout

**Single-page accordion checkout** (three collapsible steps on one page) is the right shape for a small store — fewer page loads, less abandonment.

**Step 1 — Contact**
- Email (required), phone (required for BD — couriers call before delivery).
- "Checkout as guest" is the default. Account creation is an optional checkbox at the end, never a wall.
- Existing customer? "Log in" link.

**Step 2 — Delivery**
- Full name, phone, address line 1, address line 2, area/thana, city/district, division, postcode, country.
- Country selector at the top of the address block — it determines the shipping methods and currency shown.
- For Bangladesh: cascading Division → District → Thana dropdowns are far more reliable than free-text.
- "Billing address same as shipping" checkbox, checked by default.
- Delivery method selection with prices and time estimates.
- Optional order note field ("Leave with the guard," "Gift — no invoice inside").

**Step 3 — Payment**
- Payment options as radio cards with logos.
- COD shows any COD fee clearly.
- Card/mobile-wallet flows redirect to the gateway's hosted page or use their hosted iframe. **Your server never touches card numbers** — this keeps you in PCI-DSS SAQ-A, the least burdensome scope.
- Terms acceptance checkbox with links.
- Primary CTA: "Place order — ৳3,450" (put the amount in the button).

**Persistent order summary** — right column desktop, collapsible "Show order summary" bar at the top on mobile.

**Checkout rules**
- No forced registration. Ever.
- Autofill-friendly: correct `autocomplete` attributes on every field (`given-name`, `tel`, `address-line1`, `postal-code`, `country`).
- Inline validation on blur, not on every keystroke, and never only on submit.
- Numeric keyboard for phone/postcode on mobile (`inputmode="numeric"`).
- Disable the submit button and show a spinner during submission — double-submission causes duplicate orders and refund headaches.
- Idempotency key on the order-create request.
- Show total cost including shipping before the payment step. Unexpected shipping cost is the number-one abandonment cause worldwide.
- Trust reinforcement in the checkout footer: secure-payment note, phone number, return policy link.

### 6.6 Order confirmation

Order number (large, copyable), summary of items, delivery address, payment method, estimated delivery window, "Track your order" link, "What happens next" in three plain steps, contact details for questions, and a soft CTA to follow on social. Fire your analytics purchase event here.

### 6.7 Account pages

- **Dashboard** — greeting, recent orders, default address, quick links.
- **Orders** — list with status badges, order number, date, total; click through to detail with full timeline (Placed → Confirmed → In production → Shipped → Delivered), tracking link, reorder button, invoice download (PDF), and "Request a return" if within the window.
- **Addresses** — list, add, edit, delete, set default.
- **Wishlist** — grid with move-to-cart.
- **Profile** — name, email, phone, marketing preferences, password change, delete account (a real, working deletion request flow — required under GDPR).

### 6.8 About / Our story

The emotional core of the site. Structure:
- Opening portrait of your father, full-bleed.
- His story in his voice: how he learned, how long, why bags, what he cares about.
- The workshop — photos of the space, the tools, the machines.
- What "handmade" means here, concretely: which steps are done by hand, how long a bag takes.
- Why the family is putting it online now — that's your part of the story, and it's genuine.
- CTA to shop.

Keep it under 600 words with strong photography. Nobody reads a wall of text; everyone looks at photos of a person making things.

### 6.9 Other content pages

- **`/about/process`** — step-by-step, photographed: selecting material → pattern → cutting → skiving/edging → stitching → hardware → finishing → inspection.
- **`/about/materials`** — where the jute comes from, what kind of leather, why, what the hardware is.
- **`/care`** — separate care blocks for jute and leather, storage advice, what to do if it gets wet, how to handle mold in humid weather (very relevant in Bangladesh, and a real credibility signal).
- **`/size-guide`** — a comparison table of all bag types with dimensions, plus a "what fits inside" visual and a diagram explaining how dimensions are measured.
- **`/custom-orders`** — what he can customize (size, color, strap length, monogram), lead time, price range, and an enquiry form.
- **`/wholesale`** — MOQ, lead times, pricing approach, an enquiry form. International boutiques and gift shops are a real channel for handmade goods.
- **`/faq`** — accordion, grouped: Ordering · Payment · Shipping · Returns · Product care · Custom orders. Write 20–30 real questions, including the awkward ones ("Is the leather genuine?" "Why is jute cheaper than leather?" "Do you ship to the USA?").
- **`/contact`** — form + phone + WhatsApp link + email + physical address + an embedded map + response-time expectation ("we reply within 24 hours").
- **`/track-order`** — order number + email or phone, no login needed.

---

## 7. Buttons, CTAs & microcopy inventory

### 7.1 Button hierarchy

| Level | Style | Used for |
|---|---|---|
| Primary | Solid `--jute`, white text | The single main action on a screen: Add to cart, Place order, Continue |
| Secondary | Outlined `--ink` | Alternative actions: Continue shopping, Save address |
| Ghost / text | Text with underline on hover | Tertiary: Clear filters, Cancel, Edit |
| Destructive | Outlined `--clay`, fills on hover | Remove item, Delete address, Cancel order |
| Icon-only | 44×44px minimum tap target, `aria-label` required | Wishlist, close, quantity +/− |

**States required for every button:** default, hover, active/pressed, focus-visible (2px offset outline — never remove it), disabled, loading (spinner + label change).

### 7.2 Complete CTA copy list

| Context | Label |
|---|---|
| Product page main | Add to cart |
| Product page express | Buy it now |
| Out of stock | Sold out — notify me |
| Made to order | Order now — ready in 10 days |
| Cart drawer | View cart · Checkout |
| Cart page | Proceed to checkout |
| Checkout final | Place order — ৳3,450 |
| Empty cart | Shop all bags |
| Category empty | Clear filters |
| Homepage hero | Shop the bags |
| Homepage maker strip | Meet the maker |
| Newsletter | Subscribe |
| Wishlist | Save · Saved |
| Product card hover | Quick add |
| Contact form | Send message |
| Custom order form | Send enquiry |
| Review prompt | Write a review |
| Order page | Track your order · Buy again · Download invoice |
| Account | Save changes |
| Login | Log in · Create account · Forgot password? |

**Rules:** the verb in the button matches the confirmation. "Add to cart" → toast says "Added to cart." "Place order" → page says "Order placed." Never "Submit."

### 7.3 System message copy

| Situation | Message |
|---|---|
| Added to cart | Added to cart. [View cart] |
| Removed | Removed from cart. [Undo] |
| Stock changed mid-checkout | Only 1 left in stock. We've updated your cart. |
| Invalid coupon | That code isn't valid. Check the spelling or try another. |
| Expired coupon | That code expired on 12 March. |
| Payment failed | Payment didn't go through. No money was taken. Try again or choose a different method. |
| Network error | Couldn't connect. Check your internet and try again. |
| Form field required | Enter your phone number so the courier can reach you. |
| Invalid email | That email address doesn't look right. |
| Login failed | Email or password is incorrect. |
| Password reset sent | If that email is registered, a reset link is on its way. |
| Empty search | No bags match "xyz". Try a different word, or browse all bags. |
| 404 | This page doesn't exist. Here's the way back to the bags. |
| 500 | Something broke on our end. We're on it — try again in a moment. |
| Order placed | Order placed. We've emailed your confirmation to name@email.com. |

Errors state what happened and what to do next. They don't apologize and they aren't vague.

---

## 8. Cart, checkout & payments

### 8.1 Bangladesh payment methods

| Method | Notes |
|---|---|
| **Cash on delivery** | Essential. Likely the majority of local orders. Guard against abuse: verify phone via OTP for first-time COD, or cap COD order value. |
| **bKash** | The dominant mobile wallet. Available via aggregators or bKash's own merchant checkout. |
| **Nagad** | Second mobile wallet, growing. |
| **Rocket / Upay** | Lower priority, add if the aggregator includes them free. |
| **Cards (local + international)** | Visa/Mastercard/Amex through a local gateway. |
| **Bank transfer** | Manual, useful for wholesale orders. |

**Aggregators worth evaluating:** SSLCommerz, aamarPay, ShurjoPay, PortWallet, bKash merchant API. A single aggregator that bundles cards + bKash + Nagad in one integration is far less work than four integrations. Compare on: transaction fee %, settlement time, whether they support international cards, whether they support refunds via API, and quality of the developer docs.

### 8.2 International payments — read this carefully

This is the single biggest practical constraint on selling internationally from Bangladesh, and it's worth resolving before you build the checkout.

- **Stripe does not support Bangladesh-based businesses** for receiving payments. Neither does PayPal for standard merchant receiving in Bangladesh. Do not architect around either without confirming current availability yourself.
- **Realistic paths:**
  1. Use a Bangladeshi gateway that supports international card acceptance (SSLCommerz and some others do — confirm their current international card and settlement terms directly).
  2. Use Payoneer or a similar receiving service where supported.
  3. List internationally on a marketplace (Etsy, Amazon Handmade, Faire for wholesale) that handles payment collection and payout, and use your own site as the brand home + local store.
  4. For low international volume: manual invoicing via a service that supports BD payouts.
- **Foreign-exchange regulations.** Bangladesh has rules governing receipt of export earnings through Bangladesh Bank and requires proper documentation for export proceeds. Talk to your bank and, ideally, an accountant about the correct setup for receiving foreign payments for physical exports before you launch international sales.

I'm not a lawyer or a financial advisor and these rules change. Verify all of this directly with your bank, the gateway, and a local accountant. Build the checkout so the payment provider is a swappable module — don't hard-couple your order logic to one gateway's SDK.

### 8.3 Payment integration architecture

```
Order created (status: pending, payment_status: unpaid)
        ↓
Redirect to gateway hosted page  ──────► gateway
        ↓                                   │
Customer returns to /checkout/success       │ (webhook, server-to-server)
        ↓                                   ▼
Show "verifying payment"  ◄──── Webhook handler verifies signature,
                                marks order paid, decrements stock,
                                sends confirmation email
```

**Non-negotiables:**
- Trust the **webhook**, not the browser redirect, to mark an order as paid. Redirects can be forged or abandoned.
- Verify the webhook signature/hash on every call.
- Make webhook handling idempotent — gateways retry, and you must not decrement stock twice.
- Log every gateway request and response (with card data redacted) for dispute resolution.
- Reconcile daily: compare gateway settlement reports against your order records.

### 8.4 Currency handling

- Store prices in both BDT and USD as separate manually-set fields. Do not live-convert — exchange-rate drift produces ugly prices like $23.47 and unpredictable margins.
- Detect country by IP for the default currency, show a dismissible "You're viewing prices in BDT — switch to USD?" prompt, and persist the choice in a cookie.
- Display the currency code alongside the symbol for international users (`$45 USD`) to avoid ambiguity with other dollar currencies.
- Show, for international orders, a clear line: "Import duties and taxes are not included and are the customer's responsibility." This prevents a specific and very common dispute.

---

## 9. Shipping & fulfilment

### 9.1 Domestic (Bangladesh)

- **Couriers to evaluate:** Pathao Courier, Steadfast, RedX, Paperfly, SA Paribahan, Sundarban. Several offer APIs for order creation and tracking — that integration will save your father hours every week.
- **Zones:** Inside Dhaka / Dhaka suburbs / Outside Dhaka. Flat rate per zone is simplest and easiest to communicate.
- **Free shipping threshold:** set one and display progress in the cart. It reliably lifts average order value.
- **Delivery estimate:** Inside Dhaka 1–2 days, outside Dhaka 2–5 days. Under-promise.

### 9.2 International

- **Options:** DHL Express, FedEx, Aramex (fast, expensive), Bangladesh Post EMS (slow, cheap, less reliable tracking).
- **Rate strategy:** weight-based tiers by zone (South Asia / Middle East / Europe / North America / Rest of world). Simplest workable approach: fixed rates per zone per weight band, reviewed quarterly.
- **Every product needs an accurate `weight_grams`** or international rates will be wrong and you'll eat the difference.
- **Customs documentation:** commercial invoice, HS code for the product category, accurate declared value. Under-declaring value to help a customer avoid duty is a bad idea — it voids insurance and creates legal exposure.
- State clearly: delivery estimates exclude customs delays, and duties are the buyer's responsibility.

### 9.3 Packaging

Part of the product experience, especially for gifts and reviews:
- Recycled/kraft box or a jute drawstring dust bag (on-brand and cheap).
- A small printed card: thank you, the maker's name, care instructions, a QR code to the care page and a review link.
- Tissue and a sticker with the logo.
- Waterproof outer layer — monsoon season is real.

### 9.4 Order status flow

```
pending → confirmed → in_production (if made-to-order) → packed → shipped → delivered
                   ↘ cancelled
   delivered → return_requested → returned → refunded
```
Each transition triggers a customer notification (email, and SMS for local orders).

---

## 10. Transactional email & notifications

### 10.1 Required emails

| Trigger | Email |
|---|---|
| Account created | Welcome + verify email |
| Email verification | Verification link (expires in 24h) |
| Password reset requested | Reset link (expires in 1h, single use) |
| Password changed | Security notification |
| Order placed | Order confirmation with full summary |
| Payment received | Payment confirmation (if separate from order) |
| Payment failed | How to retry |
| Order confirmed by admin | "We've started on your order" |
| Order shipped | Tracking number + link + estimated delivery |
| Order delivered | Delivery confirmation + review request (send the review request 3–5 days later, not immediately) |
| Order cancelled | Reason + refund timeline |
| Refund issued | Amount + expected arrival |
| Return approved | Instructions + address |
| Abandoned cart | 1 email at 4 hours, optionally a second at 24 hours. No more. |
| Back in stock | For customers who requested notification |
| Newsletter confirm | Double opt-in confirmation |
| Contact form received | Auto-acknowledgment with expected response time |

### 10.2 Email requirements

- Branded HTML template + plain-text fallback for every email.
- All emails must be readable at 320px width and in dark mode.
- Unsubscribe link in every marketing email (legally required in most markets; never in transactional ones).
- Sender authentication: **SPF, DKIM, and DMARC records configured** on your domain, or your confirmations will land in spam and customers will assume you're a scam.
- Use a transactional provider (Resend, Postmark, SendGrid, Amazon SES) — not your own SMTP server.
- Send from `orders@yourdomain.com`, not gmail. Set a real `Reply-To`.

### 10.3 SMS (Bangladesh)

Local customers respond to SMS far more than email. At minimum: order confirmation and shipped-with-tracking. Use a local SMS gateway. Keep messages short and include the order number and a phone number to call.

---

## 11. Admin panel specification

Your father will use this daily. It must work on a phone, be in Bangla if that's easier for him, and never require you to explain it twice.

### 11.1 Dashboard

- Today: orders count, revenue, pending orders needing action.
- This week vs last week: orders, revenue, average order value.
- **Action queue** — the most important element: "5 orders to confirm," "3 orders to ship," "2 reviews to approve," "1 low-stock item," "2 unanswered messages." Each links straight to the filtered list.
- Recent orders table.
- Low-stock alert list.
- Top products this month.

### 11.2 Orders

- List with filters (status, payment status, date range, courier, search by order number/phone/name) and bulk actions.
- Detail view: customer info, items, addresses, payment details, full status timeline, internal notes, edit shipping address, add tracking number, mark as shipped, issue refund, print invoice, print shipping label, cancel with reason.
- **One-click status advance** — the most-used button in the whole panel. Make it big.
- Export orders to CSV/XLSX for accounting.

### 11.3 Products

- List with search, filter by status/material/stock, bulk activate/deactivate.
- Create/edit form: all fields from the data model, both languages, drag-to-reorder image upload with alt-text fields, variant matrix editor, SEO fields with a live search-result preview, and a "duplicate product" action (enormous time-saver when he makes a similar bag in a new color).
- Inventory view: every variant with current stock, editable inline, with a stock-movement history.
- Draft → preview → publish flow so nothing half-finished goes live.

### 11.4 Other admin sections

- **Customers** — list, detail with order history and lifetime value, block/unblock, add internal note.
- **Reviews** — moderation queue: approve, reject, reply publicly.
- **Coupons** — create, set rules, see usage, deactivate.
- **Collections** — create, assign products, order them, set hero image and copy.
- **Content pages** — edit About, FAQ, policies, care guide without touching code.
- **Blog/journal** — if you build it.
- **Messages** — contact/custom/wholesale enquiries with status tracking.
- **Newsletter** — subscriber list, export, unsubscribe handling.
- **Media library** — all uploaded images, searchable, with usage indicators.
- **Reports** — sales by day/week/month, by product, by category, by channel; top products; low stock; abandoned carts; refund rate.
- **Settings** — store info, currencies, shipping zones and rates, payment methods, tax settings, email templates, announcement bar, social links, SEO defaults.
- **Users & roles** — Owner (everything), Manager (orders, products, customers), Staff (orders only). With audit logging on every change.

### 11.5 Admin UX rules

- Mobile-responsive. He will process orders from his phone.
- Confirmation dialogs on destructive actions, with the item name in the dialog.
- Undo where possible instead of confirm-everything.
- Autosave drafts on product forms — losing 20 minutes of typing is how you lose a user forever.
- Show the customer-facing preview of anything he edits.
- Bangla interface option, or at minimum Bangla labels on the screens he uses most.

---

## 12. Tech stack

### 12.1 Honest option comparison

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Shopify** | Everything works day one; payments, tax, shipping, apps | Monthly fee in USD; limited BD payment gateway support; you learn a platform, not engineering | Fastest to revenue, weakest for your portfolio |
| **WooCommerce** | Free, huge BD gateway plugin ecosystem, lots of local dev help | WordPress maintenance, plugin bloat, slow without effort | Pragmatic, unglamorous |
| **Medusa.js** (headless) + Next.js storefront | Open source, TypeScript, real ecommerce primitives (carts, orders, fulfilment) already solved, custom payment providers are a documented plugin interface | You still build the storefront and admin customizations | **Best balance for you** |
| **Fully custom** Next.js + Postgres | Total control, best learning, strongest portfolio piece, deploys to Vercel as one project | You will rebuild carts, tax, inventory races, and refunds — all of which are subtly hard | **SELECTED** — see the decision below |

**Original recommendation:** Medusa backend + Next.js storefront.

> **DECISION (2026-09-08): fully custom Next.js + Prisma + Postgres.** Medusa needs a long-running Node process plus Redis, which Vercel cannot host — it would have required a second hosting provider (Railway/Render/Fly) on day one. Since the near-term goal is a Vercel deployment, the whole application is built as a single Next.js App Router project: storefront, admin, and API routes together, Prisma against Postgres, no separate backend service.
>
> The cost of this choice is exactly what the table above warns about: carts, inventory races, order state, and refunds are now ours to get right. The mitigations are treated as build requirements, not nice-to-haves:
>
> - **Inventory races** — stock decrement happens inside a database transaction with a conditional update (`WHERE stock_quantity >= n`), never a read-then-write. Section 23.3's "two customers buy the last item simultaneously" is a required test.
> - **Order state** — transitions live in a single explicit state machine module, not status strings assigned ad hoc across route handlers.
> - **Payments** — every gateway sits behind our own `PaymentProvider` interface (section 8.3), so the provider stays swappable and the unresolved international-payments question in section 8.2 can be answered later without touching order logic.
> - **Money** — all amounts are stored and computed as integer minor units (poisha / cents). No floating-point anywhere in pricing, discount, shipping, or tax.
> - **Idempotency** — order creation takes an idempotency key, and webhook handling records processed event IDs, per section 8.3.
>
> If the catalog or the operational load ever outgrows this, the Prisma schema maps cleanly onto Medusa's primitives and the payment interface is already abstracted, so migrating later is a real option rather than a rewrite.

### 12.2 Reference stack (as built)

```
Frontend      Next.js (App Router) + TypeScript
Styling       Tailwind CSS with the design tokens above mapped to theme config
State         React Server Components + Zustand or Context for cart
Backend       Next.js Route Handlers + Server Actions + Prisma   [SELECTED]
Database      PostgreSQL (Neon, Supabase, or Railway)
Cache/queue   Redis (sessions, rate limiting, background jobs)
Images        Cloudinary or Uploadthing or S3 + Cloudflare Images
Search        Postgres full-text to start; Meilisearch/Typesense if the catalog grows
Email         Resend or Postmark
SMS           Local BD SMS gateway
Auth          Auth.js (NextAuth) or Lucia, sessions in httpOnly cookies
Payments      Local aggregator (SSLCommerz/aamarPay/ShurjoPay) behind your own interface
Analytics     GA4 + Meta Pixel + Plausible/Umami (privacy-friendly)
Hosting       Vercel (one project: storefront + admin + API) + managed Postgres (Neon)
CDN/security  Cloudflare in front of everything
Monitoring    Sentry (errors) + Better Stack / UptimeRobot (uptime)
Repo/CI       GitHub + GitHub Actions
```

### 12.3 Repo structure (as built — single Next.js app, not a monorepo)

The monorepo layout below was the plan while the backend was a separate service. With the fully-custom decision there is only one deployable, so a monorepo would be overhead with no benefit. Actual structure:

```
/prisma
  schema.prisma          All models from section 5
  seed.ts                Realistic sample catalog
/src
  /app
    /(storefront)        Customer site — home, shop, product, cart, checkout
    /admin               Admin panel (section 11)
    /api                 Route handlers — orders, webhooks, auth
  /components
    /ui                  Primitives (section 2.9)
    /commerce            Product card, gallery, variant selector, cart
  /lib
    money.ts             Integer minor units, formatting, BDT/USD
    cart.ts              Cart logic
    inventory.ts         Transactional stock movement
    orders.ts            Order state machine
    /payments            PaymentProvider interface + per-gateway adapters
    /shipping            Zone + rate resolution
  /styles                Design tokens (section 2.2 Option D)
/docs                    This plan, ADRs, runbooks
```

Original monorepo layout, kept for reference in case a separate backend is ever split out:

```
/apps
  /storefront        Next.js customer site
  /admin             Admin panel (or Medusa Admin extended)
  /backend           API / Medusa
/packages
  /ui                Shared components & design tokens
  /config            ESLint, TS config, Tailwind preset
  /types             Shared TypeScript types
/docs                This plan, ADRs, runbooks
```

### 12.4 Environments

- `local` — Docker Compose with Postgres + Redis, seeded with realistic sample data.
- `staging` — full copy, real gateway in sandbox/test mode, password-protected, `noindex`.
- `production`.

Never test payments in production. Never point staging at the production database.

---

## 13. Security

### 13.1 Transport & headers

- HTTPS everywhere, HTTP → HTTPS redirect, TLS 1.2 minimum (1.3 preferred).
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Content-Security-Policy` — start in report-only, tighten to a strict allowlist. No `unsafe-inline` scripts.
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (or `frame-ancestors 'none'` in CSP)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — disable camera, microphone, geolocation unless used.

### 13.2 Authentication

- Password hashing with **Argon2id** (or bcrypt cost ≥ 12). Never MD5/SHA family.
- Minimum 8 characters, checked against a breached-password list (HaveIBeenPwned range API). No forced rotation, no silly composition rules.
- Sessions in `httpOnly`, `Secure`, `SameSite=Lax` cookies. If using JWT, keep access tokens short-lived with refresh-token rotation.
- **2FA mandatory on all admin accounts** (TOTP). This is the single highest-value security control on the whole site.
- Rate-limit login: 5 attempts per email per 15 minutes, plus per-IP limits. Exponential backoff or temporary lock.
- Password reset tokens: cryptographically random, hashed in the database, single-use, 1-hour expiry.
- Generic responses on login/reset ("Email or password is incorrect", "If that email is registered…") so you don't leak which accounts exist.
- Session invalidation on password change and a "log out all devices" option.

### 13.3 Authorization

- Server-side permission check on **every** admin endpoint. Never rely on the UI hiding a button.
- Check object ownership on every customer-facing resource — a customer must not be able to fetch `/api/orders/1234` for someone else's order. This class of bug (IDOR) is the most common serious flaw in small ecommerce sites.
- Use non-sequential public identifiers (UUIDs or a hashed order reference) for anything exposed in URLs.

### 13.4 Input & output

- Validate and type every input server-side with a schema library (Zod). Client validation is UX, not security.
- Parameterized queries only — use the ORM properly, never string-concatenate SQL.
- Escape output by default (React does this; be careful with `dangerouslySetInnerHTML` — sanitize any rich text with DOMPurify).
- CSRF tokens on all state-changing form posts, or strict `SameSite` cookies plus origin checking.
- File uploads: allowlist MIME types and extensions, verify magic bytes, cap size, strip EXIF, re-encode images server-side, store outside the web root or on object storage, serve from a separate domain.

### 13.5 Payments & sensitive data

- **Never store card numbers, CVVs, or full PANs.** Use hosted gateway pages or hosted fields so you stay in PCI-DSS SAQ-A scope.
- Store only what you need: last four digits and card brand, at most.
- Verify all webhook signatures. Reject unsigned or replayed webhooks (check timestamp freshness and store processed event IDs).
- Encrypt sensitive fields at rest where applicable; the database itself should have encryption at rest enabled.

### 13.6 Abuse & fraud

- Rate limit: API endpoints per IP and per user; strict limits on login, register, password reset, coupon validation, and contact forms.
- Bot protection on forms: Cloudflare Turnstile or hCaptcha (not the intrusive puzzle kind).
- COD abuse controls: OTP-verify phone on first COD order, or limit COD above a value threshold, and maintain a blocklist of numbers with repeated refusals.
- Coupon abuse: enforce per-customer limits server-side, and validate the coupon again at order creation, not just when applied.
- Log suspicious activity: multiple failed payments, rapid address changes, orders from mismatched IP country.

### 13.7 Operational security

- All secrets in environment variables or a secret manager. **Never in the repo.** Add `.env` to `.gitignore` on day one and use `git-secrets` or GitHub secret scanning.
- Rotate credentials if anything is ever committed — assume it's compromised.
- Dependabot/Renovate for dependency updates; `npm audit` in CI.
- Principle of least privilege on database users and cloud IAM.
- **Automated daily database backups with a tested restore.** An untested backup is not a backup — restore it to staging once a quarter.
- Off-site backup copy (different provider/region).
- Sentry for error tracking with PII scrubbing enabled.
- Audit log of every admin action (who, what, before, after, when).
- Cloudflare WAF + DDoS protection in front of the origin; hide the origin IP.
- An incident plan written down: who to call, how to take the store offline, how to notify customers, how to rotate keys.

### 13.8 Privacy by design

- Collect only what you need. You don't need a date of birth to sell a bag.
- Data retention policy: define how long you keep orders (accounting requirements), carts (30–90 days), and logs (30–90 days), then actually delete.
- A working account-deletion flow that anonymizes rather than breaks historical orders.
- Cookie consent banner with **granular** choices (necessary / analytics / marketing) and no non-essential scripts firing before consent. Required for EU visitors, and you will have EU visitors.
- Document what third parties receive data (gateway, courier, email provider, analytics) in the privacy policy.

---

## 14. Trust & credibility measures

For a new, unknown brand, trust is the entire conversion problem. Every item below is worth building.

### 14.1 Identity signals

- Real physical address in the footer and on the contact page.
- A working phone number, prominently displayed, that someone actually answers.
- WhatsApp click-to-chat button (floating, bottom-right, dismissible) — huge in Bangladesh, increasingly normal internationally.
- Business registration details in the footer if you have a trade licence number.
- Named people with photographs. Anonymous brands look like drop-shippers.
- An active, linked social presence with recent posts. An Instagram with 6 posts from 2024 is worse than no link.

### 14.2 Product-level trust

- Many high-quality real photos, including imperfections and close-ups. Stock photos destroy trust instantly.
- A video of the bag being turned in someone's hands.
- Exact dimensions, weight, and materials — vagueness reads as hiding something.
- The natural-variation disclosure.
- Scale reference — a person holding or wearing the bag.
- Care instructions, which imply the product is meant to last.

### 14.3 Social proof

- Verified-purchase reviews with a badge, star distribution, and photo reviews.
- Publicly reply to reviews — especially negative ones. A well-handled 3-star review builds more trust than a wall of 5-stars.
- Don't fake reviews. Beyond being unethical and illegal in many markets, they read as fake and destroy the credibility of the real ones.
- Customer photos section / UGC.
- Any press, exhibition, or fair participation, with logos.

### 14.4 Transaction trust

- Clear, generous, plainly-worded return policy, linked from the product page and the cart.
- Secure-checkout messaging and payment method logos.
- Order tracking that works without an account.
- Confirmation email within seconds of ordering.
- Proactive updates when something is delayed — an email saying "your bag is taking 2 extra days" prevents a chargeback.
- Visible response-time promise on contact.

### 14.5 Policy trust

- Every policy page written in plain language, not copy-pasted legalese from a generator.
- No dark patterns: no fake countdown timers, no fake "17 people are viewing this," no pre-ticked marketing checkboxes, no hidden subscription enrolment. These convert slightly better short-term and destroy repeat business.

---

## 15. Legal pages & policies

I'm not a lawyer, and requirements differ by jurisdiction — and you're selling into many. Use the outlines below as the content brief, then have a Bangladeshi lawyer review the set before launch, especially the terms and refund policy. Budget for this; it's a few hours of professional time, not a large expense.

### 15.1 Terms & conditions

Sections to cover: who the seller is (legal name, address, registration/BIN if applicable) · scope of the agreement · eligibility to purchase · account responsibilities · how an order forms a contract (and your right to refuse or cancel an order, e.g. pricing errors) · prices, currency, and taxes · payment terms · shipping and delivery, risk of loss transfer · customs duties for international orders · returns, cancellations, and refunds (or cross-reference) · handmade product variation disclaimer · warranty and defect handling · limitation of liability · indemnity · intellectual property ownership · user-generated content licence (reviews and photos customers submit) · prohibited uses · third-party links · modification of terms · termination · governing law and jurisdiction (Bangladesh) · dispute resolution · contact details.

### 15.2 Privacy policy

Cover: identity and contact of the data controller · what personal data you collect (name, email, phone, addresses, order history, payment metadata, IP, device, cookies) · how it's collected · why (legal bases if you're addressing GDPR: contract performance, legitimate interest, consent) · who you share it with (payment gateway, courier, email provider, analytics, hosting) and where they are · international transfers · how long you keep each category · security measures · data subject rights (access, rectification, erasure, portability, objection, withdrawing consent) and how to exercise them · cookies (cross-reference) · children's data (state you don't knowingly collect from under-16s/under-13s) · changes to the policy · complaint route.

### 15.3 Cookie policy

What cookies are · the categories you use with a **table listing each cookie, its purpose, provider, and duration** · how to change preferences (link to reopen the consent manager) · how to control cookies in the browser · third-party cookies from analytics and ad pixels.

### 15.4 Refund & return policy

The most-read policy page. Cover: the return window (14 days is a good, competitive standard; EU consumers have a statutory 14-day withdrawal right for distance sales) · condition required (unused, tags attached, original packaging) · what's non-returnable (custom/monogrammed items, sale items if you choose) · how to start a return, step by step · who pays return shipping (domestic vs international — be explicit) · refund method and timeline ("5–10 working days after we receive the item") · exchanges · damaged or wrong item received (you pay, always) · the handmade-variation clause: natural differences in grain, weave, and colour are not defects · cancellation before dispatch · COD order refusal policy.

### 15.5 Shipping policy

Processing time · domestic zones, rates, and estimates · international zones, rates, and estimates · couriers used · tracking · duties and taxes disclaimer · undeliverable/refused packages · lost or delayed shipments and what you do about them · address accuracy responsibility · restricted destinations.

### 15.6 Accessibility statement

Your commitment · the standard you target (WCAG 2.2 Level AA) · known limitations and when you plan to fix them · how to report a barrier and expected response time.

### 15.7 Additional pages worth having

- **Intellectual property notice** (see next section).
- **Wholesale terms** if you sell B2B.
- **Custom order terms** — deposit, lead time, and the fact that custom items aren't returnable.
- **Anti-counterfeit / authenticity statement** if that becomes relevant.

### 15.8 Regulatory notes to check with a professional

- Bangladesh's Digital Commerce guidelines set expectations for online sellers regarding delivery timelines, refund timelines, and disclosure of business information — confirm the current version and what it requires of you.
- Trade licence, TIN, and VAT/BIN registration requirements for an ecommerce business.
- Consumer Rights Protection Act obligations for sellers in Bangladesh.
- GDPR/UK GDPR if you knowingly sell to the EU/UK — this affects consent, rights handling, and your privacy policy.
- CCPA/CPRA if you sell to California above the applicable thresholds.
- Export documentation and foreign-exchange rules for receiving payment for exported goods.

---

## 16. Copyright, trademark & IP

### 16.1 Protecting your own work

- **Copyright notice** in the footer: `© 2026 [Brand Name]. All rights reserved.` Copyright in your photographs, site copy, and designs exists automatically on creation, but registering with Bangladesh's Copyright Office creates a stronger record if you ever need to enforce it.
- **Trademark**: register the brand name and logo with the Department of Patents, Designs and Trade Marks (DPDT) in Bangladesh. If international sales grow, consider filing in your main export markets. Do this early — the name gets more expensive to defend later.
- **Industrial design registration** is worth asking about for genuinely distinctive bag designs your father originates.
- **Photography**: shoot your own. Every photo on the site should be yours. Keep the RAW files with timestamps — they're your proof of authorship.
- **Watermarking**: subtle, corner-placed, on lifestyle images if copying becomes a problem. Don't watermark heavily; it hurts conversion.
- **Terms clause** stating that site content may not be reproduced without permission, plus a takedown contact address.
- Register the `.com` and `.com.bd` variants of your name plus obvious misspellings.

### 16.2 Respecting others' IP

- **Fonts** — check every licence. Google Fonts (OFL/Apache) are safe for commercial use; many "free download" fonts are not licensed for commercial web use. Keep a `LICENSES.md` recording each font, its licence, and its source.
- **Icons and illustrations** — Lucide, Heroicons, Phosphor are permissive; verify before use.
- **Stock imagery** — if you use any (backgrounds, blog headers), keep the licence receipt. Better: don't use stock at all.
- **Code** — check the licences of every dependency. Avoid AGPL components in a commercial product unless you understand the obligations. Run a licence checker in CI.
- **Music in videos** — one of the most common takedown causes. Use properly licensed tracks only.
- **Brand names** — don't describe a bag as "Birkin style" or use another brand's name in your keywords. That's trademark infringement and it will get your ads and listings pulled.

### 16.3 User-generated content

Your terms need a clause where customers grant you a non-exclusive, royalty-free licence to use review text and photos they submit, in marketing and on the site. Without it, reposting a customer's photo is technically infringing their copyright. Ask permission explicitly for anything you feature prominently.

---

## 17. SEO

### 17.1 Technical

- Clean, readable, permanent URLs. Never change a product slug without a 301 redirect.
- `sitemap.xml` (auto-generated, including products, categories, collections, blog, static pages), submitted to Google Search Console and Bing.
- `robots.txt` — block `/admin`, `/checkout`, `/account`, `/cart`, `/search`, and any faceted URLs you don't want indexed.
- Canonical tags on every page; self-referencing by default, pointing filtered/paginated variants to the canonical version where appropriate.
- `hreflang` tags for `en` and `bn` versions, plus `x-default`.
- Server-render everything customer-facing. Client-only rendering is still an SEO risk for a new site.
- Core Web Vitals: pass all three (LCP, INP, CLS) — see section 19.
- HTTPS, mobile-friendly, no intrusive interstitials.
- Fix broken links and orphan pages; run a crawl (Screaming Frog free tier) before launch.

### 17.2 Structured data (JSON-LD)

| Page | Schema |
|---|---|
| All pages | `Organization` (with logo, address, contact, sameAs social links) |
| Homepage | `WebSite` with `SearchAction` |
| Product page | `Product` + `Offer` + `AggregateRating` + `Review` |
| Category | `CollectionPage` + `ItemList` |
| All pages | `BreadcrumbList` |
| FAQ | `FAQPage` |
| Blog post | `Article` / `BlogPosting` |
| Contact | `LocalBusiness` if you have a physical location visitors can use |

Validate everything in Google's Rich Results Test.

### 17.3 On-page

- One `<h1>` per page containing the primary keyword naturally.
- Title tags: `[Product Name] — Handmade [Material] Bag | [Brand]`, under 60 characters.
- Meta descriptions: 140–160 characters, written to earn a click, unique per page.
- Descriptive alt text on every image (also an accessibility requirement).
- Internal linking: products link to related products, categories, and the care/materials pages.
- Category pages need real intro copy (150–300 words), not just a grid.

### 17.4 Keyword directions

Local: `জুট ব্যাগ`, `chamra bag`, `handmade bag Bangladesh`, `jute bag price in BD`, `ladies side bag Dhaka`.
International: `handmade jute bag`, `eco friendly jute tote`, `handmade leather crossbody bag`, `fair trade bags Bangladesh`, `sustainable jute shopping bag`, `artisan made leather handbag`.
Long tail is where a new site wins: `handmade jute laptop bag for women`, `natural jute shopping bag with leather handles`.

### 17.5 Content strategy (the journal)

Topics that rank and genuinely help: how to care for a jute bag in humid weather · how to tell real leather from PU · why jute is a sustainable material · how a leather bag is stitched by hand · what fits in a 38cm tote · choosing between jute and leather · the history of jute in Bangladesh.

Two posts a month, written properly, beats twenty thin ones.

### 17.6 Off-site

- Google Business Profile if there's a physical workshop or pickup point.
- Consistent NAP (name, address, phone) across all listings.
- Local BD directories, handicraft associations, fair-trade directories.
- Pinterest — disproportionately effective for handmade bags and drives real traffic.
- Craft and sustainability blog outreach for backlinks.

---

## 18. Analytics & measurement

### 18.1 Tools

- **GA4** for behavior and ecommerce funnels.
- **Google Search Console** for search performance and indexing issues.
- **Meta Pixel** (only if you'll run Facebook/Instagram ads, which in Bangladesh you probably will) — with the Conversions API server-side for accuracy.
- **A privacy-friendly analytics tool** (Plausible/Umami) as a clean cross-check that isn't blocked by ad-blockers.
- **Microsoft Clarity** — free session recordings and heatmaps. Extremely useful for finding where checkout confuses people.

All analytics load only after consent for non-essential cookies.

### 18.2 Events to track

`view_item_list` · `select_item` · `view_item` · `add_to_wishlist` · `add_to_cart` · `remove_from_cart` · `view_cart` · `begin_checkout` · `add_shipping_info` · `add_payment_info` · `purchase` · `refund` · `search` · `sign_up` · `login` · `newsletter_subscribe` · `contact_form_submit` · `size_guide_open` · `review_submitted`

### 18.3 KPIs worth watching

Conversion rate (overall and by device — mobile will be much lower and that's your biggest optimization opportunity) · average order value · cart abandonment rate · checkout abandonment rate · revenue by channel · repeat purchase rate · return rate · COD refusal rate · email open/click rate · top landing pages · site search terms with no results (a direct list of what to make or rename).

---

## 19. Performance budget

Bangladeshi mobile connections are frequently slow. A beautiful site that takes 8 seconds to load doesn't sell anything.

| Metric | Target |
|---|---|
| Largest Contentful Paint | < 2.0s on 4G |
| Interaction to Next Paint | < 200ms |
| Cumulative Layout Shift | < 0.1 |
| Time to First Byte | < 600ms |
| Total page weight (home) | < 1.2 MB |
| Total page weight (product) | < 1.5 MB |
| JS bundle (initial) | < 180 KB gzipped |
| Lighthouse performance | ≥ 90 mobile |

**Techniques:** AVIF/WebP with fallbacks · responsive `srcset` and `sizes` on every image · explicit width/height everywhere · lazy-load below the fold, eager + preload the hero · self-hosted subset fonts with `font-display: swap` · code-splitting per route · server components for static content · edge caching for category and product pages with on-demand revalidation when stock or price changes · defer all third-party scripts · a CDN with a point of presence near South Asia (Cloudflare covers this).

Test on a real mid-range Android phone on mobile data, not just on your laptop.

---

## 20. Accessibility

Target **WCAG 2.2 Level AA**. This is both a legal consideration for some markets and simply correct.

- All text meets 4.5:1 contrast (3:1 for large text and UI components).
- Every interactive element is keyboard-reachable, in a logical tab order, with a **visible focus indicator**. Never `outline: none` without a replacement.
- Skip-to-content link as the first focusable element.
- Semantic HTML: real `<button>` for actions, real `<a href>` for navigation, proper heading hierarchy, `<nav>`/`<main>`/`<footer>` landmarks.
- Every image has meaningful alt text; decorative images get `alt=""`.
- Form inputs have associated `<label>` elements — placeholder text is not a label. Errors are announced via `aria-live` and linked to their field with `aria-describedby`.
- Modals trap focus, close on Escape, and return focus to the trigger.
- Cart updates and toasts announced via `aria-live="polite"`.
- Touch targets 44×44px minimum.
- `prefers-reduced-motion` respected.
- Page must be usable at 200% zoom and at 320px width.
- Test with a keyboard only, then with a screen reader (NVDA or VoiceOver), then with axe DevTools.

---

## 21. Photography & content production

Your photography will make or break this site more than any code decision.

### 21.1 Shot list per product (minimum 6)

1. Front, straight on, plain background, centered.
2. Back or side profile.
3. Three-quarter angle showing depth.
4. Interior, open, with realistic contents (phone, wallet, notebook).
5. Detail macro — stitching, edge finish, hardware, jute weave texture.
6. Scale/lifestyle — worn or held by a person.
7. *(Optional)* Flat lay with related items.
8. *(Optional)* Maker's hands on the bag.

### 21.2 Practical shooting guidance

- Natural light, near a window, on an overcast day or in shade. Never direct sun, never phone flash.
- One consistent background for all catalog shots — a large sheet of matte white or light grey paper/board.
- Shoot from the same height and distance for every product so the grid looks orderly.
- A modern phone in the highest-quality mode is genuinely sufficient. A tripod costs very little and improves results more than a better camera would.
- Shoot in the largest size available; crop later. Consistent square (1:1) or 4:5 crops for catalog, 16:9 for banners.
- Colour accuracy matters: shoot a white sheet of paper in the same light and use it to set white balance. Returns for "colour looked different online" are avoidable.

### 21.3 Content inventory to produce before launch

- Product photos for every SKU.
- Product descriptions in English and Bangla for every SKU.
- 10–15 photos of your father working, and of the workshop.
- A 30–60 second video of the making process.
- About page copy.
- Process page copy and photos.
- Care guide.
- 20–30 FAQ entries.
- All policy pages.
- 3–5 journal posts.
- Homepage hero images (desktop crop and mobile crop — they need different compositions).

---

## 22. Internationalization & localization

- **Languages:** English (default for international) and Bangla. Route as `/en/...` and `/bn/...`, or use a subdomain. Set `<html lang>` correctly.
- Store translatable content as separate database fields (`name_en`, `name_bn`) rather than an external translation layer — with a small catalog this is simpler and more controllable.
- **Translate real content, don't machine-translate.** Machine-translated Bangla reads badly and undermines the handmade authenticity.
- Number, date, and currency formatting per locale. Bangladeshi number grouping differs (lakh/crore) — decide whether to use it and be consistent.
- The Taka symbol (৳) needs a font that supports it — verify in your chosen typefaces.
- Address forms must adapt by country: "Thana/Upazila" and "District" for BD; "State" and "ZIP" for the US; "County" and "Postcode" for the UK.
- Phone input with country code selector and validation.
- Sizes in centimetres with inches shown alongside for US/UK customers.
- Language switcher in the header; currency switcher separate (a Bangladeshi expat may want English + BDT).

---

## 23. Testing & QA

### 23.1 Automated

- Unit tests for pricing, discount, tax, and shipping calculation — the logic where bugs cost real money.
- Integration tests for the cart, checkout, and order-creation flow.
- End-to-end tests (Playwright) for: browse → add to cart → checkout → order confirmation, on both COD and card paths.
- Webhook handler tests including replay and out-of-order delivery.
- Visual regression on key pages if you want extra safety.
- Lighthouse CI on every pull request with a score threshold.
- Accessibility checks via axe in CI.

### 23.2 Manual test matrix

**Devices:** low-end Android (very important), mid-range Android, iPhone, tablet, laptop, large desktop.
**Browsers:** Chrome, Safari (iOS Safari specifically — it breaks things others don't), Firefox, Edge, and an in-app browser (Facebook/Instagram browser — a lot of your traffic will arrive there and it has real quirks).
**Conditions:** throttled 3G, offline, ad-blocker enabled, cookies blocked, JavaScript-heavy blocking extensions.

### 23.3 Edge cases to deliberately test

- Two customers buy the last item simultaneously.
- Payment succeeds but the browser closes before redirect (webhook must still complete the order).
- Payment webhook arrives twice.
- Coupon applied, then the cart drops below the minimum order value.
- Stock changes between adding to cart and checking out.
- Product deleted while it's in someone's cart.
- Very long product names and addresses.
- Bangla text in every field, including names and addresses.
- Emoji in a review or an order note.
- Prices at boundaries: free-shipping threshold exactly met, ৳0 after a 100% coupon.
- Session expiry mid-checkout.
- Back button after order placement (must not re-submit).
- Refund of a partially-shipped order.

---

## 24. Deployment & infrastructure

- **Domain:** buy `.com` and `.com.bd`. Set the `.com.bd` to redirect, or vice versa.
- **DNS:** Cloudflare, proxied, with DNSSEC on.
- **Email DNS:** SPF, DKIM, DMARC (`p=quarantine` after monitoring), and MX records for your business email.
- **CI/CD:** GitHub Actions — lint, typecheck, test, build on every PR; auto-deploy `main` to production and `develop` to staging.
- **Migrations:** versioned, forward-only, run automatically on deploy, with a rollback plan.
- **Zero-downtime deploys** with health checks.
- **Backups:** automated daily database dumps retained 30 days, plus weekly retained 3 months, stored in a second region. Media assets backed up separately.
- **Monitoring:** uptime checks every minute from multiple regions; Sentry alerts to your phone; a `/health` endpoint checking database and Redis.
- **Logging:** structured JSON logs, retained 30 days, with PII redacted.
- **Status communication:** even a simple pinned social post is better than silence during an outage.

---

## 25. Pre-launch checklist

**Functionality**
- [ ] Every product has: photos, description (both languages), price (both currencies), dimensions, weight, materials, care, stock, SEO fields
- [ ] Test order placed and completed on every payment method, in sandbox and then with one small real transaction
- [ ] Refund tested end to end
- [ ] All emails send, render correctly, and don't land in spam (test with mail-tester.com)
- [ ] SMS notifications tested on a real Bangladeshi number
- [ ] All forms submit and validate correctly
- [ ] Search returns sensible results, including for Bangla queries
- [ ] Filters and sorting work and are reflected in the URL
- [ ] Account flows: register, verify, log in, reset password, update profile
- [ ] Guest checkout works without any account prompt
- [ ] Order tracking works for guests
- [ ] Admin panel tested by your father on his own phone, with him doing a real order start to finish

**Content**
- [ ] No lorem ipsum anywhere
- [ ] No placeholder images
- [ ] Spelling and grammar checked in both languages
- [ ] Contact details correct everywhere
- [ ] All policy pages complete and reviewed
- [ ] 404 and 500 pages designed and helpful

**Technical**
- [ ] HTTPS with a valid certificate and auto-renewal
- [ ] All security headers present (check with securityheaders.com)
- [ ] Lighthouse ≥ 90 on mobile for home, category, and product pages
- [ ] Core Web Vitals passing
- [ ] Sitemap generated and submitted; robots.txt correct
- [ ] Structured data validates with no errors
- [ ] Favicons and OG images in place; test a shared link on Facebook and WhatsApp
- [ ] Analytics firing correctly, purchase event verified with a test order
- [ ] Cookie consent blocks scripts before consent
- [ ] Staging is `noindex` and password-protected
- [ ] Backups running and a restore tested
- [ ] Error monitoring live and alerting
- [ ] Admin 2FA enabled on every account
- [ ] Secrets audited — nothing sensitive in the repo history

**Accessibility**
- [ ] Full keyboard walkthrough of the purchase flow
- [ ] Screen reader pass on home, product, and checkout
- [ ] axe scan with zero critical issues
- [ ] Contrast verified across the palette

**Business**
- [ ] Payment gateway account live and settlement details verified
- [ ] Courier accounts set up, with pickup arranged
- [ ] Packaging materials in stock
- [ ] Stock counts in the system match physical stock exactly
- [ ] Business registration, TIN/BIN as required
- [ ] Business bank account ready to receive settlements
- [ ] Someone is ready to answer the phone and WhatsApp

---

## 26. Post-launch operations

### 26.1 Daily
Process new orders, update statuses, answer messages within 24 hours, check for failed payments, check error alerts.

### 26.2 Weekly
Review analytics, restock and update inventory, moderate reviews, post to social, check for abandoned carts worth following up.

### 26.3 Monthly
Sales report and margin review, update slow-moving product photos or copy, publish a journal post, run dependency updates, review site search terms with no results, check Search Console for crawl errors.

### 26.4 Quarterly
Test a backup restore, review shipping rates against actual costs, audit prices against material costs, security dependency audit, review and refresh the homepage.

### 26.5 Growth levers, roughly in order of expected return

1. **More and better photography** — cheapest, highest-impact improvement available to you.
2. **Collecting reviews** — a simple post-delivery email with a direct link.
3. **Instagram and Facebook** with real workshop content. Process videos of handmade goods perform unusually well.
4. **Pinterest** for international discovery.
5. **Email list** — a small, warm list outperforms paid ads for a brand like this.
6. **SEO content** on care, materials, and buying guides.
7. **Marketplace listings** (Etsy for international, Daraz for local) as additional channels feeding the brand site.
8. **Wholesale outreach** to boutiques and museum shops — one wholesale account can equal months of retail orders.
9. **Paid ads last**, and only once conversion rate and reviews are solid. Ads on a low-trust site burn money.

---

## 27. Build roadmap in phases

**Phase 0 — Foundations (week 1)**
Repo, tooling, design tokens, component library skeleton, database schema, staging environment.

**Phase 1 — Catalog (weeks 2–3)**
Product model, admin product CRUD, image pipeline, homepage, category pages, product detail page, search, filters.

**Phase 2 — Commerce (weeks 4–5)**
Cart, guest checkout, one payment method (COD first — it's the simplest and covers most local orders), order creation, order confirmation email, admin order management.

**Phase 3 — Payments & accounts (weeks 6–7)**
Gateway integration with webhooks, accounts, order history, guest order tracking, wishlist, remaining transactional emails.

**Phase 4 — Trust & content (week 8)**
Reviews, all content pages, all policy pages, FAQ, SEO metadata, structured data, analytics.

**Phase 5 — Polish & launch (weeks 9–10)**
Performance, accessibility, cross-device QA, security review, real payment test, content load, soft launch to friends and family, then public launch.

**Phase 6 — After launch**
International shipping rates, second language if not already done, blog, marketplace channels, wholesale portal.

Ship phase 2 with COD only if you need to launch sooner. A working store selling locally beats a perfect store that isn't live.

---

## 28. Common mistakes to avoid

- **Building the admin panel last.** Your father can't add products without it, and he's the bottleneck on content.
- **Auto-converting currency.** Set USD prices manually.
- **Marking orders paid on the browser redirect** instead of the verified webhook.
- **Forgetting product weight**, then discovering international shipping quotes are all wrong.
- **Requiring account creation** to check out. This alone can cost a large share of orders.
- **Hiding shipping cost until the last step.**
- **Too few product photos.** Six is the floor, not the target.
- **Stock photos or borrowed images.** Instantly detectable, instantly fatal to trust.
- **A carousel hero.** Slow, and people don't click past slide one.
- **Infinite scroll** that makes the footer unreachable.
- **Removing focus outlines** because they look untidy.
- **Machine-translated Bangla.**
- **No phone number.** In Bangladesh especially, this reads as fake.
- **Fake urgency and fake reviews.** Short-term lift, long-term damage.
- **Testing only on your own fast laptop and fast wifi.**
- **No backups**, or backups nobody has ever restored.
- **Secrets committed to git.**
- **Launching with 4 products.** Aim for 20–30 so the catalog looks like a real shop.

---

## Immediate next steps

1. Choose a color palette from section 2.2 and confirm it against the logo you already have.
2. Decide the tech stack (section 12) — this determines everything else.
3. Confirm what international payment acceptance is actually available to you (section 8.2). This is the one thing that could change the plan structurally, so resolve it early.
4. Start photography now. It has the longest lead time and doesn't depend on any code.
5. Write the About page in your father's own words, in Bangla first, then translate it properly.
6. Build phase 0 and 1.

---

*Prepared as a build specification. Legal, tax, and payment-regulation items need review by qualified professionals in Bangladesh before launch.*
