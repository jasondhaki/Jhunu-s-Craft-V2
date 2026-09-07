/**
 * Bilingual content — plan §22.
 *
 * Translatable content is stored as paired columns (`nameEn` / `nameBn`)
 * rather than through a translation layer, which §22 prefers for a small
 * catalog. The Bangla column is nullable on purpose: §22 forbids
 * machine-translated Bangla because it "undermines the handmade
 * authenticity", so Bangla copy is written by a human and arrives later than
 * the English.
 *
 * That means the storefront must handle a half-translated catalog gracefully,
 * which is what this module is for. The rule is: **fall back to English, never
 * render an empty string.** A Bangla page with an English product name is
 * useful; a Bangla page with a blank product name is broken.
 */

export type Locale = 'en' | 'bn';

export const LOCALES: readonly Locale[] = ['en', 'bn'] as const;
export const DEFAULT_LOCALE: Locale = 'en';

/** A pair of columns as they come back from Prisma. */
export interface Translatable {
  en: string;
  bn?: string | null;
}

/**
 * Picks the right language, falling back to English when the Bangla copy
 * has not been written yet.
 */
export function t(pair: Translatable, locale: Locale): string {
  if (locale === 'bn') {
    const bn = pair.bn?.trim();
    if (bn) return bn;
  }
  return pair.en;
}

/**
 * Whether a value is actually being shown in the requested language. Used to
 * set `lang` on the element so a screen reader switches voice correctly, and
 * so the Bangla line-height/size rules in globals.css apply only to real
 * Bangla text (§2.4, §20).
 */
export function isTranslated(pair: Translatable, locale: Locale): boolean {
  return locale === 'en' || Boolean(pair.bn?.trim());
}

/**
 * The `lang` attribute for a rendered value. Returns undefined when it
 * matches the page language, so we don't litter the DOM with redundant
 * attributes.
 */
export function langAttr(
  pair: Translatable,
  locale: Locale,
): 'en' | undefined {
  // Only interesting case: a Bangla page showing untranslated English text.
  return locale === 'bn' && !pair.bn?.trim() ? 'en' : undefined;
}

/**
 * Convenience for the common Prisma shape, e.g.
 * `tr(product, 'name', locale)` reads `nameEn` / `nameBn`.
 */
export function tr<
  K extends string,
  T extends Record<`${K}En`, string> & Partial<Record<`${K}Bn`, string | null>>,
>(row: T, key: K, locale: Locale): string {
  return t(
    {
      en: row[`${key}En` as keyof T] as string,
      bn: row[`${key}Bn` as keyof T] as string | null | undefined,
    },
    locale,
  );
}

/**
 * Note: currency does NOT derive from locale. §8.4 detects the country by IP
 * and persists an overridable choice in a cookie — a Bangladeshi expat may
 * well want English + BDT. Currency selection lives in src/lib/currency.ts.
 */
