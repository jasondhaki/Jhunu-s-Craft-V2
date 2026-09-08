import { siteConfig } from '@/lib/site-config';

/**
 * FAQ content — plan §6.9.
 *
 * "Accordion, grouped: Ordering · Payment · Shipping · Returns · Product care
 * · Custom orders. Write 20–30 real questions, INCLUDING THE AWKWARD ONES
 * ('Is the leather genuine?' 'Why is jute cheaper than leather?' 'Do you ship
 * to the USA?')."
 *
 * Answers describe what the site actually does today. Where something is not
 * yet available — online card payment, for instance — it says so plainly
 * rather than being omitted, because a customer who discovers it at checkout
 * is a customer who leaves (§7.3, §14.4).
 *
 * These feed both the page and its FAQPage structured data (§17.2), from one
 * source, so the two cannot drift apart.
 */

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqGroup {
  heading: string;
  items: FaqItem[];
}

const RETURN_DAYS = siteConfig.promises.returnWindowDays;
const DISPATCH = siteConfig.promises.dispatchDays;
const MAKER = siteConfig.maker.name;

export const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: 'Ordering',
    items: [
      {
        question: 'Do I need an account to order?',
        answer:
          'No. Checkout works as a guest and always will. You can create an account afterwards if you want your order history and addresses saved, but nothing is hidden behind it.',
      },
      {
        question: 'How do I know my order went through?',
        answer:
          'You will see a confirmation page with your order number straight away, and a confirmation email within a few minutes. If neither appears, call us before ordering again so we can check rather than risk a duplicate.',
      },
      {
        question: 'Can I change or cancel my order?',
        answer: `Yes, if it has not shipped yet. Call ${siteConfig.contact.phoneDisplay} with your order number. Once a parcel is with the courier we cannot recall it, but you can still return it.`,
      },
      {
        question: 'Why do some bags say "made to order"?',
        answer:
          'Some pieces are built when you order rather than kept on a shelf — usually the ones with hand-fitted hardware or a lot of hand-stitching. The product page shows how many days that takes before dispatch.',
      },
      {
        question: 'The bag I want is sold out. Will it come back?',
        answer:
          'Usually, but not on a fixed schedule — our own designs are made in small runs between bulk orders. Call or message us and we can tell you roughly when the next run is, or make one for you.',
      },
    ],
  },
  {
    heading: 'Payment',
    items: [
      {
        question: 'What payment methods can I use?',
        answer:
          'Cash on delivery, anywhere in Bangladesh. Card, bKash and Nagad are not switched on yet — we are still setting up the payment gateway. If you would rather pay another way, call us and we will arrange it.',
      },
      {
        question: 'Is there a fee for cash on delivery?',
        answer:
          'No. You pay the amount shown at checkout, in cash, when the courier hands over your bag.',
      },
      {
        question: 'Is there a limit on cash on delivery?',
        answer:
          'Yes — up to ৳15,000 per order. Above that we need to arrange payment another way, because a refused high-value parcel costs us the courier fee both ways plus the tied-up stock. Call us and we will sort it out.',
      },
      {
        question: 'Can I pay from outside Bangladesh?',
        answer:
          'Not through the website yet. International payment from a Bangladeshi business is genuinely complicated and we would rather get it right than take money we cannot properly settle. Email or message us and we will arrange it directly.',
      },
      {
        question: 'Do you store my card details?',
        answer:
          'We never see them at all. When card payment goes live it will run through the gateway’s own hosted page, so card numbers never touch our servers.',
      },
    ],
  },
  {
    heading: 'Shipping',
    items: [
      {
        question: 'How long does delivery take?',
        answer: `We dispatch in ${DISPATCH}. After that it is 1–2 days inside Dhaka, 2–5 days elsewhere in Bangladesh, and 7–14 days internationally by DHL.`,
      },
      {
        question: 'How much is delivery?',
        answer:
          '৳60 inside Dhaka, ৳90 in the Dhaka suburbs, ৳130 elsewhere in Bangladesh. Delivery is free inside Dhaka on orders over ৳3,000. International rates depend on the destination and are shown at checkout before you pay.',
      },
      {
        question: 'Do you ship to the USA, UK, or Europe?',
        answer:
          'Yes, by DHL, typically 7–14 days. The exact cost is shown at checkout as soon as you pick a country — you will never reach the payment step and find a surprise.',
      },
      {
        question: 'Will I have to pay customs or import duty?',
        answer:
          'Possibly, on international orders. Import duties and taxes are not included in the price and are the responsibility of the customer. What you pay depends on your country’s rules, not ours. We declare the real value on the customs form — under-declaring voids the insurance and is not something we will do.',
      },
      {
        question: 'Can I track my order?',
        answer:
          'Yes, and you do not need an account. Use the "Track your order" page with your order number and the email or phone you ordered with. Once it ships you will also get the courier tracking number by email.',
      },
      {
        question: 'What if nobody is home?',
        answer:
          'The courier calls before delivering, which is why we ask for a phone number you actually answer. If they cannot reach you they will normally try again the next day.',
      },
    ],
  },
  {
    heading: 'Returns',
    items: [
      {
        question: 'What is your return policy?',
        answer: `You have ${RETURN_DAYS} days from delivery to return anything unused and in its original packaging, for any reason. Tell us within that window and we will explain how to send it back.`,
      },
      {
        question: 'Who pays for return postage?',
        answer:
          'If the bag is faulty, wrong, or damaged, we do — always. If you have simply changed your mind, return postage is yours.',
      },
      {
        question: 'How long does a refund take?',
        answer:
          'Five to ten working days after the bag reaches us and we have checked it. For a cash-on-delivery order we will arrange the refund with you directly.',
      },
      {
        question: 'My bag looks slightly different from the photograph. Can I return it?',
        answer:
          'Please read this one before you order. Every bag is cut and stitched by hand from natural materials, so weave, grain, and tone vary between one bag and the next. That variation is not a fault and is not grounds for a return on its own — it is what handmade means. If something is genuinely wrong, though, tell us and we will put it right.',
      },
      {
        question: 'What cannot be returned?',
        answer:
          'Custom and monogrammed pieces, because they cannot be resold. Everything else can, within the return window, provided it is unused.',
      },
    ],
  },
  {
    heading: 'Materials and care',
    items: [
      {
        question: 'Is the leather genuine?',
        answer:
          'Yes — full-grain buffalo leather, 1.4 mm, vegetable tanned. Full-grain means the outer surface of the hide is left intact rather than sanded smooth and embossed with a fake texture, which is what most "genuine leather" labels actually describe. You can see the difference at the cut edges.',
      },
      {
        question: 'Why is jute so much cheaper than leather?',
        answer:
          'Because the material costs a fraction as much and takes less time to work. A jute bag is not a lesser bag — it is lighter, it is grown here, and for carrying shopping it is genuinely better. Leather costs more because the hide costs more and every edge has to be skived, stitched, and burnished by hand.',
      },
      {
        question: 'Will the leather change colour?',
        answer:
          'Yes, and it is meant to. Vegetable-tanned leather darkens over the first year with use and light. A scuff on our drum-dyed pieces shows the same colour underneath rather than a pale scar.',
      },
      {
        question: 'How do I look after a jute bag in the monsoon?',
        answer:
          'Dry it in the shade, never in direct sun, and never put it away damp — jute will grow mould in humid weather. Store it somewhere airy with the flap open, stuffed with paper to hold its shape. Spot-clean with a barely damp cloth; do not soak or machine wash it.',
      },
      {
        question: 'Is jute actually eco-friendly, or is that marketing?',
        answer:
          'It is a real advantage, and worth being precise about. Jute grows fast without much irrigation or pesticide, most of the world’s supply is grown here in Bangladesh, and it biodegrades completely. The leather and the brass hardware on our mixed pieces do not, so a jute-only bag is the more sustainable choice of the two.',
      },
      {
        question: 'How long should a bag last?',
        answer:
          'A leather bag, cared for, should outlast several cheaper ones — the stitching is the part that usually fails first, and ours is double-stitched at every stress point. Jute has a shorter life by nature, especially if it gets wet often.',
      },
    ],
  },
  {
    heading: 'Custom orders and wholesale',
    items: [
      {
        question: 'Can I have a bag made to my own specification?',
        answer: `Sometimes, yes — size, colour, strap length, and monograms are usually possible. Send us the details and ${MAKER.startsWith('[') ? 'the maker' : MAKER} will tell you whether it can be done and what it would cost. Custom pieces are not returnable, so we agree everything before starting.`,
      },
      {
        question: 'Do you sell wholesale to shops?',
        answer:
          'Yes — bulk work is most of what the workshop does. We make promotional totes, school bags, and branded bags for companies, schools, and development organisations, including Swisscontact and B-SETS. Tell us quantities and a deadline and we will give you a straight answer.',
      },
      {
        question: 'Can you make a large matching order for an event?',
        answer:
          'Possibly, with enough notice. Tell us how many, by when, and we will say honestly whether it is realistic.',
      },
    ],
  },
  {
    heading: 'About us',
    items: [
      {
        question: 'Who actually makes these bags?',
        answer: MAKER.startsWith('[')
          ? 'One maker, by hand, in a small workshop in Dhaka. Nothing is outsourced and nothing is mass-produced.'
          : `${MAKER}, by hand, in a small workshop in ${siteConfig.maker.location}. Nothing is outsourced and nothing is mass-produced, which is why stock is limited.`,
      },
      {
        question: 'Is this a real business or a reseller?',
        answer: `Real, and small. The address and phone number in the footer are ours — call them. The bags are made here, not bought in and relabelled.`,
      },
      {
        question: 'Can I visit the workshop?',
        answer:
          'It is a working space rather than a shop, so please call first rather than turning up. We are happy to arrange a time.',
      },
    ],
  },
];

/** Flattened, for the FAQPage structured data (§17.2). */
export const FAQ_ITEMS: FaqItem[] = FAQ_GROUPS.flatMap((group) => group.items);
