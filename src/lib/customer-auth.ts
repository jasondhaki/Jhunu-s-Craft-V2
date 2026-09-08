import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  hashPassword,
  verifyPassword,
  checkPasswordStrength,
  DUMMY_HASH,
} from '@/lib/password';
import { TokenPurpose, type Customer } from '@prisma/client';
import { db } from '@/lib/db';

/**
 * Customer authentication — plan §13.2, §13.3, §6.7.
 *
 * Separate from `admin-auth.ts` on purpose. A customer session and an admin
 * session are different credentials with different lifetimes and different
 * blast radii, and one must never satisfy a check meant for the other
 * (§13.3). Sharing a table or a cookie between them is how privilege
 * escalation bugs happen.
 *
 * §6.5 and §28 are emphatic that accounts are OPTIONAL — there is no account
 * wall at checkout, and everything here is opt-in. An account exists to make
 * repeat buying easier, not to gate the first purchase.
 */

const SESSION_COOKIE = 'jc_session';

/**
 * 30 days. Much longer than the admin's 8 hours: the consequence of a stolen
 * customer session is order history, not the ability to alter the catalogue.
 */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** §13.2 — password reset tokens expire in 1 hour and are single-use. */
const RESET_TTL_MS = 60 * 60 * 1000;

/** §10.1 — email verification links expire in 24 hours. */
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

// Argon2 parameters, hashing, and the breach check live in src/lib/password.ts
// so there is exactly ONE definition shared by the storefront, the admin
// panel, and the CLI. Re-exported here for callers already importing from
// this module.
export { hashPassword, verifyPassword, checkPasswordStrength };
export type { PasswordCheck } from '@/lib/password';

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function newToken(): string {
  return randomBytes(32).toString('base64url');
}

// ---------------------------------------------------------------------------
// Rate limiting (§13.2, §13.6)
// ---------------------------------------------------------------------------

const attempts = new Map<string, { count: number; resetAt: number }>();

/**
 * In-memory, so it is per-instance rather than global — the same honest
 * limitation noted in admin-auth.ts. Redis-backed limiting is the §12.2 plan.
 * It still turns unlimited guessing into something slow and noisy.
 */
export function rateLimit(
  key: string,
  max = 5,
  windowMs = 15 * 60 * 1000,
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  entry.count += 1;
  if (entry.count > max) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function clearRateLimit(key: string): void {
  attempts.delete(key);
}

async function requestIp(): Promise<string> {
  const hdrs = await headers();
  return hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export async function createSession(customerId: string): Promise<void> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const hdrs = await headers();

  await db.session.create({
    data: {
      customerId,
      tokenHash: hashToken(token),
      expiresAt,
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent') ?? null,
    },
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  jar.delete(SESSION_COOKIE);
}

/** §13.2 — "log out all devices", and used on every password change. */
export async function destroyAllSessions(customerId: string): Promise<number> {
  const { count } = await db.session.deleteMany({ where: { customerId } });
  return count;
}

export interface SessionCustomer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  emailVerified: boolean;
}

export async function getCustomer(): Promise<SessionCustomer | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { customer: true },
  });
  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // A blocked or anonymised account loses access immediately (§13.8).
  if (session.customer.isBlocked || session.customer.anonymisedAt) return null;

  return {
    id: session.customer.id,
    email: session.customer.email,
    firstName: session.customer.firstName,
    lastName: session.customer.lastName,
    emailVerified: session.customer.emailVerifiedAt !== null,
  };
}

/**
 * §13.3 — every customer-facing resource must check ownership. This is the
 * gate for /account/*; the per-resource checks (an order belongs to THIS
 * customer) live next to each query, because a session check alone is exactly
 * the IDOR mistake the plan calls the most common serious flaw.
 */
export async function requireCustomer(): Promise<SessionCustomer> {
  const customer = await getCustomer();
  // `redirect` throws, so control never reaches the return — but TypeScript
  // only knows that from the static import, not a dynamic one.
  if (!customer) redirect('/login');
  return customer;
}

// ---------------------------------------------------------------------------
// Registration and login
// ---------------------------------------------------------------------------

