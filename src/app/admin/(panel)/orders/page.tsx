import { requireAdmin } from '@/lib/admin-auth';

/**
 * Orders — plan §11.2 / §11.4.
 *
 * Deliberately a stub. Orders do not exist until checkout is built (Phase 2),
 * so a full order-management screen would be untestable scaffolding. The route
 * exists so the navigation is never broken, and it says plainly what is
 * missing rather than showing an empty table that looks like a bug.
 */
export const metadata = { title: 'Orders' };

export default async function AdminOrdersPage() {
  await requireAdmin();

  return (
    <div>
      <h1 className="font-display text-xl font-semibold">Orders</h1>
      <p className="border-line text-muted mt-6 rounded-md border border-dashed px-4 py-8 text-sm">
        Not built yet — this arrives with checkout in Phase 2 of the §27
        roadmap. Nothing is lost meanwhile: there is nowhere for orders to come
        from until customers can place them.
      </p>
    </div>
  );
}
