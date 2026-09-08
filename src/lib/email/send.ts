import 'server-only';

import { Resend } from 'resend';

/**
 * Transactional email — plan §10.
 *
 * §10.2 requires a transactional provider rather than self-hosted SMTP, a
 * branded HTML template WITH a plain-text fallback for every message, and
 * SPF/DKIM/DMARC on the sending domain — "or your confirmations will land in
 * spam and customers will assume you're a scam."
 *
 * DELIVERABILITY IS NOT DONE YET. Until a real domain exists (CONTEXT.md Q4)
 * and its DNS is configured, Resend will only send from its sandbox sender and
 * only to the account owner's own address. Everything below works today; it
 * simply cannot reach a stranger's inbox until the domain is set up. That is a
 * DNS task, not a code task, and it is tracked as R7.
 *
 * Sending must NEVER break an order. A failed email is logged and swallowed —
 * the customer has paid (or committed to pay), the stock is decremented, and
 * throwing here would turn a delivery problem into a lost order.
 */

const apiKey = process.env.RESEND_API_KEY;

/** Whether email can actually be sent. */
export const emailEnabled = Boolean(apiKey);

const resend = apiKey ? new Resend(apiKey) : null;

const FROM = process.env.EMAIL_FROM ?? "Jhunu's Crafts <onboarding@resend.dev>";
const REPLY_TO = process.env.EMAIL_REPLY_TO;

export interface SendResult {
  sent: boolean;
  id?: string;
  skipped?: 'not_configured';
  error?: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  /** §10.2 — a plain-text fallback for EVERY email, not just some. */
  text: string;
}

/**
 * Sends one message. Never throws.
 *
 * The caller gets a result it can log or surface in the admin panel, but the
 * order flow continues either way.
 */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  if (!resend) {
    // Not an error — it is simply not configured yet. Logging the subject
    // makes local development legible without pretending mail was sent.
    console.info(
      `[email] skipped (RESEND_API_KEY not set) → ${message.to}: ${message.subject}`,
    );
    return { sent: false, skipped: 'not_configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
    });

    if (error) {
      console.error(`[email] provider rejected → ${message.to}:`, error.message);
      return { sent: false, error: error.message };
    }

    return { sent: true, id: data?.id };
  } catch (cause) {
    // A network blip must not take an order down with it.
    const error = cause instanceof Error ? cause.message : String(cause);
    console.error(`[email] send failed → ${message.to}:`, error);
    return { sent: false, error };
  }
}
