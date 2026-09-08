'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { TokenPurpose } from '@prisma/client';
import { db } from '@/lib/db';
import {
  attemptLogin,
  checkPasswordStrength,
  consumeToken,
  createSession,
  destroySession,
  getCustomer,
  hashPassword,
  issueToken,
  rateLimit,
  setPassword,
  GENERIC_LOGIN_ERROR,
} from '@/lib/customer-auth';
import { sendEmail } from '@/lib/email/send';
import {
  verifyEmailEmail,
  passwordResetEmail,
  passwordChangedEmail,
} from '@/lib/email/templates';

/**
 * Account actions — plan §6.7, §13.2.
 *
 * Every response here is deliberately vague about whether an account exists.
 * §13.2: "Generic responses on login/reset ('Email or password is incorrect',
 * 'If that email is registered…') so you don't leak which accounts exist."
 */

export type AuthResult = { ok: true } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

const registerSchema = z.object({
  email: z.string().trim().email("That email address doesn't look right.").max(200),
  password: z.string().min(1, 'Choose a password.').max(200),
  firstName: z.string().trim().max(100).optional().or(z.literal('')),
  lastName: z.string().trim().max(100).optional().or(z.literal('')),
  marketingOptIn: z.boolean().default(false),
});

export async function registerAction(formData: FormData): Promise<AuthResult> {
  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    firstName: formData.get('firstName') ?? '',
    lastName: formData.get('lastName') ?? '',
    // §14.5 — never pre-ticked. Absent means false.
    marketingOptIn: formData.get('marketingOptIn') === 'on',
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  const limit = rateLimit(`register:${email}`, 5);
  if (!limit.allowed) {
    return { ok: false, error: 'Too many attempts. Please try again shortly.' };
  }

  // §13.2 — length plus a breached-password check.
  const strength = await checkPasswordStrength(data.password);
  if (!strength.ok) return { ok: false, error: strength.error! };

  const existing = await db.customer.findUnique({ where: { email } });

  if (existing?.passwordHash) {
    // An account with a password already exists. Saying so would confirm the
    // address is registered, so we report success and send a "someone tried
    // to register" nudge instead — the real owner finds out, a prober does not.
    await sendEmail(passwordResetEmail({
      to: email,
      token: await issueToken(existing.id, TokenPurpose.PASSWORD_RESET),
    }));
    return { ok: true };
  }

  const passwordHash = await hashPassword(data.password);

  // A guest who has ordered before already has a Customer row (created from
  // their email). Claiming it rather than creating a duplicate means their
  // order history appears the moment they register.
  const customer = existing
    ? await db.customer.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          firstName: data.firstName || existing.firstName,
          lastName: data.lastName || existing.lastName,
          marketingOptIn: data.marketingOptIn,
        },
      })
    : await db.customer.create({
        data: {
          email,
          passwordHash,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          marketingOptIn: data.marketingOptIn,
        },
      });

  const token = await issueToken(customer.id, TokenPurpose.EMAIL_VERIFICATION);
  await sendEmail(
    verifyEmailEmail({ to: email, firstName: customer.firstName, token }),
  );

  await createSession(customer.id);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Log in / out
// ---------------------------------------------------------------------------

export async function loginAction(formData: FormData): Promise<AuthResult> {
  const parsed = z
    .object({
      email: z.string().trim().email().max(200),
      password: z.string().min(1).max(400),
    })
    .safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

  // A malformed submission gets the same message as a wrong password.
  if (!parsed.success) return { ok: false, error: GENERIC_LOGIN_ERROR };

  const result = await attemptLogin(parsed.data.email, parsed.data.password);
  if (!result.ok) return { ok: false, error: result.error };

  await createSession(result.customer.id);
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/');
}

// ---------------------------------------------------------------------------
// Password reset (§13.2)
// ---------------------------------------------------------------------------

/**
 * Always reports success. §13.2 requires "If that email is registered, a reset
 * link is on its way" — the response must not differ between a real and an
 * unknown address.
 */
export async function requestPasswordResetAction(
  formData: FormData,
): Promise<AuthResult> {
  const parsed = z
    .object({ email: z.string().trim().email().max(200) })
    .safeParse({ email: formData.get('email') });

  // Even a malformed address reports success, for the same reason.
  if (!parsed.success) return { ok: true };

  const email = parsed.data.email.toLowerCase();

  // Rate limited so this cannot be used to spam someone's inbox.
  const limit = rateLimit(`reset:${email}`, 3, 15 * 60 * 1000);
  if (!limit.allowed) return { ok: true };

  const customer = await db.customer.findUnique({ where: { email } });

  if (customer && !customer.isBlocked && !customer.anonymisedAt) {
    const token = await issueToken(customer.id, TokenPurpose.PASSWORD_RESET);
    await sendEmail(passwordResetEmail({ to: email, token }));
  }

  return { ok: true };
}

export async function resetPasswordAction(
  formData: FormData,
): Promise<AuthResult> {
  const parsed = z
    .object({
      token: z.string().trim().min(10).max(200),
      password: z.string().min(1).max(200),
    })
    .safeParse({
      token: formData.get('token'),
      password: formData.get('password'),
    });

  if (!parsed.success) {
    return { ok: false, error: 'That link is not valid. Please request a new one.' };
  }

  const strength = await checkPasswordStrength(parsed.data.password);
  if (!strength.ok) return { ok: false, error: strength.error! };

  const consumed = await consumeToken(parsed.data.token, TokenPurpose.PASSWORD_RESET);
  if (!consumed.ok) return { ok: false, error: consumed.error };

  // Sets the password AND kills every existing session (§13.2).
  await setPassword(consumed.customerId, parsed.data.password);

  const customer = await db.customer.findUnique({
    where: { id: consumed.customerId },
  });
  if (customer) {
    // §10.1 — tell them after the fact, so a takeover is visible.
    await sendEmail(passwordChangedEmail({ to: customer.email }));
    // Resetting a password proves control of the inbox, which is exactly what
    // email verification proves — so mark it verified rather than asking again.
    if (!customer.emailVerifiedAt) {
      await db.customer.update({
        where: { id: customer.id },
        data: { emailVerifiedAt: new Date() },
      });
    }
    await createSession(customer.id);
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Email verification (§10.1)
// ---------------------------------------------------------------------------

export async function verifyEmailAction(token: string): Promise<AuthResult> {
  const consumed = await consumeToken(token, TokenPurpose.EMAIL_VERIFICATION);
  if (!consumed.ok) return { ok: false, error: consumed.error };

  await db.customer.update({
    where: { id: consumed.customerId },
    data: { emailVerifiedAt: new Date() },
  });

  return { ok: true };
}

export async function resendVerificationAction(): Promise<AuthResult> {
  const customer = await getCustomer();
  if (!customer) return { ok: false, error: 'Please sign in first.' };
  if (customer.emailVerified) return { ok: true };

  const limit = rateLimit(`verify:${customer.id}`, 3, 15 * 60 * 1000);
  if (!limit.allowed) {
    return { ok: false, error: 'Please wait a few minutes before asking again.' };
  }

  const token = await issueToken(customer.id, TokenPurpose.EMAIL_VERIFICATION);
  await sendEmail(
    verifyEmailEmail({
      to: customer.email,
      firstName: customer.firstName,
      token,
    }),
  );

  return { ok: true };
}

/** Reads the post-login destination, defaulting somewhere safe. */
export async function postLoginRedirect(): Promise<string> {
  const next = (await cookies()).get('jc_next')?.value;
  // Only relative paths — an open redirect would let a phishing link bounce
  // through our domain (§13.4).
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  return '/account';
}