/**
 * §13.2 — the same message whether the account exists or not, so registration
 * cannot be used to discover which email addresses have accounts.
 */
export const GENERIC_LOGIN_ERROR = 'Email or password is incorrect.';

export type LoginResult =
  | { ok: true; customer: Customer }
  | { ok: false; error: string };

export async function attemptLogin(
  email: string,
  password: string,
): Promise<LoginResult> {
  const normalised = email.trim().toLowerCase();
  const ip = await requestIp();

  for (const key of [`login:${normalised}`, `login-ip:${ip}`]) {
    const { allowed, retryAfterSec } = rateLimit(key);
    if (!allowed) {
      return {
        ok: false,
        error: `Too many attempts. Try again in ${Math.ceil(retryAfterSec / 60)} minutes.`,
      };
    }
  }

  const customer = await db.customer.findUnique({ where: { email: normalised } });

  // Hash regardless, so timing does not reveal whether the account exists.
  const storedHash = customer?.passwordHash ?? DUMMY_HASH;

  const passwordOk = await verifyPassword(storedHash, password);

  if (!customer || !customer.passwordHash || !passwordOk) {
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }
  if (customer.isBlocked) {
    // Same generic message — telling someone they are blocked invites them to
    // simply make another account.
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }

  clearRateLimit(`login:${normalised}`);
  await db.customer.update({
    where: { id: customer.id },
    data: { lastLoginAt: new Date() },
  });

  return { ok: true, customer };
}

// ---------------------------------------------------------------------------
// Verification and reset tokens (§13.2, §10.1)
// ---------------------------------------------------------------------------

/**
 * Issues a single-use token. Returns the RAW token for the email link; only
 * its hash is stored, so a database leak does not hand over live reset links.
 */
export async function issueToken(
  customerId: string,
  purpose: TokenPurpose,
): Promise<string> {
  const token = newToken();
  const ttl = purpose === TokenPurpose.PASSWORD_RESET ? RESET_TTL_MS : VERIFY_TTL_MS;

  // Any outstanding token of the same kind is invalidated — requesting a new
  // reset link must make the old one dead.
  await db.verificationToken.deleteMany({
    where: { customerId, purpose, usedAt: null },
  });

  await db.verificationToken.create({
    data: {
      customerId,
      purpose,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + ttl),
    },
  });

  return token;
}

export type TokenConsumption =
  | { ok: true; customerId: string }
  | { ok: false; error: string };

/**
 * Validates and burns a token in one step. Single-use is enforced by marking
 * `usedAt` inside a transaction, so two simultaneous clicks on a reset link
 * cannot both succeed.
 */
export async function consumeToken(
  rawToken: string,
  purpose: TokenPurpose,
): Promise<TokenConsumption> {
  const tokenHash = hashToken(rawToken);

  return db.$transaction(async (tx) => {
    const token = await tx.verificationToken.findUnique({ where: { tokenHash } });

    if (!token || token.purpose !== purpose) {
      return { ok: false, error: 'That link is not valid. Please request a new one.' };
    }
    if (token.usedAt) {
      return { ok: false, error: 'That link has already been used. Please request a new one.' };
    }
    if (token.expiresAt < new Date()) {
      return { ok: false, error: 'That link has expired. Please request a new one.' };
    }

    const { count } = await tx.verificationToken.updateMany({
      where: { id: token.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (count === 0) {
      // Someone else burned it between the read and the write.
      return { ok: false, error: 'That link has already been used. Please request a new one.' };
    }

    return { ok: true, customerId: token.customerId };
  });
}

/**
 * §13.2 — "Session invalidation on password change."
 *
 * Changing a password is the action someone takes when they think their
 * account is compromised; leaving other sessions alive defeats the point.
 */
export async function setPassword(
  customerId: string,
  password: string,
): Promise<void> {
  const passwordHash = await hashPassword(password);

  await db.$transaction([
    db.customer.update({ where: { id: customerId }, data: { passwordHash } }),
    db.session.deleteMany({ where: { customerId } }),
  ]);
}
