/**
 * Account security — plan §13.2, §13.3.
 *
 *   npm run test:accounts
 *
 * The important assertions here are the IDOR ones. §13.3 calls this class of
 * bug "the most common serious flaw in small ecommerce sites", so the tests
 * literally attempt to read one customer's order as another customer, and as
 * a guest, and assert that every route back is closed.
 *
 * Creates two throwaway customers and orders, then removes them.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  getCustomerOrder,
  listCustomerOrders,
  findOrderForGuest,
  claimGuestOrders,
} from '../src/lib/customer-orders';
// From src/lib/password.ts rather than customer-auth.ts: the latter imports
// next/navigation, which drags in React and cannot load outside a request
// context. Splitting the pure crypto out is what makes it testable at all.
import {
  hashPassword,
  verifyPassword,
  checkPasswordStrength,
  isPasswordBreached,
} from '../src/lib/password';

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL!,
  }),
});

const results: [string, boolean, string][] = [];
const check = (name: string, pass: boolean, detail = '') =>
  results.push([name, pass, detail]);

const stamp = Date.now();
const emailA = `__test-a-${stamp}@example.invalid`;
const emailB = `__test-b-${stamp}@example.invalid`;
const guestEmail = `__test-guest-${stamp}@example.invalid`;

async function main() {
  // --- Fixtures -----------------------------------------------------------
  const [alice, bob] = await Promise.all([
    db.customer.create({ data: { email: emailA, firstName: 'Alice' } }),
    db.customer.create({ data: { email: emailB, firstName: 'Bob' } }),
  ]);

  const address = {
    recipientName: 'Alice Test',
    phone: '+8801799999999',
    line1: '1 Test Lane',
    city: 'Dhaka',
    region: 'Dhaka',
    country: 'BD',
  };

  const aliceOrder = await db.order.create({
    data: {
      orderNumber: `TEST-A-${stamp}`,
      publicToken: `tok-alice-${stamp}`,
      customerId: alice.id,
      email: emailA,
      phone: '+8801799999999',
      paymentMethod: 'COD',
      currency: 'BDT',
      subtotal: 100_000,
      grandTotal: 106_000,
      shippingTotal: 6_000,
      shippingAddress: address,
      billingAddress: address,
      shippingMethod: 'Test',
    },
  });

  const guestOrder = await db.order.create({
    data: {
      orderNumber: `TEST-G-${stamp}`,
      publicToken: `tok-guest-${stamp}`,
      customerId: null,
      email: guestEmail,
      phone: '+8801788888888',
      paymentMethod: 'COD',
      currency: 'BDT',
      subtotal: 50_000,
      grandTotal: 56_000,
      shippingTotal: 6_000,
      shippingAddress: address,
      billingAddress: address,
      shippingMethod: 'Test',
    },
  });

  try {
    // === IDOR (§13.3) ====================================================
    const own = await getCustomerOrder(alice.id, aliceOrder.id);
    check('A customer CAN read their own order', own?.id === aliceOrder.id);

    const stolen = await getCustomerOrder(bob.id, aliceOrder.id);
    check(
      "Another customer CANNOT read someone else's order by id (IDOR)",
      stolen === null,
      stolen === null ? 'returns null → 404' : '!!! LEAKED',
    );

    const bobList = await listCustomerOrders(bob.id);
    check(
      "A customer's order list contains only their own orders",
      bobList.length === 0,
      `Bob sees ${bobList.length} orders`,
    );

    // === Guest tracking (§6.9, §13.3) ====================================
    const byNumberOnly = await findOrderForGuest({
      orderNumber: guestOrder.orderNumber,
    });
    check(
      'An order number ALONE is not enough to view an order',
      byNumberOnly === null,
      byNumberOnly === null ? 'refused' : '!!! LEAKED',
    );

    const byWrongContact = await findOrderForGuest({
      orderNumber: guestOrder.orderNumber,
      emailOrPhone: 'someone-else@example.invalid',
    });
    check(
      'A wrong email with a real order number is refused',
      byWrongContact === null,
      byWrongContact === null ? 'refused' : '!!! LEAKED',
    );

    const byEmail = await findOrderForGuest({
      orderNumber: guestOrder.orderNumber,
      emailOrPhone: guestEmail,
    });
    check('Order number + matching email works', byEmail?.id === guestOrder.id);

    const byPhoneFormatted = await findOrderForGuest({
      orderNumber: guestOrder.orderNumber,
      emailOrPhone: '01788888888', // local format, stored as +880…
    });
    check(
      'Phone matching tolerates formatting differences',
      byPhoneFormatted?.id === guestOrder.id,
      '01788888888 matches +8801788888888',
    );

    const byToken = await findOrderForGuest({
      orderNumber: guestOrder.orderNumber,
      token: guestOrder.publicToken,
    });
    check('The emailed token works without any contact detail', byToken?.id === guestOrder.id);

    const byWrongToken = await findOrderForGuest({
      orderNumber: guestOrder.orderNumber,
      token: 'not-the-real-token',
    });
    check(
      'A wrong token is refused',
      byWrongToken === null,
      byWrongToken === null ? 'refused' : '!!! LEAKED',
    );

    const crossToken = await findOrderForGuest({
      orderNumber: guestOrder.orderNumber,
      token: aliceOrder.publicToken, // a real token, wrong order
    });
    check(
      "Another order's valid token does not unlock this order",
      crossToken === null,
      crossToken === null ? 'refused' : '!!! LEAKED',
    );

    // === Claiming guest orders on registration ===========================
    const claimed = await claimGuestOrders(bob.id, guestEmail);
    check('Registering claims past guest orders with the same email', claimed === 1, `${claimed} claimed`);

    const bobNow = await listCustomerOrders(bob.id);
    check('The claimed order now appears in that account', bobNow.length === 1);

    const stillHidden = await getCustomerOrder(alice.id, guestOrder.id);
    check(
      'A claimed order is NOT visible to a different customer',
      stillHidden === null,
      stillHidden === null ? 'refused' : '!!! LEAKED',
    );

    // === Passwords (§13.2) ===============================================
    const hash = await hashPassword('a-reasonable-password-123');
    check('Password hash is Argon2id', hash.startsWith('$argon2id$'), hash.slice(0, 20));
    check('Correct password verifies', await verifyPassword(hash, 'a-reasonable-password-123'));
    check('Wrong password does not verify', !(await verifyPassword(hash, 'wrong-password')));
    check(
      'A malformed hash reads as "wrong password" rather than throwing',
      !(await verifyPassword('not-a-hash', 'anything')),
    );

    const short = await checkPasswordStrength('short');
    check('Passwords under 8 characters are refused', !short.ok, short.error ?? '');

    // HIBP k-anonymity — a famously breached password.
    const breached = await isPasswordBreached('password123');
    check(
      'A known-breached password is detected via HIBP (§13.2)',
      breached,
      breached ? 'password123 rejected' : 'HIBP unreachable — fails open by design',
    );

    const good = await checkPasswordStrength(`unique-${stamp}-phrase-xyz`);
    check('A strong unseen password is accepted', good.ok, good.error ?? '');
  } finally {
    // --- Cleanup ----------------------------------------------------------
    await db.order.deleteMany({
      where: { id: { in: [aliceOrder.id, guestOrder.id] } },
    });
    await db.customer.deleteMany({ where: { id: { in: [alice.id, bob.id] } } });
  }

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
