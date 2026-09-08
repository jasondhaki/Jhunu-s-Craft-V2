import 'server-only';

import type { Order, OrderItem } from '@prisma/client';
import { formatMoney, type Currency } from '@/lib/money';
import { siteConfig } from '@/lib/site-config';
import type { EmailMessage } from './send';

/**
 * Email templates — plan §10.
 *
 * §10.2 requirements applied to every template here:
 *  - Branded HTML **and** a plain-text fallback.
 *  - Readable at 320px and in dark mode.
 *  - No unsubscribe link in transactional mail ("never in transactional ones").
 *
 * Written as inline-styled tables because that is what email clients actually
 * render. Outlook does not do flexbox, grid, or external stylesheets, and
 * Gmail strips <style> blocks in some contexts. This is deliberately not how
 * the website is built.
 */

// Palette from §2.2 Option D, inlined — CSS variables do not exist in email.
const FOREST = '#14401F';
const PAPER = '#FAF8F3';
const JUTE_DEEP = '#8C5524';
const MUTED = '#6B6455';
const LINE = '#E2DCCD';

/** Escapes untrusted values before they enter the HTML body (§13.4). */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Shared shell for every message.
 *
 * Note there is deliberately no opt-out link in this footer: §10.2 requires
 * one in marketing email and forbids it in transactional email, and everything
 * built from this layout is transactional. A newsletter template, when it
 * exists, will need its own footer with one.
 */
