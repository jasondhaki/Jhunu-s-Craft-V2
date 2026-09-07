import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  attemptLogin,
  createSession,
  getAdmin,
  GENERIC_LOGIN_ERROR,
} from '@/lib/admin-auth';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/site-config';

/**
 * Admin login — plan §13.2.
 *
 * A plain server-rendered form with a Server Action. No client JavaScript is
 * required to log in, which matters because §11.5 says the owner's father
 * will use this on a phone, possibly on a poor connection.
 */

export const metadata: Metadata = {
  title: 'Sign in',
  // Never index the admin panel (§17.1).
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Already signed in? Skip the form.
  if (await getAdmin()) redirect('/admin');

  const { error } = await searchParams;

  async function signIn(formData: FormData) {
    'use server';

    // §13.4 — validate and type every input server-side with a schema.
    const parsed = z
      .object({
        email: z.string().trim().email().max(200),
        password: z.string().min(1).max(400),
      })
      .safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
      });

    if (!parsed.success) {
      // Same generic message as a wrong password — a validation failure must
      // not reveal anything either (§13.2).
      redirect(`/admin/login?error=${encodeURIComponent(GENERIC_LOGIN_ERROR)}`);
    }

    const result = await attemptLogin(parsed.data.email, parsed.data.password);
    if (!result.ok) {
      redirect(`/admin/login?error=${encodeURIComponent(result.error)}`);
    }

    await createSession(result.user.id);
    redirect('/admin');
  }

  return (
    <main
      id="main"
      className="bg-paper flex min-h-screen items-center justify-center px-4 py-16"
    >
      <div className="w-full max-w-sm">
        <h1 className="font-display text-lg font-semibold">
          {siteConfig.name}
        </h1>
        <p className="text-muted mt-1 text-sm">Workshop admin</p>

        <form action={signIn} className="mt-8 space-y-5">
          {error && (
            // §20 — announced, and linked to nothing in particular because it
            // is a form-level error rather than a field-level one.
            <p
              role="alert"
              className="border-clay text-clay rounded-sm border px-3 py-2 text-sm"
            >
              {error}
            </p>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              autoFocus
              className="border-line-strong bg-paper min-h-11 w-full rounded-sm border px-3"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="border-line-strong bg-paper min-h-11 w-full rounded-sm border px-3"
            />
          </div>

          <Button type="submit" fullWidth size="lg">
            Sign in
          </Button>
        </form>
      </div>
    </main>
  );
}
