'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { AuthResult } from './auth-actions';

/**
 * Shared client wrapper for the account forms — plan §6.7, §20.
 *
 * The forms are plain HTML posting to Server Actions; this adds the loading
 * state, the announced error, and the redirect on success. Every field keeps
 * a real <label> and correct autocomplete attributes (§6.5, §20).
 */

interface Props {
  action: (formData: FormData) => Promise<AuthResult>;
  submitLabel: string;
  loadingLabel: string;
  /** Where to go on success. Omit to show `successMessage` instead. */
  redirectTo?: string;
  successMessage?: string;
  children: React.ReactNode;
}

export function AuthForm({
  action,
  submitLabel,
  loadingLabel,
  redirectTo,
  successMessage,
  children,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await action(formData);

    if (result.ok) {
      if (redirectTo) {
        startTransition(() => {
          router.push(redirectTo);
          router.refresh(); // pick up the new session in the header
        });
      } else {
        setDone(true);
      }
      return;
    }
    setError(result.error);
  }

  if (done && successMessage) {
    return (
      <p
        role="status"
        className="border-leaf text-forest rounded-md border px-4 py-3 text-sm"
      >
        {successMessage}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {error && (
        // §20 — announced immediately, not just coloured red.
        <p
          role="alert"
          className="border-clay text-clay rounded-md border px-4 py-3 text-sm"
        >
          {error}
        </p>
      )}
      {children}
      <Button type="submit" fullWidth size="lg" loading={pending} loadingLabel={loadingLabel}>
        {submitLabel}
      </Button>
    </form>
  );
}

export function AuthField({
  label,
  name,
  type = 'text',
  autoComplete,
  required,
  hint,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
  defaultValue?: string;
}) {
  const reactId = useId();
  const id = `${name}-${reactId}`;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="text-clay"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        defaultValue={defaultValue}
        aria-describedby={hintId}
        className="border-line-strong bg-paper min-h-11 w-full rounded-sm border px-3"
      />
      {hint && (
        <p id={hintId} className="text-muted mt-1.5 text-xs">
          {hint}
        </p>
      )}
    </div>
  );
}
