'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { MessageType } from '@prisma/client';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/customer-auth';
import { sendEmail } from '@/lib/email/send';
import { siteConfig, real } from '@/lib/site-config';

/**
 * Contact and enquiry submission — plan §6.9, §10.1, §13.4, §13.6.
 *
 * Shared by /contact, /custom-orders, and /wholesale — they are the same
 * message with a different `type`, which is what §11.4's "Messages" screen
 * filters on.
 */

const schema = z.object({
  name: z.string().trim().min(1, 'Please tell us your name.').max(120),
  email: z.string().trim().email("That email address doesn't look right.").max(200),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  subject: z.string().trim().min(1, 'Please add a subject.').max(200),
  message: z
    .string()
    .trim()
    .min(10, 'Please tell us a little more so we can help.')
    .max(5000),
  type: z.nativeEnum(MessageType),
  /**
   * §13.6 asks for bot protection. Turnstile/hCaptcha needs an account, so
   * this is a honeypot in the meantime: a field hidden from people, which
   * only an automated form-filler will complete. It stops naive bots, not
   * determined ones, and is labelled as such rather than overclaimed.
   */
  website: z.string().max(0).optional().or(z.literal('')),
});

export type ContactResult = { ok: true } | { ok: false; error: string };

export async function submitContactAction(
  formData: FormData,
): Promise<ContactResult> {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    subject: formData.get('subject'),
    message: formData.get('message'),
    type: formData.get('type') ?? MessageType.GENERAL,
    website: formData.get('website') ?? '',
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    // The honeypot failing looks like success to a bot, so it does not learn.
    if (issue.path[0] === 'website') return { ok: true };
    return { ok: false, error: issue.message };
  }

  const data = parsed.data;

  // §13.6 — rate limit the contact form so it cannot be used to flood the
  // owner's inbox or the messages table.
  const ip =
    (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limit = rateLimit(`contact:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return {
      ok: false,
      error:
        'You have sent several messages already. Please wait a few minutes, or call us if it is urgent.',
    };
  }

  await db.contactMessage.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      subject: data.subject,
      message: data.message,
      type: data.type,
    },
  });

  // §10.1 — "Contact form received: auto-acknowledgment with expected
  // response time." Sent to the customer, not to us: the owner sees these in
  // the admin Messages screen, and an email to himself would be noise.
  await sendEmail({
    to: data.email,
    subject: `We got your message — ${siteConfig.name}`,
    html: `<p>Thank you — we have your message and will reply within 24 hours.</p>
           <p style="color:#6B6455">You wrote:</p>
           <blockquote style="border-left:3px solid #E2DCCD;margin:0;padding-left:12px;color:#6B6455">${data.message
             .replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/\n/g, '<br>')}</blockquote>
           <p>If it is urgent, call ${real(siteConfig.contact.phoneDisplay)}.</p>`,
    text: `Thank you — we have your message and will reply within 24 hours.

You wrote:
${data.message}

If it is urgent, call ${real(siteConfig.contact.phoneDisplay)}.

${siteConfig.name}`,
  });

  return { ok: true };
}
