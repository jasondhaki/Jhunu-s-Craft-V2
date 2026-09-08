/**
 * Narrow, centred shell for the account forms (§6.7).
 *
 * §6.5 and §28: none of these pages ever blocks a purchase. Checkout works
 * without an account and always will — this route group exists for people who
 * choose to have one.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-sm px-4 py-12 md:py-20">{children}</div>
  );
}