function layout(params: {
  preheader: string;
  heading: string;
  body: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(params.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};color:${FOREST};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- Preheader: the grey preview line next to the subject. Hidden in the
       body itself, which is why it is clipped rather than display:none —
       some clients ignore display:none here. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(params.preheader)}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <tr>
            <td style="background:${FOREST};padding:24px;border-radius:8px 8px 0 0;">
              <div style="color:${PAPER};font-size:18px;font-weight:600;">${esc(siteConfig.name)}</div>
              <div style="color:rgba(250,248,243,.7);font-size:12px;margin-top:2px;">${esc(siteConfig.descriptor)}</div>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;padding:28px 24px;border:1px solid ${LINE};border-top:0;border-radius:0 0 8px 8px;">
              <h1 style="margin:0 0 16px;font-size:20px;line-height:1.4;color:${FOREST};">${esc(params.heading)}</h1>
              ${params.body}
            </td>
          </tr>

          <tr>
            <td style="padding:20px 24px;color:${MUTED};font-size:12px;line-height:1.6;">
              <p style="margin:0 0 8px;">
                Questions? Call <a href="tel:${esc(siteConfig.contact.phone)}" style="color:${JUTE_DEEP};">${esc(siteConfig.contact.phoneDisplay)}</a>.
              </p>
              <p style="margin:0;">
                ${esc(siteConfig.address.line1)}, ${esc(siteConfig.address.line2)}, ${esc(siteConfig.address.city)} - ${esc(siteConfig.address.postcode)}, ${esc(siteConfig.address.country)}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

type OrderWithItems = Order & { items: OrderItem[] };

function itemRowsHtml(order: OrderWithItems): string {
  return order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid ${LINE};font-size:14px;">
          ${esc(item.productNameSnapshot)}<br>
          <span style="color:${MUTED};font-size:12px;">${esc(item.variantLabelSnapshot)} &middot; ${esc(item.skuSnapshot)}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid ${LINE};font-size:14px;text-align:center;white-space:nowrap;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid ${LINE};font-size:14px;text-align:right;white-space:nowrap;">${esc(
          formatMoney(item.lineTotal, order.currency as Currency),
        )}</td>
      </tr>`,
    )
    .join('');
}

function addressText(address: Record<string, string | null>): string {
  return [
    address.recipientName,
    address.line1,
    address.line2,
    [address.area, address.city, address.region].filter(Boolean).join(', '),
    address.postcode,
    address.country,
    address.phone,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Order confirmation — §10.1 "Order placed".
 *
 * §14.4: "Confirmation email within seconds of ordering." This is one of the
 * highest-value trust signals on the whole site.
 */
export function orderConfirmationEmail(order: OrderWithItems): EmailMessage {
  const currency = order.currency as Currency;
  const address = order.shippingAddress as Record<string, string | null>;
  const trackUrl = `${siteConfig.url}/track-order?order=${encodeURIComponent(order.orderNumber)}&token=${encodeURIComponent(order.publicToken)}`;

  const isCod = order.paymentMethod === 'COD';
  const payLine = isCod
    ? `Please have ${formatMoney(order.grandTotal, currency)} in cash ready for the courier.`
    : 'Your payment has been received.';

  const body = `
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
      Thank you — we have your order. ${esc(payLine)}
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:${PAPER};border-radius:6px;">
      <tr><td style="padding:14px 16px;">
        <div style="color:${MUTED};font-size:12px;">Order number</div>
        <div style="font-size:18px;font-weight:600;letter-spacing:.02em;">${esc(order.orderNumber)}</div>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <th align="left" style="padding-bottom:6px;font-size:12px;color:${MUTED};font-weight:600;">Item</th>
        <th align="center" style="padding-bottom:6px;font-size:12px;color:${MUTED};font-weight:600;">Qty</th>
        <th align="right" style="padding-bottom:6px;font-size:12px;color:${MUTED};font-weight:600;">Total</th>
      </tr>
      ${itemRowsHtml(order)}
      <tr>
        <td colspan="2" style="padding:10px 0 0;font-size:14px;">Subtotal</td>
        <td style="padding:10px 0 0;font-size:14px;text-align:right;">${esc(formatMoney(order.subtotal, currency))}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:4px 0;font-size:14px;">Delivery — ${esc(order.shippingMethod)}</td>
        <td style="padding:4px 0;font-size:14px;text-align:right;">${
          order.shippingTotal === 0 ? 'Free' : esc(formatMoney(order.shippingTotal, currency))
        }</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:10px 0 0;font-size:16px;font-weight:600;border-top:2px solid ${FOREST};">Total</td>
        <td style="padding:10px 0 0;font-size:16px;font-weight:600;text-align:right;border-top:2px solid ${FOREST};">${esc(
          formatMoney(order.grandTotal, currency),
        )}</td>
      </tr>
    </table>

    <h2 style="margin:28px 0 8px;font-size:15px;">Delivering to</h2>
    <p style="margin:0;font-size:14px;line-height:1.6;color:${MUTED};">
      ${esc(addressText(address)).replace(/\n/g, '<br>')}
    </p>

    <h2 style="margin:28px 0 8px;font-size:15px;">What happens next</h2>
    <ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.7;color:${MUTED};">
      <li>We confirm your order, usually within a few hours.</li>
      <li>Your bag is prepared and dispatched in ${esc(siteConfig.promises.dispatchDays)}.</li>
      <li>The courier calls you before delivering.</li>
    </ol>

    <p style="margin:28px 0 0;">
      <a href="${esc(trackUrl)}" style="display:inline-block;background:${JUTE_DEEP};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:4px;font-size:14px;font-weight:500;">Track your order</a>
    </p>

    <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:${MUTED};">
      Every bag is made by hand, so small differences in weave, grain, and tone
      are normal and are not faults. If anything is genuinely wrong, reply to
      this email and we will put it right.
    </p>`;

  // §10.2 — plain-text fallback, not an afterthought.
  const text = `Thank you — we have your order.

Order number: ${order.orderNumber}

${order.items
  .map(
    (i) =>
      `  ${i.quantity} x ${i.productNameSnapshot} (${i.variantLabelSnapshot}) — ${formatMoney(i.lineTotal, currency)}`,
  )
  .join('\n')}

Subtotal: ${formatMoney(order.subtotal, currency)}
Delivery (${order.shippingMethod}): ${order.shippingTotal === 0 ? 'Free' : formatMoney(order.shippingTotal, currency)}
Total: ${formatMoney(order.grandTotal, currency)}

${payLine}

