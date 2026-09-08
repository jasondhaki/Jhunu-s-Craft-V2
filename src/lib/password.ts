import { createHash } from 'node:crypto';
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';

/**
 * Password hashing and strength — plan §13.2.
 *
 * Deliberately free of any Next.js import, for two reasons:
 *
 *  1. The Argon2 parameters MUST be identical everywhere a hash is created or
 *     verified — the admin panel, the storefront, and the CLI script that
 *     creates the first admin. They were previously copied into three files
 *     with a comment begging future edits to keep them in sync, which is not
 *     a mechanism. Now there is one definition.
 *  2. It makes this testable outside a request context. `customer-auth.ts`
 *     imports `next/navigation`, which drags in React and cannot load in a
 *     plain Node script, so security-critical code was effectively untestable
 *     until it was separated.
 */

/**
 * OWASP-recommended Argon2id baseline: 19 MiB, 2 iterations, 1 lane. Runs
 * comfortably inside a serverless function's memory budget.
 *
 * `algorithm: 2` is Argon2id. The library exports `Algorithm` as an ambient
 * `const enum`, which has no runtime representation and cannot be imported
 * under `isolatedModules` — the mode Next.js builds in. The literal is pinned
 * rather than omitted because §13.2 names Argon2id specifically, and a
 * security parameter should not depend on a library default.
 */
export const ARGON_OPTIONS = {
  algorithm: 2,
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
    // A malformed or truncated hash must read as "wrong password", never as
    // an error a caller might mistake for success.
    return false;
  }
}

/**
 * A dummy hash with the same parameters as a real one.
 *
 * Verified against when an account does not exist, so a login attempt for an
 * unknown address takes the same time as one for a real address. Without
 * this, response timing alone reveals which emails are registered (§13.2).
 */
export const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$0000000000000000000000000000000000000000000';

/**
 * §13.2 — "checked against a breached-password list (HaveIBeenPwned range
 * API)".
 *
 * k-anonymity: only the first five characters of the SHA-1 hash are sent, and
 * the remainder is compared locally, so neither the password nor its full
 * hash ever leaves this server. `Add-Padding` makes every response the same
 * size so the request cannot be fingerprinted by length.
 *
 * FAILS OPEN. If HIBP is slow or down, registration still works — a third
 * party's availability is not a good reason to block a sale.
 */
export async function isPasswordBreached(password: string): Promise<boolean> {
  try {
    const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return false;

    const body = await response.text();
    return body.split('\n').some((line) => line.split(':')[0]?.trim() === suffix);
  } catch {
    return false;
  }
}

export interface PasswordCheck {
  ok: boolean;
  error?: string;
}

/**
 * §13.2 — "Minimum 8 characters... No forced rotation, no silly composition
 * rules." Length and breach status are the two things that actually predict a
 * weak password; mandatory symbols mostly produce `Password1!`.
 */
export async function checkPasswordStrength(
  password: string,
): Promise<PasswordCheck> {
  if (password.length < 8) {
    return { ok: false, error: 'Use at least 8 characters.' };
  }
  if (password.length > 200) {
    return { ok: false, error: 'That password is too long.' };
  }
  if (await isPasswordBreached(password)) {
    return {
      ok: false,
      // §7.3 — what happened, and what to do about it.
      error:
        'That password has appeared in a known data breach. Please choose a different one.',
    };
  }
  return { ok: true };
}
