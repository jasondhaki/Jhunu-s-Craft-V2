import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes so a caller's override wins over a component's
 * default instead of both landing in the class list.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
