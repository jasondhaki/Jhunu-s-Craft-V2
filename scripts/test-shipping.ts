/**
 * Shipping, COD eligibility, and duties rules — plan §8.1, §8.4, §9.
 *
 *   npm run test:shipping
 *
 * Exercises the resolution logic directly rather than through the checkout UI.
 * These are the rules that decide what a customer is charged, so they are
 * worth testing on their own terms.
 */

import 'dotenv/config';
import { resolveZone, quoteShipping, codAvailable, dutiesApply } from '../src/lib/shipping';
import { codEligibility, COD_MAX_ORDER_VALUE_BDT } from '../src/lib/payments/cod';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL!,
  }),
});

const results: [string, boolean, string][] = [];
const check = (name: string, pass: boolean, detail = '') =>
  results.push([name, pass, detail]);

async function main() {
  // --- Zone resolution (§9.1) --------------------------------------------
  const dhaka = await resolveZone({ country: 'BD', region: 'Dhaka', city: 'Dhaka' });
  check('Dhaka resolves to the Inside Dhaka zone', dhaka?.code === 'BD_DHAKA', dhaka?.code ?? 'none');

  const sylhet = await resolveZone({ country: 'BD', region: 'Sylhet', city: 'Sylhet' });
  check(
    'A non-Dhaka district falls through to Outside Dhaka',
    sylhet?.code === 'BD_OUTSIDE',
    sylhet?.code ?? 'none',
  );

  const us = await resolveZone({ country: 'US', city: 'New York' });
  check('US resolves to the North America zone', us?.code === 'INTL_NORTH_AMERICA', us?.code ?? 'none');

  const unknown = await resolveZone({ country: 'ZW', city: 'Harare' });
  check(
    'An uncovered country falls back to Rest of world, not nothing',
    unknown?.code === 'INTL_REST',
    unknown?.code ?? 'none',
  );

  // --- Free shipping threshold (§9.1) ------------------------------------
  const belowThreshold = await quoteShipping({
    address: { country: 'BD', region: 'Dhaka', city: 'Dhaka' },
    totalWeightGrams: 400,
    subtotal: 100_000, // ৳1,000 — below the ৳3,000 threshold
    currency: 'BDT',
  });
  check(
    'Below the free-shipping threshold, delivery is charged',
    belowThreshold?.price === 6_000,
    `৳${(belowThreshold?.price ?? 0) / 100}`,
  );
  check(
    'Shortfall to free delivery is reported for the cart progress bar',
    belowThreshold?.freeShippingShortfall === 200_000,
    `৳${(belowThreshold?.freeShippingShortfall ?? 0) / 100} more needed`,
  );

  const aboveThreshold = await quoteShipping({
    address: { country: 'BD', region: 'Dhaka', city: 'Dhaka' },
    totalWeightGrams: 400,
    subtotal: 350_000, // ৳3,500 — above the threshold
    currency: 'BDT',
  });
  check(
    'At or above the threshold, delivery becomes free',
    aboveThreshold?.price === 0,
    `price ${aboveThreshold?.price}`,
  );
  check(
    'The original price is retained so the saving can be shown',
    aboveThreshold?.originalPrice === 6_000,
  );
  check(
    'No shortfall reported once free delivery applies',
    aboveThreshold?.freeShippingShortfall === null,
  );

  // --- International (§9.2, §8.4) ----------------------------------------
  const intl = await quoteShipping({
    address: { country: 'US', city: 'New York' },
    totalWeightGrams: 800,
    subtotal: 20_000, // $200
    currency: 'USD',
  });
  check('International quotes use the USD column', intl?.price === 5_200, `$${(intl?.price ?? 0) / 100}`);
  check(
    'A large international order still does NOT get free shipping',
    intl?.freeShippingShortfall === null && intl?.price !== 0,
    'no free-shipping threshold on international zones',
  );
  check('Duties notice applies internationally (§8.4)', dutiesApply('INTL_NORTH_AMERICA'));
  check('Duties notice does NOT apply domestically', !dutiesApply('BD_DHAKA'));

  // --- COD rules (§8.1) ---------------------------------------------------
  check('COD is offered inside Bangladesh', codAvailable('BD_DHAKA'));
  check('COD is NOT offered internationally', !codAvailable('INTL_EUROPE'));

  const codOk = codEligibility({ zoneCode: 'BD_DHAKA', currency: 'BDT', grandTotal: 500_000 });
  check('A normal Dhaka order is COD-eligible', codOk.eligible);

  const codTooBig = codEligibility({
    zoneCode: 'BD_DHAKA',
    currency: 'BDT',
    grandTotal: COD_MAX_ORDER_VALUE_BDT + 1,
  });
  check(
    'COD is refused above the value cap (§8.1 abuse control)',
    !codTooBig.eligible,
    codTooBig.eligible ? '' : codTooBig.reason,
  );

  const codIntl = codEligibility({ zoneCode: 'INTL_EUROPE', currency: 'USD', grandTotal: 10_000 });
  check(
    'COD is refused internationally, with a reason the UI can show',
    !codIntl.eligible && 'reason' in codIntl && codIntl.reason.length > 0,
  );

  // --- Money invariants ---------------------------------------------------
  check(
    'Every quoted price is an integer in minor units',
    [belowThreshold, aboveThreshold, intl].every(
      (q) => q !== null && Number.isInteger(q.price),
    ),
  );

  console.log('');
  for (const [name, pass, detail] of results) {
    console.log(
      `${(pass ? 'PASS' : '**FAIL**').padEnd(10)} ${name}${detail ? '  —  ' + detail : ''}`,
    );
  }
  const failed = results.filter((r) => !r[1]).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exitCode = failed ? 1 : 0;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
