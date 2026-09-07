/**
 * Site configuration — the single home for every real-world value.
 *
 * ⚠ PLACEHOLDERS. Anything wrapped in [SQUARE_BRACKETS] is not yet known and
 * is tracked as an open question in CONTEXT.md §5. Filling in the real
 * details is an edit to THIS FILE ONLY — never inline these strings into
 * components, or "fill in the real details" becomes a hunt through the
 * codebase.
 *
 * `PLACEHOLDERS_REMAINING` below is asserted by the pre-launch check, so the
 * site cannot go live still saying [MAKER_NAME].
 */

export const IS_PLACEHOLDER = (value: string): boolean =>
  /^\[[A-Z0-9_]+\]$/.test(value.trim());

export const siteConfig = {
  /** Logo reads "Jhunu's Crafts" (plural) — CONTEXT.md Q2. */
  name: "Jhunu's Crafts",
  nameBn: 'ঝুনুর ক্রাফটস',

  /** §1.3 positioning statement. Rewrite once the maker's name is known. */
  tagline: 'Handmade jute and leather bags from a one-man workshop in Bangladesh.',
  taglineBn: 'বাংলাদেশের এক কারিগরের কর্মশালা থেকে হাতে তৈরি পাট ও চামড়ার ব্যাগ।',

  /** Logo tagline, already set in the mark itself. */
  descriptor: 'Eco-friendly products',
  descriptorBn: 'পরিবেশবান্ধব পণ্য',

  /**
   * The maker. Appears in the §1.3 positioning line, the PDP maker credit
   * (§6.3.13), and the About page (§6.8). CONTEXT.md Q1.
   */
  maker: {
    name: '[MAKER_NAME]',
    nameBn: '[MAKER_NAME_BN]',
    /** §1.4: "He's been making bags for 22 years" — specific, not superlative. */
    yearsOfExperience: '[YEARS_EXPERIENCE]',
    location: '[WORKSHOP_LOCATION]',
    locationBn: '[WORKSHOP_LOCATION_BN]',
  },

  /**
   * §14.1: a real address and a working phone number are the strongest
   * "this is a real business" signals in both markets. §28 lists a missing
   * phone number as fatal in Bangladesh. CONTEXT.md Q3.
   */
  contact: {
    phone: '[PHONE_NUMBER]',
    phoneDisplay: '[PHONE_DISPLAY]',
    whatsapp: '[WHATSAPP_NUMBER]',
    email: '[CONTACT_EMAIL]',
    ordersEmail: '[ORDERS_EMAIL]',
    /** §14.4 — a visible response-time promise. */
    responseTime: 'We reply within 24 hours',
    responseTimeBn: 'আমরা ২৪ ঘণ্টার মধ্যে উত্তর দিই',
  },

  address: {
    line1: '[ADDRESS_LINE_1]',
    line2: '[ADDRESS_LINE_2]',
    city: '[CITY]',
    region: '[DIVISION]',
    postcode: '[POSTCODE]',
    country: 'Bangladesh',
    countryCode: 'BD',
  },

  /**
   * §14.1: an inactive social link is worse than no link. Any entry left as
   * a placeholder is not rendered. CONTEXT.md Q5.
   */
  social: {
    facebook: '[FACEBOOK_URL]',
    instagram: '[INSTAGRAM_URL]',
    pinterest: '[PINTEREST_URL]',
  },

  /** CONTEXT.md Q4. Falls back to the Vercel URL until a domain is bought. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',

  /** §16.1 footer copyright. */
  legal: {
    /** Registered trading name, once registration exists (§15.1). */
    legalName: '[LEGAL_BUSINESS_NAME]',
    tradeLicence: '[TRADE_LICENCE_NUMBER]',
    bin: '[BIN_NUMBER]',
    copyrightYear: 2026,
  },

  /**
   * §3.2 — one message only, dismissible, dismissal stored in localStorage.
   * Shown per market.
   */
  announcement: {
    bd: 'Free delivery inside Dhaka on orders over ৳3,000',
    bdBn: 'ঢাকার ভেতরে ৩,০০০ টাকার বেশি অর্ডারে ডেলিভারি ফ্রি',
    intl: 'We ship worldwide — DHL delivery in 7–14 days',
  },

  /**
   * §9.1 — free-shipping threshold, in minor units. Displayed as a progress
   * bar in the cart, which reliably lifts average order value.
   */
  freeShippingThreshold: {
    BDT: 300_000, // ৳3,000
    USD: 15_000, // $150
  },

  /** §6.3 trust row + §14.4. Stated as fact, never as fake urgency (§14.5). */
  promises: {
    returnWindowDays: 7,
    dispatchDays: '2–4 working days',
    dispatchDaysBn: '২–৪ কর্মদিবস',
  },
} as const;

/**
 * Every placeholder still unfilled, as dotted paths. The pre-launch checklist
 * (§25, "no lorem ipsum anywhere") fails while this is non-empty.
 */
export function placeholdersRemaining(
  node: unknown = siteConfig,
  path: string[] = [],
): string[] {
  if (typeof node === 'string') {
    return IS_PLACEHOLDER(node) ? [path.join('.')] : [];
  }
  if (node && typeof node === 'object') {
    return Object.entries(node).flatMap(([key, value]) =>
      placeholdersRemaining(value, [...path, key]),
    );
  }
  return [];
}

/** Renders a value only when it is real, so no page ever shows [MAKER_NAME]. */
export function real(value: string, fallback = ''): string {
  return IS_PLACEHOLDER(value) ? fallback : value;
}