Delivering to:
${addressText(address)}

What happens next:
  1. We confirm your order, usually within a few hours.
  2. Your bag is prepared and dispatched in ${siteConfig.promises.dispatchDays}.
  3. The courier calls you before delivering.

Track your order: ${trackUrl}

Every bag is made by hand, so small differences in weave, grain, and tone are
normal and are not faults. If anything is genuinely wrong, reply to this email
and we will put it right.

${siteConfig.name}
${siteConfig.contact.phoneDisplay}
${siteConfig.address.line1}, ${siteConfig.address.line2}, ${siteConfig.address.city} - ${siteConfig.address.postcode}, ${siteConfig.address.country}`;

  return {
    to: order.email,
    subject: `Order ${order.orderNumber} confirmed — ${siteConfig.name}`,
    html: layout({
      preheader: `Your order ${order.orderNumber} is confirmed. ${payLine}`,
      heading: 'Order placed',
      body,
    }),
    text,
  };
}

/**
 * Shipped, with tracking — §10.1.
 *
 * §14.4: proactive updates prevent chargebacks. This is the email customers
 * most want to receive.
 */
export function orderShippedEmail(order: OrderWithItems): EmailMessage {
  const trackUrl = `${siteConfig.url}/track-order?order=${encodeURIComponent(order.orderNumber)}&token=${encodeURIComponent(order.publicToken)}`;

  const courierLine = order.courierName
    ? `Sent with ${order.courierName}.`
    : 'It is on its way.';
  const trackingLine = order.trackingNumber
    ? `Tracking number: ${order.trackingNumber}`
    : '';

  const body = `
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
      Your order <strong>${esc(order.orderNumber)}</strong> has been dispatched. ${esc(courierLine)}
    </p>
    ${
      trackingLine
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:${PAPER};border-radius:6px;">
             <tr><td style="padding:14px 16px;font-size:15px;font-weight:600;">${esc(trackingLine)}</td></tr>
           </table>`
        : ''
    }
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${MUTED};">
      The courier will call you before delivering, so please keep your phone to hand.
    </p>
    <p style="margin:0;">
      <a href="${esc(order.trackingUrl ?? trackUrl)}" style="display:inline-block;background:${JUTE_DEEP};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:4px;font-size:14px;font-weight:500;">Track your order</a>
    </p>`;

  const text = `Your order ${order.orderNumber} has been dispatched. ${courierLine}

${trackingLine}

The courier will call you before delivering, so please keep your phone to hand.

Track your order: ${order.trackingUrl ?? trackUrl}

${siteConfig.name}
${siteConfig.contact.phoneDisplay}`;

  return {
    to: order.email,
    subject: `Order ${order.orderNumber} is on its way — ${siteConfig.name}`,
    html: layout({
      preheader: `${order.orderNumber} has been dispatched. ${courierLine}`,
      heading: 'On its way',
      body,
    }),
    text,
  };
}

/**
 * Order cancelled — §10.1. States the reason and the refund timeline, because
 * silence after a cancellation is what turns into a dispute.
 */
export function orderCancelledEmail(
  order: OrderWithItems,
  reason?: string | null,
): EmailMessage {
  const wasPaid = order.paymentStatus === 'PAID';
  const refundLine = wasPaid
    ? 'Your refund has been started and normally reaches your account within 5–10 working days.'
    : 'Nothing was charged, so there is nothing to refund.';

  const body = `
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
      Your order <strong>${esc(order.orderNumber)}</strong> has been cancelled.
    </p>
    ${reason ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${MUTED};">${esc(reason)}</p>` : ''}
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">${esc(refundLine)}</p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:${MUTED};">
      If this was not what you expected, reply to this email or call us — we would rather sort it out than lose you.
    </p>`;

  const text = `Your order ${order.orderNumber} has been cancelled.

${reason ? reason + '\n\n' : ''}${refundLine}

If this was not what you expected, reply to this email or call ${siteConfig.contact.phoneDisplay}.

