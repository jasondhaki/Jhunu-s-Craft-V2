import type { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { MessageType } from '@prisma/client';
import { ProsePage } from '@/components/prose-page';
import { ContactForm } from '@/components/contact-form';
import { LocalBusinessSchema } from '@/components/structured-data';
import { WhatsAppIcon } from '@/components/ui/social-icons';
import { siteConfig, real, whatsappUrl } from '@/lib/site-config';

/**
 * Contact — plan §6.9 and §14.1.
 *
 * "Form + phone + WhatsApp link + email + physical address + an embedded map
 * + response-time expectation."
 *
 * §14.1: a real address and a phone number that someone actually answers are
 * the strongest "this is a real business" signals in both markets, so they
 * come BEFORE the form rather than after it. Someone who wants to phone
 * should not have to scroll past a contact form to find the number.
 *
 * The map is deliberately not embedded: an iframe from Google Maps sets
 * third-party cookies before any consent, which §13.8 forbids. A link out is
 * honest and costs nothing.
 */

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Call, message on WhatsApp, or send us a note. A real person answers, and we reply within 24 hours.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  const phone = real(siteConfig.contact.phoneDisplay);
  const email = real(siteConfig.contact.email);
  const chat = whatsappUrl('Hello — I have a question.');
  const addressLine = [
    real(siteConfig.address.line1),
    real(siteConfig.address.line2),
    real(siteConfig.address.city),
  ]
    .filter(Boolean)
    .join(', ');

  const mapQuery = encodeURIComponent(
    `${addressLine} ${real(siteConfig.address.postcode)} Bangladesh`,
  );

  return (
    <>
      <ProsePage
        title="Contact us"
        intro="A small workshop, so you will be talking to someone who actually makes the bags."
        crumbs={[{ label: 'Contact' }]}
      >
        {/* Real contact details first (§14.1) */}
        <div className="border-line grid gap-4 rounded-md border p-5 sm:grid-cols-2">
          {phone && (
            <p className="flex items-start gap-3 text-sm">
              <Phone className="text-jute-deep mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                <span className="text-muted block text-xs">Call us</span>
                <a
                  href={`tel:${siteConfig.contact.phone}`}
                  className="text-jute-deep underline underline-offset-4"
                >
                  {phone}
                </a>
              </span>
            </p>
          )}

          {chat && (
            <p className="flex items-start gap-3 text-sm">
              <WhatsAppIcon className="text-jute-deep mt-0.5 size-4 shrink-0" />
              <span>
                <span className="text-muted block text-xs">WhatsApp</span>
                <a
                  href={chat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-jute-deep underline underline-offset-4"
                >
                  Message us
                </a>
              </span>
            </p>
          )}

          {email && (
            <p className="flex items-start gap-3 text-sm">
              <Mail className="text-jute-deep mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                <span className="text-muted block text-xs">Email</span>
                <a
                  href={`mailto:${email}`}
                  className="text-jute-deep underline underline-offset-4"
                >
                  {email}
                </a>
              </span>
            </p>
          )}

          <p className="flex items-start gap-3 text-sm">
            <Clock className="text-jute-deep mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              <span className="text-muted block text-xs">Response time</span>
              {siteConfig.contact.responseTime}
            </span>
          </p>

          {addressLine && (
            <p className="flex items-start gap-3 text-sm sm:col-span-2">
              <MapPin className="text-jute-deep mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                <span className="text-muted block text-xs">The workshop</span>
                <address className="not-italic">
                  {addressLine} - {real(siteConfig.address.postcode)}
                  <br />
                  {siteConfig.address.country}
                  {/* Bangla, as the owner writes it (§22) */}
                  <span lang="bn" className="text-muted mt-1 block">
                    {siteConfig.address.fullBn}
                  </span>
                </address>
                {/* A link rather than an embedded map: a Google Maps iframe
                    sets third-party cookies before consent (§13.8). */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-jute-deep mt-1 inline-block underline underline-offset-4"
                >
                  Open in maps
                </a>
                <span className="text-muted mt-2 block text-xs">
                  It is a working space rather than a shop, so please call
                  before visiting and we will arrange a time.
                </span>
              </span>
            </p>
          )}
        </div>

        <section className="pt-6">
          <h2 className="font-display mb-4 text-lg font-semibold">
            Or send us a message
          </h2>
          <ContactForm
            type={MessageType.GENERAL}
            submitLabel="Send message"
            successHeading="Message sent"
            messageHint="If it is about an order, include the order number and we can answer straight away."
          />
        </section>
      </ProsePage>

      {/* §17.2 — LocalBusiness, only because there is a real address. */}
      <LocalBusinessSchema />
    </>
  );
}
