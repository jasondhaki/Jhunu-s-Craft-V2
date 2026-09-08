import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { whatsappUrl } from '@/lib/site-config';

/**
 * Storefront shell — header, main landmark, footer (§3.2, §3.3).
 *
 * The admin panel (§11) deliberately does NOT use this layout: it is a
 * different application with different chrome, and the customer header has no
 * business appearing there.
 *
 * `#main` is the skip-link target set in the root layout (§20).
 */
export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Null while the number is a placeholder — §14.1: a dead click-to-chat
  // link is a worse trust signal than no button at all.
  const chatHref = whatsappUrl('Hello — I have a question about a bag.');

  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      {chatHref && <WhatsAppButton href={chatHref} />}
    </>
  );
}
