/**
 * REAL catalogue — the products this workshop actually makes.
 *
 *   npm run db:seed:real
 *
 * Replaces the invented sample catalogue (prisma/seed.ts) with the products
 * visible in the owner's own photographs. See CONTEXT.md D9 for why that
 * replacement was necessary.
 *
 * ⚠ PRICES NEED CONFIRMING — read this before publishing anything.
 *
 * The canvas backpacks carry handwritten price tags in the photographs and I
 * have transcribed them as best I can from Bengali numerals. They are marked
 * ACTIVE, but the figures should be checked.
 *
 * The jute side bag and the jute-and-leather office bag have NO price in the
 * photographs. Rather than invent a number and put it in front of a customer,
 * those ship as DRAFT — invisible on the storefront until the owner sets a
 * real price in the admin panel and publishes them. §14.5 and plain honesty:
 * a made-up price is not a placeholder, it is a quote.
 *
 * Dimensions and weights are likewise estimates from the photographs and are
 * flagged in each product's admin note. §9.2 warns that a wrong weight means
 * wrong international shipping, so these want a tape measure and scales.
 */

import 'dotenv/config';
import { PrismaClient, Material, BagType, Closure, StrapType, SizeBand, ProductStatus, ImageType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { toMinor } from '../src/lib/money';

const connectionString =
  process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const VARIATION_NOTE =
  'Made in our own workshop from natural materials, so expect small differences in weave, colour, and finish between one bag and the next. That is the nature of the material, not a fault.';

const CARE = {
  jute: 'Spot-clean with a barely damp cloth and dry in the shade, never in direct sun. Do not machine wash or soak. In humid weather store it somewhere airy — jute put away damp will grow mould.',
  cotton: 'Spot-clean with a damp cloth and mild soap. Dry in the shade. Do not bleach. The canvas will soften with use and may fade slightly over years of sunlight, which is normal for a dyed natural fibre.',
  mixed: 'Treat the two materials separately: spot-clean the jute with a barely damp cloth and dry it in the shade, and wipe the leather dry and condition it two or three times a year. Never soak the bag.',
} as const;

const MATERIALS = {
  jute: 'Woven jute with cotton webbing strap and a wooden toggle fastening. Cotton lining.',
  cotton: 'Heavy cotton canvas with padded back and shoulder straps, nylon zips, and a cotton lining.',
  mixed: 'Woven jute body with leather trim, corners, and handles. Cotton lining, metal fittings.',
} as const;

interface Img {
  file: string;
  alt: string;
  type: ImageType;
}

interface Spec {
  slug: string;
  name: string;
  short: string;
  description: string;
  material: Material;
  bagType: BagType;
  typeCode: string;
  closure: Closure;
  strap: StrapType;
  sizeBand: SizeBand;
  /** Major units. See the price warning at the top of this file. */
  bdt: number | null;
  usd: number | null;
  /** Source of the price, recorded so nobody assumes it was verified. */
  priceSource: string;
  dims: [number, number, number];
  strapDrop?: number;
  weight: number;
  capacity: string;
  colours: { name: string; code: string; hex: string; stock: number }[];
  images: Img[];
  status: ProductStatus;
  featured?: boolean;
  adminNote: string;
}

const products: Spec[] = [
  // ------------------------------------------------------------------ MIXED
  {
    slug: 'jute-leather-office-bag',
    name: 'Jute and Leather Office Bag',
    short:
      'A structured jute briefcase with leather trim, handle, and shoulder strap.',
    description:
      'The most finished thing the workshop makes. A stiffened jute body bound in leather at every edge, with a leather handle, leather corner protection, and a detachable padded shoulder strap. Sized for a laptop and A4 documents, with the flap closing over a leather strap and stud.\n\nThe leather is stitched through the jute rather than glued, which is why the handles and the flap do not pull away from the body over time.',
    material: Material.MIXED,
    bagType: BagType.LAPTOP_BAG,
    typeCode: 'LAP',
    closure: Closure.MAGNETIC,
    strap: StrapType.DETACHABLE,
    sizeBand: SizeBand.LARGE,
    bdt: null,
    usd: null,
    priceSource: 'No price in the source photograph — owner to set.',
    dims: [40, 30, 10],
    strapDrop: 55,
    weight: 900,
    capacity: 'Fits a 15-inch laptop, A4 documents, and a notebook.',
    colours: [{ name: 'Natural jute with dark brown leather', code: 'NAT', hex: '#C6A971', stock: 0 }],
    images: [
      {
        file: '/finished products.jpeg',
        alt: 'Several finished jute briefcases with dark brown leather trim, handles and flap straps, arranged against a white backdrop',
        type: ImageType.PRODUCT,
      },
    ],
    status: ProductStatus.DRAFT,
    featured: true,
    adminNote:
      'PRICE AND MEASUREMENTS NOT CONFIRMED. Dimensions and weight are estimates from the photograph. Set a real price, measure and weigh one, then publish.',
  },

  // ------------------------------------------------------------------- JUTE
  {
    slug: 'natural-jute-side-bag',
    name: 'Natural Jute Side Bag',
    short:
      'A flap-over jute messenger bag with a wooden toggle and an adjustable strap.',
    description:
      'Plain woven jute, cut square and finished with a wooden toggle on a cord loop. The strap is cotton webbing on metal sliders, so it adjusts from hip to across-the-body, and there is a carry handle at the top for when you would rather hold it.\n\nDeliberately simple. No hardware to fail, no lining to tear, and light enough that a full bag still feels like nothing.',
    material: Material.JUTE,
    bagType: BagType.SIDE_BAG,
    typeCode: 'SID',
    closure: Closure.OPEN,
    strap: StrapType.CROSSBODY,
    sizeBand: SizeBand.MEDIUM,
    bdt: null,
    usd: null,
    priceSource: 'No price in the source photograph — owner to set.',
    dims: [36, 28, 9],
    strapDrop: 58,
    weight: 450,
    capacity: 'Fits a 13-inch laptop, A4 documents, and a water bottle.',
    colours: [{ name: 'Natural', code: 'NAT', hex: '#C6A971', stock: 0 }],
    images: [
      {
        file: '/side bag.jpeg',
        alt: 'A natural jute messenger bag with a wooden toggle fastening and an adjustable cotton webbing strap, photographed flat on white',
        type: ImageType.PRODUCT,
      },
    ],
    status: ProductStatus.DRAFT,
    featured: true,
    adminNote:
      'PRICE AND MEASUREMENTS NOT CONFIRMED. Dimensions and weight are estimates from the photograph. Set a real price, measure and weigh one, then publish.',
  },

  // ----------------------------------------------------------------- COTTON
  {
    slug: 'canvas-school-backpack',
    name: 'Canvas School Backpack',
    short:
      'A hard-wearing cotton canvas backpack with a padded back and laptop sleeve.',
    description:
      'The bag the workshop makes most of. Heavy cotton canvas, a padded back panel and shoulder straps, a separate padded sleeve inside for a laptop or tablet, a zipped front pocket, and open side pockets for a bottle.\n\nBuilt for a school run or a commute rather than a weekend away — the stress points at the strap anchors and the base are double-stitched, because that is where a school bag fails first.',
    material: Material.COTTON,
    bagType: BagType.BACKPACK,
    typeCode: 'BPK',
    closure: Closure.ZIP,
    strap: StrapType.SHOULDER,
    sizeBand: SizeBand.LARGE,
    bdt: 740,
    usd: 12,
    priceSource:
      'Read from the handwritten tag in finished school bag3.jpeg (red). VERIFY.',
    dims: [44, 31, 15],
    weight: 700,
    capacity: 'Fits a 15-inch laptop, A4 files, a lunch box, and a water bottle.',
    colours: [
      { name: 'Red', code: 'RED', hex: '#C8332B', stock: 0 },
      { name: 'Blue', code: 'BLU', hex: '#1E9BD7', stock: 0 },
      { name: 'Sage', code: 'SAG', hex: '#8B9280', stock: 0 },
      { name: 'Olive', code: 'OLV', hex: '#8C8A2E', stock: 0 },
    ],
    images: [
      {
        file: '/finished school bag3.jpeg',
        alt: 'A red cotton canvas backpack with a zipped front pocket, side pocket and dark zip pulls, photographed from the front',
        type: ImageType.PRODUCT,
      },
      {
        file: '/finished school bag2.jpeg',
        alt: 'The same backpack in bright blue canvas, photographed from the front',
        type: ImageType.PRODUCT,
      },
      {
        file: '/finished school bag.jpeg',
        alt: 'The same backpack in sage green canvas, showing the zipped front pocket and side strap fittings',
        type: ImageType.PRODUCT,
      },
      {
        file: '/finished school bag4.jpeg',
        alt: 'The same backpack in olive canvas, showing the top handle, zipped pocket and side pockets',
        type: ImageType.PRODUCT,
      },
    ],
    status: ProductStatus.ACTIVE,
    featured: true,
    adminNote:
      'Price read from the handwritten tag in the photograph — CONFIRM before relying on it. Stock is set to 0 for every colour; set real counts on the Stock screen. Dimensions and weight are estimates.',
  },
  {
    slug: 'nakshi-panel-backpack',
    name: 'Nakshi Panel Backpack',
    short:
      'A canvas backpack with a hand-patterned nakshi front panel in red and grey.',
    description:
      'The same backpack body, with the front panel woven in a traditional nakshi pattern rather than plain canvas. Navy canvas everywhere else, so the pattern does the work without the bag becoming loud.\n\nThe patterned panel is woven, not printed, so it will not crack or peel the way a print does.',
    material: Material.COTTON,
    bagType: BagType.BACKPACK,
    typeCode: 'BPK',
    closure: Closure.ZIP,
    strap: StrapType.SHOULDER,
    sizeBand: SizeBand.MEDIUM,
    bdt: null,
    usd: null,
    priceSource: 'No price in the source photograph — owner to set.',
    dims: [40, 30, 13],
    weight: 620,
    capacity: 'Fits a 13-inch laptop, books, and a water bottle.',
    colours: [{ name: 'Navy with red nakshi panel', code: 'NAV', hex: '#28374F', stock: 0 }],
    images: [
      {
        file: '/finished school bag5.jpeg',
        alt: 'A navy canvas backpack with a red, grey and cream nakshi-patterned woven front panel, photographed flat',
        type: ImageType.PRODUCT,
      },
    ],
    status: ProductStatus.DRAFT,
    adminNote:
      'PRICE NOT CONFIRMED. Dimensions and weight are estimates from the photograph.',
  },
];

async function main() {
  console.log('Seeding the REAL catalogue.\n');

  // Remove the invented sample products. They are identifiable by slug, and
  // nothing real has been ordered against them.
  const sampleSlugs = [
    'natural-jute-shopping-bag', 'natural-jute-tote', 'olive-jute-side-bag',
    'jute-laptop-bag', 'jute-market-basket-bag', 'jute-handbag-wooden-handle',
    'jute-crossbody-pouch', 'jute-beach-tote', 'jute-clutch',
    'chestnut-leather-crossbody', 'black-leather-handbag', 'tan-leather-side-bag',
    'leather-office-bag', 'chestnut-leather-tote', 'leather-clutch',
    'black-leather-backpack', 'tan-leather-mini-crossbody', 'oxblood-leather-handbag',
    'jute-leather-tote', 'jute-leather-crossbody', 'jute-leather-laptop-bag',
    'jute-leather-handbag', 'jute-leather-weekender', 'jute-leather-satchel',
  ];

  const ordered = await db.orderItem.findMany({
    where: { product: { slug: { in: sampleSlugs } } },
    select: { productId: true },
  });

  if (ordered.length > 0) {
    // §5.5 — never delete a product that appears on a historical order.
    // Archive instead, so invoices keep resolving.
    const ids = [...new Set(ordered.map((o) => o.productId).filter(Boolean))] as string[];
    await db.product.updateMany({
      where: { id: { in: ids } },
      data: { status: ProductStatus.ARCHIVED },
    });
    console.log(`  archived ${ids.length} sample product(s) that appear on orders`);
  }

  const deleted = await db.product.deleteMany({
    where: { slug: { in: sampleSlugs }, orderItems: { none: {} } },
  });
  console.log(`  removed ${deleted.count} invented sample products`);

  let seq = 0;
  for (const spec of products) {
    seq += 1;
    const matCode =
      spec.material === Material.JUTE ? 'JUT'
      : spec.material === Material.LEATHER ? 'LEA'
      : spec.material === Material.COTTON ? 'COT'
      : 'MIX';

    const careKey =
      spec.material === Material.MIXED ? 'mixed'
      : spec.material === Material.COTTON ? 'cotton'
      : 'jute';

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
        // A DRAFT product still needs a non-null price column, so unpriced
        // items get 0 — which is exactly why they must not be ACTIVE.
        basePriceBdt: spec.bdt ? toMinor(spec.bdt, 'BDT') : 0,
        basePriceUsd: spec.usd ? toMinor(spec.usd, 'USD') : 0,
        lengthCm: spec.dims[0], widthCm: spec.dims[1], heightCm: spec.dims[2],
        strapDropCm: spec.strapDrop ?? null,
        weightGrams: spec.weight,
        capacityNoteEn: spec.capacity,
        materialsDetailEn: MATERIALS[careKey],
        careInstructionsEn: CARE[careKey],
        status: spec.status,
        featured: spec.featured ?? false,
        publishedAt: spec.status === ProductStatus.ACTIVE ? new Date() : null,
        metaTitle: `${spec.name} | Jhunu's Crafts`.slice(0, 60),
        metaDescription: spec.short.slice(0, 158),
      },
    });

    for (const [i, colour] of spec.colours.entries()) {
      const sku = `${matCode}-${spec.typeCode}-${colour.code}-${String(seq * 10 + i).padStart(3, '0')}`;
      await db.variant.upsert({
        where: { sku },
        update: {},
        create: {
          productId: product.id,
          sku,
          colorNameEn: colour.name,
          colorHex: colour.hex,
          stockQuantity: colour.stock,
        },
      });
    }

    const existing = await db.productImage.count({ where: { productId: product.id } });
    if (existing === 0) {
      await db.productImage.createMany({
        data: spec.images.map((img, position) => ({
          productId: product.id,
          url: img.file,
          width: 1600,
          height: 1200,
          altTextEn: img.alt,
          type: img.type,
          position,
        })),
      });
    }

    console.log(
      `  ${spec.status === ProductStatus.ACTIVE ? 'LIVE ' : 'draft'} ${spec.name}` +
        (spec.bdt ? ` — ৳${spec.bdt} (${spec.priceSource})` : ' — no price set'),
    );
  }

  const counts = {
    active: await db.product.count({ where: { status: ProductStatus.ACTIVE } }),
    draft: await db.product.count({ where: { status: ProductStatus.DRAFT } }),
  };

  console.log(`\n  ${counts.active} live, ${counts.draft} draft`);
  console.log('\n  ⚠ Every price and measurement needs confirming in the admin');
  console.log('    panel before these are relied on. Draft products are not');
  console.log('    visible on the storefront until published.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
