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
  tagline: 'Jute and canvas bags, made in our own workshop in Dhaka.',
  /** Needs a human rewrite to match the corrected English (§22, CONTEXT.md Q10). */
  taglineBn: '[TAGLINE_BN]',

  /** Logo tagline, already set in the mark itself. */
  descriptor: 'Eco-friendly products',
  descriptorBn: 'পরিবেশবান্ধব পণ্য',

  /**
   * The maker. Appears in the §1.3 positioning line, the PDP maker credit
   * (§6.3.13), and the About page (§6.8). CONTEXT.md Q1.
   */
  /**
   * The founder — NOT the sole maker.
   *
   * CORRECTION (2026-09-08). The site previously said every bag was made by
   * one person, following the plan's §1.1 assumption. That was wrong: this is
   * a workshop with a team, and James Dilip Dhaki is its founder and head.
   * §14.5 and §1.4 make overstating this a real problem, not a nuance — see
   * CONTEXT.md D9.
   */
  maker: {
    name: 'James Dilip Dhaki',
    /** His own spelling, supplied by the owner — not transliterated (§22). */
    nameBn: 'জেমস দিলিপ ঢাকি',
    /** How to describe him. Founder and head of the workshop, not "the maker". */
    role: 'Founder',
    /**
     * §1.4 wants specific over superlative. Three years is the real number,
     * stated plainly rather than dressed up — §14.5 rules out implying more
     * heritage than exists.
     */
    yearsOfExperience: 3,
    location: 'Monipuripara, Tejgaon, Dhaka',
    /** Supplied by the owner, not transliterated (§22). */
    locationBn: 'মনিপুরিপাড়া, তেজগাঁও, ঢাকা',
  },

  /**
   * The workshop. This is what the positioning actually rests on (see D9):
   * a small team doing skilled work in-house, led by a named founder — not a
   * lone craftsman, and not an anonymous factory either.
   */
  workshop: {
    /** Owner-confirmed range. Written as "10 to 20" rather than a false precise number. */
    teamSizeLabel: '10 to 20 people',
    /** Machines are industrial, and pretending otherwise would be visible in our own photos. */
    equipment: 'industrial sewing machines',
  },

  /**
   * §14.1: a real address and a working phone number are the strongest
   * "this is a real business" signals in both markets. §28 lists a missing
   * phone number as fatal in Bangladesh. CONTEXT.md Q3.
   */
  contact: {
    /** E.164, no spaces — this is what goes in the `tel:` href. */
    phone: '+8801730431932',
    /** Human-readable, for display. */
    phoneDisplay: '+880 1730 431932',
    /**
     * Same number as the phone line, confirmed by the owner. Stored in E.164
     * without the `+`, which is the format wa.me expects — use
     * `whatsappUrl()` below rather than building the link by hand.
     */
    whatsapp: '8801730431932',
    email: '[CONTACT_EMAIL]',
    ordersEmail: '[ORDERS_EMAIL]',
    /** §14.4 — a visible response-time promise. */
    responseTime: 'We reply within 24 hours',
    responseTimeBn: 'আমরা ২৪ ঘণ্টার মধ্যে উত্তর দিই',
  },

  address: {
    line1: 'Monipuripara',
    line2: 'Tejgaon',
    /** District — §22: BD addresses are area/thana → district → division. */
    city: 'Dhaka',
    region: 'Dhaka',
    postcode: '1215',
    country: 'Bangladesh',
    countryCode: 'BD',
    /**
     * The whole address in Bangla, as the owner writes it — including
     * Bengali numerals in the postcode (১২১৫). Kept as one string rather
     * than split into fields, because Bangla address order and punctuation
     * are the owner's to decide, not ours to reassemble (§22).
     */
    fullBn: 'মনিপুরিপাড়া, তেজগাঁও, ঢাকা - ১২১৫',
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

  /**
   * Canonical origin, no trailing slash (§17.1). CONTEXT.md Q4.
   *
   * Resolution order:
   *  1. NEXT_PUBLIC_SITE_URL — set this once a real domain exists. It is the
   *     only one of the three that is stable, so canonical tags, sitemap
   *     entries, and email links should all end up pointing at it.
   *  2. VERCEL_PROJECT_PRODUCTION_URL — the project's stable production
   *     hostname on Vercel. Correct for production deploys before a domain
   *     is bought.
   *  3. localhost, for local development.
   *
   * Deliberately NOT using VERCEL_URL: that is the per-deployment hostname
   * and changes on every push, which would emit a different canonical URL
   * for every deploy.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000'),

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

/**
 * Click-to-chat URL for WhatsApp (§14.1 — "huge in Bangladesh, increasingly
 * normal internationally").
 *
 * wa.me expects the number in E.164 with no `+`, spaces, or dashes; anything
 * else silently produces a dead link. Returns null when the number is still a
 * placeholder, so callers omit the button entirely rather than rendering one
 * that goes nowhere — §14.1 is explicit that a dead link is worse than none.
 *
 * `text` pre-fills the customer's first message, which measurably raises the
 * chance they actually send it.
 */
export function whatsappUrl(text?: string): string | null {
  const number = siteConfig.contact.whatsapp;
  if (IS_PLACEHOLDER(number)) return null;

  const digits = number.replace(/\D/g, '');
  if (!digits) return null;

  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${query}`;
}