${siteConfig.name}`;

  return {
    to: order.email,
    subject: `Order ${order.orderNumber} cancelled — ${siteConfig.name}`,
    html: layout({
      preheader: `${order.orderNumber} has been cancelled. ${refundLine}`,
      heading: 'Order cancelled',
      body,
    }),
    text,
  };
}

/**
 * Email verification — §10.1 "Account created: welcome + verify email".
 * Link expires in 24 hours.
 */
export function verifyEmailEmail(params: {
  to: string;
  firstName: string | null;
  token: string;
}): EmailMessage {
  const url = `${siteConfig.url}/verify-email/${encodeURIComponent(params.token)}`;
  const greeting = params.firstName ? `Hello ${params.firstName},` : 'Hello,';

  const body = `
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">${esc(greeting)}</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;">
      Please confirm this email address so we can send you order updates.
      This link works for 24 hours.
    </p>
    <p style="margin:0 0 20px;">
      <a href="${esc(url)}" style="display:inline-block;background:${JUTE_DEEP};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:4px;font-size:14px;font-weight:500;">Confirm my email</a>
    </p>
    <p style="margin:0;font-size:13px;line-height:1.6;color:${MUTED};">
      If you did not create an account, you can ignore this email — nothing will happen.
    </p>`;

  const text = `${greeting}

Please confirm this email address so we can send you order updates.
This link works for 24 hours.

${url}

If you did not create an account, you can ignore this email — nothing will happen.

${siteConfig.name}`;

  return {
    to: params.to,
    subject: `Confirm your email — ${siteConfig.name}`,
    html: layout({
      preheader: 'Confirm your email address so we can send you order updates.',
      heading: 'Confirm your email',
      body,
    }),
    text,
  };
}

/**
 * Password reset — §10.1. Expires in 1 hour, single use (§13.2).
 */
export function passwordResetEmail(params: {
  to: string;
  token: string;
}): EmailMessage {
  const url = `${siteConfig.url}/reset-password/${encodeURIComponent(params.token)}`;

  const body = `
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;">
      Someone asked to reset the password for this account. If that was you,
      use the button below. The link works once and expires in one hour.
    </p>
    <p style="margin:0 0 20px;">
      <a href="${esc(url)}" style="display:inline-block;background:${JUTE_DEEP};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:4px;font-size:14px;font-weight:500;">Set a new password</a>
    </p>
    <p style="margin:0;font-size:13px;line-height:1.6;color:${MUTED};">
      If it was not you, ignore this email — your password has not changed and
      nobody can use this link without your inbox.
    </p>`;

  const text = `Someone asked to reset the password for this account.

If that was you, open the link below. It works once and expires in one hour.

${url}

If it was not you, ignore this email — your password has not changed.

${siteConfig.name}`;

  return {
    to: params.to,
    subject: `Reset your password — ${siteConfig.name}`,
    html: layout({
      preheader: 'A link to set a new password. It expires in one hour.',
      heading: 'Reset your password',
      body,
    }),
    text,
  };
}

/**
 * Password changed — §10.1 "Password changed: security notification".
 *
 * Sent AFTER the fact, so someone whose account was taken over finds out.
 */
export function passwordChangedEmail(params: { to: string }): EmailMessage {
  const body = `
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
      The password for your account was just changed, and you have been signed
      out everywhere else.
    </p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:${MUTED};">
      If this was not you, call us on
      <a href="tel:${esc(siteConfig.contact.phone)}" style="color:${JUTE_DEEP};">${esc(siteConfig.contact.phoneDisplay)}</a>
      straight away.
    </p>`;

  const text = `The password for your account was just changed, and you have been
signed out everywhere else.

If this was not you, call us on ${siteConfig.contact.phoneDisplay} straight away.

${siteConfig.name}`;

  return {
    to: params.to,
    subject: `Your password was changed — ${siteConfig.name}`,
    html: layout({
      preheader: 'Your password was changed. If this was not you, contact us.',
      heading: 'Password changed',
      body,
    }),
    text,
  };
}
