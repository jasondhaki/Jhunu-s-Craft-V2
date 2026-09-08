'use client';

import { useId, useState } from 'react';
import type { MessageType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { submitContactAction } from '@/app/(storefront)/contact/actions';

/**
 * Contact / enquiry form — plan §6.9, §7.2, §20.
 *
 * Used by /contact, /custom-orders, and /wholesale. §7.2 requires the button
 * verb to match the confirmation, so the label is passed in: "Send message" →
 * "Message sent", "Send enquiry" → "Enquiry sent".
 */

interface Props {
  type: MessageType;
  submitLabel: string;
  successHeading: string;
  /** Pre-fills the subject so the owner can triage at a glance. */
  defaultSubject?: string;
  /** Extra guidance above the message box, per enquiry type. */
  messageHint?: string;
}

export function ContactForm({
  type,
  submitLabel,
  successHeading,
  defaultSubject,
  messageHint,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const uid = useId();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setError(null);
    setPending(true);

    const result = await submitContactAction(new FormData(event.currentTarget));

    setPending(false);
    if (result.ok) setSent(true);
    else setError(result.error);
  }

  if (sent) {
    return (
      <div
        role="status"
        className="border-leaf rounded-md border px-5 py-6"
      >
        <p className="font-display text-md font-semibold">{successHeading}</p>
        <p className="text-forest-soft mt-2 text-sm">
          We reply within 24 hours. If it is urgent, please call rather than
          wait — a real person answers.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <input type="hidden" name="type" value={type} />

      {error && (
        <p
          role="alert"
          className="border-clay text-clay rounded-md border px-4 py-3 text-sm"
        >
          {error}
        </p>
      )}

      <Field id={`${uid}-name`} label="Your name" name="name" autoComplete="name" required />
      <Field
        id={`${uid}-email`}
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Field
        id={`${uid}-phone`}
        label="Phone (optional)"
        name="phone"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        hint="Quicker than email if we need to ask something."
      />
      <Field
        id={`${uid}-subject`}
        label="Subject"
        name="subject"
        defaultValue={defaultSubject}
        required
      />

      <div>
        <label htmlFor={`${uid}-message`} className="mb-1.5 block text-sm font-medium">
          Message <span className="text-clay">*</span>
        </label>
        <textarea
          id={`${uid}-message`}
          name="message"
          rows={6}
          required
          aria-describedby={messageHint ? `${uid}-message-hint` : undefined}
          className="border-line-strong bg-paper w-full rounded-sm border px-3 py-2"
        />
        {messageHint && (
          <p id={`${uid}-message-hint`} className="text-muted mt-1.5 text-xs">
            {messageHint}
          </p>
        )}
      </div>

      {/*
        Honeypot (§13.6). Hidden from people via inert styling rather than
        `display:none`, which some bots detect; `tabIndex={-1}` and
        `aria-hidden` keep it out of the keyboard order and away from screen
        readers, so it never traps a real user.
      */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`${uid}-website`}>Leave this field empty</label>
        <input
          id={`${uid}-website`}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <Button type="submit" size="lg" loading={pending} loadingLabel="Sending…">
        {submitLabel}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  name,
  hint,
  ...props
}: {
  id: string;
  label: string;
  name: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {props.required && <span className="text-clay"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="border-line-strong bg-paper min-h-11 w-full rounded-sm border px-3"
        {...props}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-muted mt-1.5 text-xs">
          {hint}
        </p>
      )}
    </div>
  );
}
