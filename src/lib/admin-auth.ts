import 'server-only';

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import type { AdminRole, AdminUser } from '@prisma/client';
import { db } from '@/lib/db';

/**
 * Admin authentication — plan §13.2, §13.3.
 *
 * `server-only` at the top is deliberate: importing this from a client
 * component becomes a build error rather than a credential leak.
 *
 * What the plan requires and what is implemented here:
 *  - Argon2id password hashing (§13.2) ✅
 *  - Sessions in httpOnly, Secure, SameSite cookies (§13.2) ✅
 *  - Token stored HASHED in the database, never in plaintext ✅
 *  - Rate limiting on login (§13.2) ✅ (per email + per IP)
 *  - Generic failure messages so account existence does not leak (§13.2) ✅
 *  - Server-side permission check on every admin route (§13.3) ✅
 *  - TOTP 2FA — the schema and the session gate exist; the TOTP verification
 *    flow itself lands in Phase 3. See ADMIN_2FA_ENFORCED below.
 */

const SESSION_COOKIE = 'jc_admin_session';

/**
 * Eight hours. Much shorter than a customer session — an admin session is a
 * far more valuable credential.
 */
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/**
 * §13.2 makes TOTP mandatory on admin accounts. The enrolment and challenge
 * flow is Phase 3 work; this flag is the switch that starts REFUSING sessions
 * without a verified second factor.
 *
 * It must be flipped to `true` before launch — it is on the §25 pre-launch
 * checklist as "Admin 2FA enabled on every account".
 */
export const ADMIN_2FA_ENFORCED = false;

// ---------------------------------------------------------------------------
// Passwords
// ---------------------------------------------------------------------------

/**
 * Argon2id parameters.
 *
 * 19 MiB / t=2 / p=1 is the OWASP-recommended baseline and runs comfortably
 * inside a serverless function's memory budget.
 *
 * `algorithm: 2` is Argon2id. The library exports `Algorithm` as an ambient
 * `const enum`, which has no runtime representation and cannot be imported
 * under TypeScript's `isolatedModules` — the mode Next.js builds in. The
 * numeric literal is pinned here rather than omitted, because §13.2 names
 * Argon2id specifically and a silent default is not something a security
 * parameter should rely on.
 *
 * MUST stay identical in scripts/create-admin.ts, or hashes created by the
 * script will not verify at login.
 */
const ARGON_OPTIONS = {
  algorithm: 2, // Argon2id — see note above
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(password: string): Promise<string> {
  return argonHash(password, ARGON_OPTIONS);
}

export async function verifyPassword(
  storedHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argonVerify(storedHash, password, ARGON_OPTIONS);
  } catch {
    // A malformed hash must read as "wrong password", never as an error the
    // caller might treat as success.
    return false;
  }
}

// ---------------------------------------------------------------------------
// Session tokens
// ---------------------------------------------------------------------------

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * A session token is high-entropy random, so a fast hash is correct here —
 * SHA-256 is not password hashing, and there is nothing to brute-force in
 * 256 bits of randomness.
 */
function newToken(): string {
  return randomBytes(32).toString('base64url');
}

// ---------------------------------------------------------------------------
// Login rate limiting (§13.2, §13.6)
// ---------------------------------------------------------------------------

/**
 * "5 attempts per email per 15 minutes, plus per-IP limits."
 *
 * In-memory, which is honest about its limits: each serverless instance keeps
 * its own counter, so this slows an attacker down rather than stopping them
 * dead. Redis-backed limiting is listed in §12.2 and lands with the rest of
 * the abuse controls in Phase 3. It is still worth having now — it turns
 * unlimited guessing into something noisy and slow.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export function rateLimit(key: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }

  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function clearRateLimit(key: string): void {
  attempts.delete(key);
}

// ---------------------------------------------------------------------------
// Session lifecycle
// ---------------------------------------------------------------------------

export async function createSession(adminUserId: string): Promise<void> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const hdrs = await headers();

  await db.adminSession.create({
    data: {
      adminUserId,
      tokenHash: hashToken(token),
      expiresAt,
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent') ?? null,
    },
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, // not readable by JavaScript — blunts XSS session theft
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // survives a top-level navigation, blocks cross-site POSTs
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;

  if (token) {
    // deleteMany, not delete — an unknown token must not throw.
    await db.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  jar.delete(SESSION_COOKIE);
}

export interface AdminSessionUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

/**
 * Resolves the current admin, or null. Expired sessions are deleted as they
 * are encountered, so the table does not grow without bound.
 */
export async function getAdmin(): Promise<AdminSessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { adminUser: true },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await db.adminSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // A deactivated account must lose access immediately, not at session expiry.
  if (!session.adminUser.isActive) return null;

  if (ADMIN_2FA_ENFORCED && !session.totpVerifiedAt) return null;

  return {
    id: session.adminUser.id,
    email: session.adminUser.email,
    name: session.adminUser.name,
    role: session.adminUser.role,
  };
}

/**
 * §13.3: "Server-side permission check on EVERY admin endpoint. Never rely on
 * the UI hiding a button."
 *
 * Every admin page and every admin action calls this. It redirects rather
 * than returning null so a caller cannot forget to handle the null case.
 */
export async function requireAdmin(
  minimumRole: AdminRole = 'STAFF',
): Promise<AdminSessionUser> {
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login');

  if (!hasRole(admin.role, minimumRole)) {
    redirect('/admin?denied=1');
  }
  return admin;
}

/** OWNER ⊃ MANAGER ⊃ STAFF (§11.4). */
const ROLE_RANK: Record<AdminRole, number> = {
  STAFF: 1,
  MANAGER: 2,
  OWNER: 3,
};

export function hasRole(role: AdminRole, minimum: AdminRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

/**
 * §13.2: generic responses so we do not leak which accounts exist. Every
 * failure path returns the same message.
 */
export const GENERIC_LOGIN_ERROR = 'Email or password is incorrect.';

export async function attemptLogin(
  email: string,
  password: string,
): Promise<{ ok: true; user: AdminUser } | { ok: false; error: string }> {
  const normalisedEmail = email.trim().toLowerCase();

  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  for (const key of [`email:${normalisedEmail}`, `ip:${ip}`]) {
    const { allowed, retryAfterSec } = rateLimit(key);
    if (!allowed) {
      return {
        ok: false,
        error: `Too many attempts. Try again in ${Math.ceil(retryAfterSec / 60)} minutes.`,
      };
    }
  }

  const user = await db.adminUser.findUnique({ where: { email: normalisedEmail } });

  // Hash even when the user does not exist, so the response time does not
  // reveal whether the account is real (§13.2).
  const storedHash =
    user?.passwordHash ??
    '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$0000000000000000000000000000000000000000000';

  const passwordOk = await verifyPassword(storedHash, password);

  if (!user || !passwordOk || !user.isActive) {
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }

  clearRateLimit(`email:${normalisedEmail}`);

  await db.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { ok: true, user };
}

/**
 * §13.7 — audit log of every admin action: who, what, before, after, when.
 * Called by every mutating admin action.
 */
export async function auditLog(params: {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  const hdrs = await headers();
  await db.auditLog.create({
    data: {
      adminUserId: params.adminUserId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      beforeJson: (params.before ?? null) as never,
      afterJson: (params.after ?? null) as never,
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    },
  });
}

/** Constant-time compare, for anywhere a secret is checked directly. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
