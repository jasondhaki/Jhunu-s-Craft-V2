import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Button — plan §7.1.
 *
 * Hierarchy:
 *   primary     solid --jute, white text. The ONE main action on a screen.
 *   secondary   outlined --forest. Alternative actions.
 *   ghost       text, underline on hover. Tertiary.
 *   destructive outlined --clay, fills on hover.
 *   icon        44×44 minimum, aria-label REQUIRED.
 *
 * §2.3: never two primary buttons competing in one view.
 *
 * Required states, all implemented below: default, hover, active, focus-visible,
 * disabled, loading. The focus ring comes from the global `:focus-visible` rule
 * and is never removed (§20, §28).
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'icon';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-medium ' +
  // §2.7 — 150ms micro-feedback
  'transition-colors duration-150 ease-out ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  // Every button is at least a 44px tap target (§7.1, §20)
  'min-h-11';

const variants: Record<Variant, string> = {
  // White on --jute is 4.6:1 — passes AA. --jute is never used AS text (D2).
  primary:
    'bg-jute text-white rounded-md hover:bg-jute-deep active:bg-jute-deep ' +
    'shadow-sm hover:shadow-md',
  secondary:
    'border border-forest text-forest rounded-md bg-transparent ' +
    'hover:bg-forest hover:text-paper active:bg-forest-soft',
  // --jute-deep, not --jute: 4.8:1, safe for small text (D2)
  ghost:
    'text-jute-deep bg-transparent underline-offset-4 hover:underline ' +
    'active:text-hide',
  destructive:
    'border border-clay text-clay rounded-md bg-transparent ' +
    'hover:bg-clay hover:text-white active:bg-clay',
  icon:
    'text-forest rounded-full bg-transparent hover:bg-paper-sunk ' +
    'active:bg-line min-w-11 p-0',
};

const sizes: Record<Size, string> = {
  sm: 'text-sm px-3 py-2',
  md: 'text-base px-5 py-3',
  lg: 'text-md px-7 py-4',
};

/**
 * Shared class builder. Exported so a navigational element can look like a
 * button without being one — a Link inside a button is invalid HTML, and §20
 * requires a real <a href> for navigation and a real <button> for actions.
 */
export function buttonClasses(
  variant: Variant = 'primary',
  size: Size = 'md',
  fullWidth = false,
  className?: string,
): string {
  return cn(
    base,
    variants[variant],
    variant !== 'icon' && sizes[size],
    fullWidth && 'w-full',
    className,
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and blocks input. Prevents the double-submit that
   *  causes duplicate orders (§6.5). */
  loading?: boolean;
  /** Label swapped in while loading — §7.2 keeps verbs consistent
   *  ("Place order" → "Placing order…"). */
  loadingLabel?: string;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingLabel,
      fullWidth = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        // Disabled while loading so a second click can't fire (§6.5)
        disabled={disabled || loading}
        // Announces the busy state to screen readers (§20)
        aria-busy={loading || undefined}
        className={cn(
          base,
          variants[variant],
          variant !== 'icon' && sizes[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading && (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        )}
        {loading && loadingLabel ? loadingLabel : children}
      </button>
    );
  },
);
