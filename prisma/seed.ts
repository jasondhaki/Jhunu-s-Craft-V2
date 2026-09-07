/**
 * Seed data — plan §12.4 ("seeded with realistic sample data").
 *
 * 24 products, because §28 lists "launching with 4 products" as a mistake:
 * a thin catalogue reads as a fake shop. These are plausible placeholders for
 * developing and demoing against, NOT real inventory.
 *
 * Honest about what it is:
 *  - Every image points at /photo-pending.svg, which is unmistakably a
 *    missing-photo marker. §28 forbids stock or borrowed imagery, so there
 *    are no decorative fake product shots (CONTEXT.md Q6).
 *  - Bangla fields are left null. §22 forbids machine translation, so the
 *    storefront falls back to English until a human writes the Bangla
 *    (CONTEXT.md Q10).
 *  - USD prices are set by hand alongside BDT, never converted (§8.4, §28).
 *  - Every product has a real weight_grams, or international shipping quotes
 *    would be wrong (§9.2, §28).
 *
 * Idempotent: safe to re-run. Uses upserts keyed on slug/sku/code.
 */

import { PrismaClient, Material, BagType, Closure, StrapType, SizeBand, ProductStatus, ImageType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { toMinor } from '../src/lib/money';

const connectionString =
  process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set — see .env.example');
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const PHOTO = '/photo-pending.svg';

// --- Shared care copy (§6.3, §6.9 — a shared care template) ---------------
const CARE = {
  jute: 'Spot-clean with a barely damp cloth and let it dry in the shade — never in direct sun, which fades the fibre. Do not machine wash or soak. In humid weather store it somewhere airy with the flap open; if it is put away damp, jute will grow mould. Stuff it with paper to hold its shape.',
  leather: 'Wipe with a dry cloth after use. Condition with a neutral leather cream two or three times a year, more often in dry months. Keep it away from direct heat and never dry it with a hairdryer. If it gets soaked, blot it and let it dry slowly at room temperature. Store it in the cotton dust bag, not in plastic.',
  mixed: 'Treat the two materials separately. Spot-clean the jute with a barely damp cloth and dry it in the shade; wipe the leather dry and condition it two or three times a year. Never soak the bag. In humid weather store it somewhere airy — jute put away damp will grow mould.',
} as const;

const MATERIALS = {
  jute: 'Natural jute fibre, woven and hand-stitched. Cotton twill lining, antique brass hardware, waxed cotton thread.',
  leather: 'Full-grain buffalo leather, 1.4 mm, vegetable tanned. Cotton twill lining, antique brass hardware, waxed polyester thread.',
  mixed: 'Natural jute body with full-grain buffalo leather straps and trim, 1.4 mm. Cotton twill lining, antique brass hardware.',
} as const;

// §6.3.12 — the natural-variation paragraph. §1.1: stating this prevents a
// meaningful share of returns.
const VARIATION_NOTE =
  'Every bag is cut and stitched by hand, so no two are identical. Expect small differences in weave, grain, and tone between one bag and the next — and between the bag you receive and the photographs. That is the nature of handmade work, not a fault.';

interface VariantSpec {
  color: string;
  colorCode: string; // 3 letters for the SKU (§4.7)
  hex: string;
  stock: number;
}

interface ProductSpec {
  slug: string;
  name: string;
  short: string;
  description: string;
  material: Material;
  bagType: BagType;
  typeCode: string; // 3 letters for the SKU (§4.7)
  closure: Closure;
  strap: StrapType;
  sizeBand: SizeBand;
  bdt: number; // major units — converted to poisha below
  usd: number; // major units — SET BY HAND, never converted (§8.4)
  compareAtBdt?: number;
  costBdt: number;
  dims: [number, number, number]; // l, w, h in cm
  strapDrop?: number;
  weight: number; // grams — REQUIRED (§9.2)
  capacity: string;
  variants: VariantSpec[];
  featured?: boolean;
  madeToOrder?: boolean;
  productionDays?: number;
}

const NAT = { color: 'Natural', colorCode: 'NAT', hex: '#C6A971' };
const OLV = { color: 'Olive', colorCode: 'OLV', hex: '#6B7A4F' };
const CHE = { color: 'Chestnut', colorCode: 'CHE', hex: '#6B3F23' };
const TAN = { color: 'Tan', colorCode: 'TAN', hex: '#A8763E' };
const BLK = { color: 'Black', colorCode: 'BLK', hex: '#2B2724' };
const OXB = { color: 'Oxblood', colorCode: 'OXB', hex: '#6E2B26' };

const products: ProductSpec[] = [
  // ---------------------------------------------------------------- JUTE
  {
    slug: 'natural-jute-shopping-bag',
    name: 'Natural Jute Shopping Bag',
    short: 'A sturdy everyday shopping bag that folds flat when you are done with it.',
    description:
      'The bag most people buy first. Woven jute with reinforced seams at the base and handles set wide enough to sit on your shoulder with a full load. It holds a week of vegetables without complaining, and folds flat into a drawer when it is not in use.',
    material: Material.JUTE, bagType: BagType.SHOPPING_BAG, typeCode: 'SHP',
    closure: Closure.OPEN, strap: StrapType.HANDLE, sizeBand: SizeBand.LARGE,
    bdt: 850, usd: 18, costBdt: 420,
    dims: [40, 35, 15], strapDrop: 24, weight: 320,
    capacity: 'Fits a week of groceries, A4 documents, or a folded blanket.',
    variants: [{ ...NAT, stock: 24 }, { ...OLV, stock: 11 }],
    featured: true,
  },
  {
    slug: 'natural-jute-tote',
    name: 'Natural Jute Tote',
    short: 'An open-top tote for the daily carry — book, laptop sleeve, lunch, umbrella.',
    description:
      'Roomier than it looks. The body is a single piece of woven jute with a leather-reinforced base seam, and the handles are stitched through rather than riveted, which is slower to make and far less likely to fail.',
    material: Material.JUTE, bagType: BagType.TOTE, typeCode: 'TOT',
    closure: Closure.OPEN, strap: StrapType.HANDLE, sizeBand: SizeBand.LARGE,
    bdt: 1250, usd: 26, costBdt: 610,
    dims: [38, 36, 12], strapDrop: 26, weight: 380,
    capacity: 'Fits a 13-inch laptop, A4 documents, and a water bottle.',
    variants: [{ ...NAT, stock: 15 }, { ...OLV, stock: 6 }],
    featured: true,
  },
  {
    slug: 'olive-jute-side-bag',
    name: 'Olive Jute Side Bag',
    short: 'A single-strap shoulder bag, small enough to keep out of your way.',
    description:
      'Cut close so it sits flat against you rather than swinging. The strap is fixed rather than adjustable, set at a length that works on the shoulder for most adults, and the flap closes over a magnetic catch.',
    material: Material.JUTE, bagType: BagType.SIDE_BAG, typeCode: 'SID',
    closure: Closure.MAGNETIC, strap: StrapType.SHOULDER, sizeBand: SizeBand.MEDIUM,
    bdt: 1100, usd: 24, costBdt: 540,
    dims: [28, 22, 8], strapDrop: 30, weight: 290,
    capacity: 'Fits a large phone, a slim wallet, keys, and a paperback.',
    variants: [{ ...OLV, stock: 9 }, { ...NAT, stock: 12 }],
  },
  {
    slug: 'jute-laptop-bag',
    name: 'Natural Jute Laptop Bag',
    short: 'A padded jute bag for a 15-inch laptop, with a detachable shoulder strap.',
    description:
      'Built around a padded sleeve rather than having padding added as an afterthought. The main compartment takes a 15-inch machine with its charger; the front pocket takes everything you would otherwise lose in the bottom of the bag.',
    material: Material.JUTE, bagType: BagType.LAPTOP_BAG, typeCode: 'LAP',
    closure: Closure.ZIP, strap: StrapType.DETACHABLE, sizeBand: SizeBand.LARGE,
    bdt: 1950, usd: 38, costBdt: 980,
    dims: [40, 30, 8], strapDrop: 55, weight: 520,
    capacity: 'Fits a 15-inch laptop with charger, A4 documents, and a notebook.',
    variants: [{ ...NAT, stock: 7 }],
    featured: true,
  },
  {
    slug: 'jute-market-basket-bag',
    name: 'Jute Market Basket Bag',
    short: 'A stiff-sided basket bag that stands up on its own at the market.',
    description:
      'The sides are woven tightly enough to hold their shape when the bag is set down, which matters more than it sounds when you are packing it one-handed. Leather-bound rim, and a base stiff enough to carry weight without sagging.',
    material: Material.JUTE, bagType: BagType.SHOPPING_BAG, typeCode: 'SHP',
    closure: Closure.OPEN, strap: StrapType.HANDLE, sizeBand: SizeBand.LARGE,
    bdt: 990, usd: 21, costBdt: 490,
    dims: [36, 30, 18], strapDrop: 20, weight: 410,
    capacity: 'Fits a market run — vegetables, fruit, and a couple of jars.',
    variants: [{ ...NAT, stock: 18 }],
  },
  {
    slug: 'jute-handbag-wooden-handle',
    name: 'Natural Jute Handbag with Wooden Handles',
    short: 'A structured handbag with turned wooden handles, made to order.',
    description:
      'The handles are turned from local hardwood and fitted by hand, which is why this one is made to order rather than kept in stock. The body is stiffened jute with a full cotton lining and an interior slip pocket.',
    material: Material.JUTE, bagType: BagType.HANDBAG, typeCode: 'HND',
    closure: Closure.MAGNETIC, strap: StrapType.HANDLE, sizeBand: SizeBand.MEDIUM,
    bdt: 1650, usd: 34, costBdt: 820,
    dims: [30, 24, 12], strapDrop: 14, weight: 440,
    capacity: 'Fits a phone, purse, sunglasses case, and a small notebook.',
    variants: [{ ...NAT, stock: 0 }],
    madeToOrder: true, productionDays: 10,
  },
  {
    slug: 'jute-crossbody-pouch',
    name: 'Natural Jute Crossbody Pouch',
    short: 'A small zipped pouch on a long adjustable strap.',
    description:
      'For the days you want your hands free and do not want to think about a bag. Zip closure, one interior card slot, and a strap that adjusts long enough to wear across the body over a coat.',
    material: Material.JUTE, bagType: BagType.CROSSBODY, typeCode: 'CRS',
    closure: Closure.ZIP, strap: StrapType.CROSSBODY, sizeBand: SizeBand.SMALL,
    bdt: 780, usd: 17, costBdt: 380,
    dims: [24, 18, 7], strapDrop: 58, weight: 210,
    capacity: 'Fits a phone, cards, keys, and a small bottle of water.',
    variants: [{ ...NAT, stock: 21 }, { ...OLV, stock: 14 }],
  },
  {
    slug: 'jute-beach-tote',
    name: 'Jute Beach Tote',
    short: 'An oversized open tote with a wipe-clean lining.',
    description:
      'Larger than the everyday tote and lined with a coated cotton that sand and damp towels do not ruin. The lining wipes out; the jute body should be dried in the shade.',
    material: Material.JUTE, bagType: BagType.TOTE, typeCode: 'TOT',
    closure: Closure.OPEN, strap: StrapType.HANDLE, sizeBand: SizeBand.LARGE,
    bdt: 1350, usd: 28, costBdt: 670,
    dims: [42, 38, 16], strapDrop: 28, weight: 460,
    capacity: 'Fits two towels, a book, sun cream, and a change of clothes.',
    variants: [{ ...NAT, stock: 13 }],
  },
  {
    slug: 'jute-clutch',
    name: 'Natural Jute Clutch',
    short: 'A flat evening clutch with a hidden wrist strap.',
    description:
      'The smallest thing in the workshop and one of the fiddliest to make — the edges are folded and stitched rather than bound, which takes longer but keeps the profile flat. The wrist strap tucks inside when you do not want it.',
    material: Material.JUTE, bagType: BagType.CLUTCH, typeCode: 'CLU',
    closure: Closure.ZIP, strap: StrapType.DETACHABLE, sizeBand: SizeBand.SMALL,
    bdt: 650, usd: 14, costBdt: 310,
    dims: [22, 13, 4], weight: 140,
    capacity: 'Fits a phone, cards, a lipstick, and folded notes.',
    variants: [{ ...NAT, stock: 16 }, { ...OLV, stock: 8 }],
  },

  // ------------------------------------------------------------- LEATHER
  {
    slug: 'chestnut-leather-crossbody',
    name: 'Chestnut Leather Crossbody',
    short: 'A compact crossbody in full-grain buffalo leather that darkens as you use it.',
    description:
      'Vegetable-tanned buffalo hide, 1.4 mm, cut in one piece across the front and flap so the grain runs continuously. It arrives fairly light and will darken over the first year into something noticeably richer. The strap adjusts through solid brass hardware.',
    material: Material.LEATHER, bagType: BagType.CROSSBODY, typeCode: 'CRS',
    closure: Closure.MAGNETIC, strap: StrapType.CROSSBODY, sizeBand: SizeBand.SMALL,
    bdt: 4800, usd: 62, costBdt: 2400,
    dims: [24, 18, 7], strapDrop: 60, weight: 480,
    capacity: 'Fits a large phone, a passport, a slim wallet, and keys.',
    variants: [{ ...CHE, stock: 5 }, { ...TAN, stock: 3 }],
    featured: true,
  },
  {
    slug: 'black-leather-handbag',
    name: 'Black Leather Handbag',
    short: 'A structured top-handle handbag with a full cotton lining.',
    description:
      'The most structured piece in the range. The body panels are skived at the edges before stitching so the corners sit square rather than bulging, which is the part that takes the longest. Two interior slip pockets and one zipped.',
    material: Material.LEATHER, bagType: BagType.HANDBAG, typeCode: 'HND',
    closure: Closure.ZIP, strap: StrapType.HANDLE, sizeBand: SizeBand.MEDIUM,
    bdt: 6500, usd: 85, costBdt: 3300,
    dims: [30, 24, 12], strapDrop: 15, weight: 820,
    capacity: 'Fits an A5 diary, a purse, sunglasses, and a small umbrella.',
    variants: [{ ...BLK, stock: 4 }, { ...CHE, stock: 2 }],
    featured: true,
  },
  {
    slug: 'tan-leather-side-bag',
    name: 'Tan Leather Side Bag',
    short: 'A softer, unstructured shoulder bag that settles into shape with use.',
    description:
      'Deliberately unlined through the body so the leather can soften and slouch. If you want a bag that looks the same in five years, this is not it; if you want one that looks like yours, it is.',
    material: Material.LEATHER, bagType: BagType.SIDE_BAG, typeCode: 'SID',
    closure: Closure.MAGNETIC, strap: StrapType.SHOULDER, sizeBand: SizeBand.MEDIUM,
    bdt: 4200, usd: 55, costBdt: 2100,
    dims: [28, 22, 8], strapDrop: 32, weight: 610,
    capacity: 'Fits a tablet, a paperback, a wallet, and a phone.',
    variants: [{ ...TAN, stock: 6 }, { ...CHE, stock: 4 }],
  },
  {
    slug: 'leather-office-bag',
    name: 'Leather Office Bag',
    short: 'A padded 15-inch laptop bag built for daily commuting.',
    description:
      'The heaviest-duty thing in the workshop. Double-stitched at every stress point, with a padded laptop compartment, a separate document section, and a strap pad that is stitched rather than slid on. Made to order.',
    material: Material.LEATHER, bagType: BagType.LAPTOP_BAG, typeCode: 'LAP',
    closure: Closure.ZIP, strap: StrapType.DETACHABLE, sizeBand: SizeBand.LARGE,
    bdt: 7800, usd: 98, costBdt: 4100,
    dims: [40, 30, 10], strapDrop: 56, weight: 1250,
    capacity: 'Fits a 15-inch laptop, charger, A4 folder, and a notebook.',
    variants: [{ ...CHE, stock: 0 }, { ...BLK, stock: 0 }],
    madeToOrder: true, productionDays: 12,
  },
  {
    slug: 'chestnut-leather-tote',
    name: 'Chestnut Leather Tote',
    short: 'A large open tote in full-grain leather, unlined and made to soften.',
    description:
      'Big enough for a working day and simple enough to last. No zip, no fittings, no lining — just two large panels, a stitched base, and handles thick enough not to dig in when the bag is full.',
    material: Material.LEATHER, bagType: BagType.TOTE, typeCode: 'TOT',
    closure: Closure.OPEN, strap: StrapType.HANDLE, sizeBand: SizeBand.LARGE,
    bdt: 6900, usd: 88, costBdt: 3500,
    dims: [38, 34, 13], strapDrop: 25, weight: 980,
    capacity: 'Fits a 14-inch laptop, A4 documents, a lunch box, and a scarf.',
    variants: [{ ...CHE, stock: 3 }, { ...TAN, stock: 2 }],
  },
  {
    slug: 'leather-clutch',
    name: 'Leather Clutch',
    short: 'A flat zipped clutch cut from a single piece of hide.',
    description:
      'One panel, folded and stitched up the sides, with the grain running unbroken around the fold. Simple to describe and unforgiving to make — any wobble in the stitch line shows.',
    material: Material.LEATHER, bagType: BagType.CLUTCH, typeCode: 'CLU',
    closure: Closure.ZIP, strap: StrapType.DETACHABLE, sizeBand: SizeBand.SMALL,
    bdt: 2400, usd: 32, costBdt: 1150,
    dims: [24, 14, 3], weight: 260,
    capacity: 'Fits a phone, cards, keys, and a passport.',
    variants: [{ ...BLK, stock: 9 }, { ...OXB, stock: 5 }],
  },
  {
    slug: 'black-leather-backpack',
    name: 'Black Leather Backpack',
    short: 'A flap-over backpack with adjustable stitched straps.',
    description:
      'The most involved piece he makes — the curved back panel and the strap anchors have to be right or the whole thing hangs wrong. Fits a 14-inch laptop in a padded sleeve. Made to order only.',
    material: Material.LEATHER, bagType: BagType.BACKPACK, typeCode: 'BPK',
    closure: Closure.MAGNETIC, strap: StrapType.SHOULDER, sizeBand: SizeBand.LARGE,
    bdt: 8200, usd: 105, costBdt: 4400,
    dims: [40, 28, 14], strapDrop: 0, weight: 1380,
    capacity: 'Fits a 14-inch laptop, a change of clothes, and a water bottle.',
    variants: [{ ...BLK, stock: 0 }, { ...CHE, stock: 0 }],
    madeToOrder: true, productionDays: 14,
  },
  {
    slug: 'tan-leather-mini-crossbody',
    name: 'Tan Leather Mini Crossbody',
    short: 'The smallest leather bag he makes, on a long thin strap.',
    description:
      'Sized for a phone and not much else, on purpose. The strap is a single narrow cut of hide rather than a folded and stitched one, which keeps it light and means it will take on the shape of how you wear it.',
    material: Material.LEATHER, bagType: BagType.CROSSBODY, typeCode: 'CRS',
    closure: Closure.ZIP, strap: StrapType.CROSSBODY, sizeBand: SizeBand.SMALL,
    bdt: 3600, usd: 48, costBdt: 1800,
    dims: [19, 13, 5], strapDrop: 62, weight: 310,
    capacity: 'Fits a large phone, cards, and keys.',
    variants: [{ ...TAN, stock: 8 }, { ...BLK, stock: 6 }],
  },
  {
    slug: 'oxblood-leather-handbag',
    name: 'Oxblood Leather Handbag',
    short: 'A softer top-handle bag in a deep oxblood finish.',
    description:
      'The oxblood is a drum-dyed hide rather than a surface finish, so a scuff shows the same colour underneath rather than a pale scar. Lightly structured, with a magnetic flap and one interior zip pocket.',
    material: Material.LEATHER, bagType: BagType.HANDBAG, typeCode: 'HND',
    closure: Closure.MAGNETIC, strap: StrapType.HANDLE, sizeBand: SizeBand.MEDIUM,
    bdt: 6200, usd: 80, compareAtBdt: 7200, costBdt: 3200,
    dims: [29, 23, 11], strapDrop: 16, weight: 760,
    capacity: 'Fits an A5 diary, a purse, a phone, and sunglasses.',
    variants: [{ ...OXB, stock: 3 }],
  },

  // --------------------------------------------------------------- MIXED
  {
    slug: 'jute-leather-tote',
    name: 'Jute and Leather Tote',
    short: 'A jute body with full-grain leather handles and base trim.',
    description:
      'The combination that suits both materials best: jute where you want lightness and leather where the bag takes the strain. The handles and base corners are leather, stitched through the jute rather than glued.',
    material: Material.MIXED, bagType: BagType.TOTE, typeCode: 'TOT',
    closure: Closure.OPEN, strap: StrapType.HANDLE, sizeBand: SizeBand.LARGE,
    bdt: 3200, usd: 42, costBdt: 1600,
    dims: [38, 35, 13], strapDrop: 26, weight: 640,
    capacity: 'Fits a 14-inch laptop, A4 documents, and a water bottle.',
    variants: [{ ...NAT, stock: 10 }, { ...CHE, stock: 5 }],
    featured: true,
  },
  {
    slug: 'jute-leather-crossbody',
    name: 'Jute and Leather Crossbody',
    short: 'A jute body on a full leather adjustable strap.',
    description:
      'Light on the shoulder because the body is jute, but the strap and flap are leather, which is where a bag this size normally wears out first.',
    material: Material.MIXED, bagType: BagType.CROSSBODY, typeCode: 'CRS',
    closure: Closure.MAGNETIC, strap: StrapType.CROSSBODY, sizeBand: SizeBand.SMALL,
    bdt: 2900, usd: 38, costBdt: 1400,
    dims: [24, 18, 7], strapDrop: 60, weight: 390,
    capacity: 'Fits a large phone, a wallet, a passport, and keys.',
    variants: [{ ...NAT, stock: 12 }, { ...TAN, stock: 7 }],
  },
  {
    slug: 'jute-leather-laptop-bag',
    name: 'Jute and Leather Laptop Bag',
    short: 'A padded 15-inch laptop bag with a jute body and leather corners.',
    description:
      'Lighter than the all-leather office bag and considerably cheaper, with the leather concentrated where it earns its place: the corners, the strap, and the flap edge.',
    material: Material.MIXED, bagType: BagType.LAPTOP_BAG, typeCode: 'LAP',
    closure: Closure.ZIP, strap: StrapType.DETACHABLE, sizeBand: SizeBand.LARGE,
    bdt: 4500, usd: 58, costBdt: 2300,
    dims: [40, 30, 9], strapDrop: 56, weight: 780,
    capacity: 'Fits a 15-inch laptop, charger, and A4 documents.',
    variants: [{ ...NAT, stock: 6 }],
  },
  {
    slug: 'jute-leather-handbag',
    name: 'Jute and Leather Handbag',
    short: 'A structured handbag with a jute body and leather handles.',
    description:
      'Stiffened jute panels bound in leather at every edge, with stitched-through handles. The binding is the slow part — it is done by hand around every corner.',
    material: Material.MIXED, bagType: BagType.HANDBAG, typeCode: 'HND',
    closure: Closure.MAGNETIC, strap: StrapType.HANDLE, sizeBand: SizeBand.MEDIUM,
    bdt: 3800, usd: 50, costBdt: 1900,
    dims: [30, 24, 12], strapDrop: 15, weight: 590,
    capacity: 'Fits an A5 diary, a purse, a phone, and sunglasses.',
    variants: [{ ...NAT, stock: 8 }, { ...OLV, stock: 4 }],
  },
  {
    slug: 'jute-leather-weekender',
    name: 'Jute and Leather Weekender',
    short: 'A large overnight bag with leather base, handles, and strap.',
    description:
      'The biggest bag in the range. Leather across the whole base rather than just the corners, because a bag this size gets put down on floors. Made to order.',
    material: Material.MIXED, bagType: BagType.TOTE, typeCode: 'TOT',
    closure: Closure.ZIP, strap: StrapType.DETACHABLE, sizeBand: SizeBand.LARGE,
    bdt: 5400, usd: 70, costBdt: 2800,
    dims: [50, 30, 24], strapDrop: 54, weight: 1150,
    capacity: 'Fits two or three days of clothes, a wash bag, and shoes.',
    variants: [{ ...NAT, stock: 0 }],
    madeToOrder: true, productionDays: 12,
  },
  {
    slug: 'jute-leather-satchel',
    name: 'Jute and Leather Satchel',
    short: 'A flap-over satchel with leather straps and buckles.',
    description:
      'Two brass buckles on leather straps over a jute body. The buckles are functional rather than decorative, which means the flap actually holds shut when the bag is full.',
    material: Material.MIXED, bagType: BagType.SIDE_BAG, typeCode: 'SID',
    closure: Closure.MAGNETIC, strap: StrapType.SHOULDER, sizeBand: SizeBand.MEDIUM,
    bdt: 3400, usd: 45, costBdt: 1700,
    dims: [32, 25, 10], strapDrop: 34, weight: 620,
    capacity: 'Fits a 13-inch laptop, a notebook, and a wallet.',
    variants: [{ ...NAT, stock: 9 }, { ...CHE, stock: 3 }],
  },
];

// §21.1 — the six-shot minimum. Alt text is written per shot, never generic
// ("bag") — it is both an accessibility requirement and an SEO one
// (§5.3, §17.3, §20).
function imagesFor(name: string) {
  return [
    { type: ImageType.PRODUCT, alt: `${name}, photographed front on against a plain background` },
    { type: ImageType.PRODUCT, alt: `${name}, side profile showing the depth of the bag` },
    { type: ImageType.PRODUCT, alt: `${name}, three-quarter angle` },
    { type: ImageType.DETAIL, alt: `Interior of the ${name}, open, showing the lining and pockets` },
    { type: ImageType.DETAIL, alt: `Close detail of the stitching and hardware on the ${name}` },
    { type: ImageType.SCALE, alt: `${name} worn on the shoulder, showing its size against a person` },
  ];
}

async function main() {
  console.log('Seeding — this is sample data, not real inventory.\n');

  // --- Shipping zones and rates (§9.1, §9.2) ------------------------------
  // Flat rate per zone domestically: simplest to communicate and easiest for
  // the owner to reason about (§9.1). International is weight-banded (§9.2).
  const zones = [
    {
      code: 'BD_DHAKA', name: 'Inside Dhaka', countries: ['BD'], regions: ['Dhaka'],
      rates: [{ name: 'Standard courier', bdt: 60, usd: 2, min: 1, max: 2, free: 3000 }],
    },
    {
      code: 'BD_SUBURB', name: 'Dhaka suburbs', countries: ['BD'], regions: ['Gazipur', 'Narayanganj', 'Savar'],
      rates: [{ name: 'Standard courier', bdt: 90, usd: 3, min: 1, max: 3, free: 3000 }],
    },
    {
      code: 'BD_OUTSIDE', name: 'Outside Dhaka', countries: ['BD'], regions: [],
      rates: [{ name: 'Standard courier', bdt: 130, usd: 4, min: 2, max: 5, free: 5000 }],
    },
    {
      code: 'INTL_SOUTH_ASIA', name: 'South Asia', countries: ['IN', 'NP', 'LK', 'PK', 'BT', 'MV'], regions: [],
      rates: [{ name: 'DHL Express', bdt: 2200, usd: 28, min: 5, max: 10, free: null }],
    },
    {
      code: 'INTL_EUROPE', name: 'Europe', countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'IE'], regions: [],
      rates: [{ name: 'DHL Express', bdt: 3800, usd: 48, min: 7, max: 14, free: null }],
    },
    {
      code: 'INTL_NORTH_AMERICA', name: 'North America', countries: ['US', 'CA'], regions: [],
      rates: [{ name: 'DHL Express', bdt: 4200, usd: 52, min: 7, max: 14, free: null }],
    },
    {
      code: 'INTL_REST', name: 'Rest of world', countries: [], regions: [],
      rates: [{ name: 'DHL Express', bdt: 4800, usd: 60, min: 10, max: 21, free: null }],
    },
  ];

  for (const [i, z] of zones.entries()) {
    const zone = await db.shippingZone.upsert({
      where: { code: z.code },
      update: { nameEn: z.name, countries: z.countries, regions: z.regions, position: i },
      create: { code: z.code, nameEn: z.name, countries: z.countries, regions: z.regions, position: i },
    });
    await db.shippingRate.deleteMany({ where: { zoneId: zone.id } });
    for (const r of z.rates) {
      await db.shippingRate.create({
        data: {
          zoneId: zone.id, nameEn: r.name,
          priceBdt: toMinor(r.bdt, 'BDT'), priceUsd: toMinor(r.usd, 'USD'),
          freeAboveBdt: r.free ? toMinor(r.free, 'BDT') : null,
          minDays: r.min, maxDays: r.max,
          codFeeBdt: z.code.startsWith('BD_') ? toMinor(20, 'BDT') : null,
        },
      });
    }
  }
  console.log(`  ${zones.length} shipping zones`);

  // --- Collections (§4.5) -------------------------------------------------
  const collections = [
    { slug: 'everyday-carry', title: 'Everyday carry', intro: 'The bags people reach for without thinking about it — sized for a phone, a wallet, a book, and a bottle of water, and built to survive being used every single day.' },
    { slug: 'under-2000-taka', title: 'Under ৳2,000', intro: 'Handmade does not have to be expensive. These are the bags that come in under two thousand taka, mostly jute, all made by the same pair of hands as everything else here.' },
    { slug: 'the-jute-edit', title: 'The jute edit', intro: 'Jute is called the golden fibre, and Bangladesh grows most of the world supply. Every bag in this collection is woven from it — light, strong, and completely biodegradable.' },
    { slug: 'made-to-order', title: 'Made to order', intro: 'Pieces that are built when you order them rather than kept on a shelf. They take a little longer and they are worth the wait.' },
  ];
  for (const [i, c] of collections.entries()) {
    await db.collection.upsert({
      where: { slug: c.slug },
      update: { titleEn: c.title, introEn: c.intro, position: i },
      create: { slug: c.slug, titleEn: c.title, introEn: c.intro, position: i },
    });
  }
  console.log(`  ${collections.length} collections`);

  // --- Tags ---------------------------------------------------------------
  const tags = [
    { slug: 'handmade', label: 'Handmade' },
    { slug: 'eco-friendly', label: 'Eco-friendly' },
    { slug: 'gift', label: 'Gift' },
    { slug: 'laptop-friendly', label: 'Laptop friendly' },
    { slug: 'one-of-a-kind', label: 'One of a kind' },
  ];
  for (const tag of tags) {
    await db.tag.upsert({
      where: { slug: tag.slug },
      update: { labelEn: tag.label },
      create: { slug: tag.slug, labelEn: tag.label },
    });
  }
  console.log(`  ${tags.length} tags`);

  // --- Products -----------------------------------------------------------
  const materialKey = (m: Material) =>
    m === Material.JUTE ? 'jute' : m === Material.LEATHER ? 'leather' : 'mixed';
  const matCode = (m: Material) =>
    m === Material.JUTE ? 'JUT' : m === Material.LEATHER ? 'LEA' : 'MIX';

  let seq = 0;
  for (const spec of products) {
    seq += 1;
    const key = materialKey(spec.material);

    const product = await db.product.upsert({
      where: { slug: spec.slug },
      update: {},
      create: {
        slug: spec.slug,
        nameEn: spec.name,
        shortDescriptionEn: spec.short,
        descriptionEn: `${spec.description}\n\n${VARIATION_NOTE}`,
        material: spec.material,
        bagType: spec.bagType,
        closure: spec.closure,
        strap: spec.strap,
        sizeBand: spec.sizeBand,
        basePriceBdt: toMinor(spec.bdt, 'BDT'),
        basePriceUsd: toMinor(spec.usd, 'USD'),
        compareAtPriceBdt: spec.compareAtBdt ? toMinor(spec.compareAtBdt, 'BDT') : null,
        costPriceBdt: toMinor(spec.costBdt, 'BDT'),
        lengthCm: spec.dims[0], widthCm: spec.dims[1], heightCm: spec.dims[2],
        strapDropCm: spec.strapDrop ?? null,
        weightGrams: spec.weight,
        capacityNoteEn: spec.capacity,
        materialsDetailEn: MATERIALS[key],
        careInstructionsEn: CARE[key],
        madeToOrder: spec.madeToOrder ?? false,
        productionDays: spec.productionDays ?? null,
        status: ProductStatus.ACTIVE,
        featured: spec.featured ?? false,
        publishedAt: new Date(),
        // §17.3 — under 60 chars, and a 140–160 char description
        metaTitle: `${spec.name} | Jhunu's Crafts`.slice(0, 60),
        metaDescription: spec.short.slice(0, 158),
      },
    });

    for (const [vi, v] of spec.variants.entries()) {
      const sku = `${matCode(spec.material)}-${spec.typeCode}-${v.colorCode}-${String(seq * 10 + vi).padStart(3, '0')}`;
      await db.variant.upsert({
        where: { sku },
        update: { stockQuantity: v.stock },
        create: {
          productId: product.id, sku,
          colorNameEn: v.color, colorHex: v.hex,
          stockQuantity: v.stock,
        },
      });
    }

    const existingImages = await db.productImage.count({ where: { productId: product.id } });
    if (existingImages === 0) {
      await db.productImage.createMany({
        data: imagesFor(spec.name).map((img, position) => ({
          productId: product.id,
          url: PHOTO, width: 800, height: 800,
          altTextEn: img.alt, type: img.type, position,
        })),
      });
    }

    // Collection membership (§4.5 — merchandising, cross-cutting taxonomy)
    const assign: string[] = [];
    // MIXED pieces have a jute body, so they belong in the jute edit too.
    if (spec.material !== Material.LEATHER) assign.push('the-jute-edit');
    if (spec.bdt < 2000) assign.push('under-2000-taka');
    if (spec.sizeBand !== SizeBand.LARGE) assign.push('everyday-carry');
    if (spec.madeToOrder) assign.push('made-to-order');

    for (const slug of assign) {
      const collection = await db.collection.findUnique({ where: { slug } });
      if (!collection) continue;
      await db.collectionProduct.upsert({
        where: { collectionId_productId: { collectionId: collection.id, productId: product.id } },
        update: {},
        create: { collectionId: collection.id, productId: product.id },
      });
    }
  }

  const counts = {
    products: await db.product.count(),
    variants: await db.variant.count(),
    images: await db.productImage.count(),
    inStock: await db.variant.count({ where: { stockQuantity: { gt: 0 } } }),
  };
  console.log(`  ${counts.products} products, ${counts.variants} variants, ${counts.images} images`);
  console.log(`  ${counts.inStock} variants in stock\n`);
  console.log('Done. Remember: placeholder photography and English-only copy.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
