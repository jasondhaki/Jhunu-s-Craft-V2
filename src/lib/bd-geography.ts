/**
 * Bangladesh divisions and districts — plan §6.5, §22.
 *
 * "For Bangladesh: cascading Division → District → Thana dropdowns are far
 * more reliable than free-text."
 *
 * Divisions and all 64 districts are covered here. Thana/upazila is left as a
 * free-text field: there are roughly 500 of them, the lists in circulation
 * disagree with each other, and a wrong dropdown is worse than an honest text
 * box — a courier can work with "Mohammadpur" typed by the customer, but not
 * with a thana the customer could not find in a list and picked at random.
 *
 * District names drive shipping zone matching (src/lib/shipping.ts), so the
 * spellings here must match the `regions` arrays on ShippingZone rows.
 */

export interface Division {
  name: string;
  nameBn: string;
  districts: string[];
}

export const BD_DIVISIONS: Division[] = [
  {
    name: 'Dhaka',
    nameBn: 'ঢাকা',
    districts: [
      'Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj', 'Madaripur',
      'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi', 'Rajbari',
      'Shariatpur', 'Tangail',
    ],
  },
  {
    name: 'Chattogram',
    nameBn: 'চট্টগ্রাম',
    districts: [
      'Bandarban', 'Brahmanbaria', 'Chandpur', 'Chattogram', "Cox's Bazar",
      'Cumilla', 'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali', 'Rangamati',
    ],
  },
  {
    name: 'Khulna',
    nameBn: 'খুলনা',
    districts: [
      'Bagerhat', 'Chuadanga', 'Jashore', 'Jhenaidah', 'Khulna', 'Kushtia',
      'Magura', 'Meherpur', 'Narail', 'Satkhira',
    ],
  },
  {
    name: 'Rajshahi',
    nameBn: 'রাজশাহী',
    districts: [
      'Bogura', 'Chapainawabganj', 'Joypurhat', 'Naogaon', 'Natore',
      'Pabna', 'Rajshahi', 'Sirajganj',
    ],
  },
  {
    name: 'Barishal',
    nameBn: 'বরিশাল',
    districts: [
      'Barguna', 'Barishal', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur',
    ],
  },
  {
    name: 'Sylhet',
    nameBn: 'সিলেট',
    districts: ['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet'],
  },
  {
    name: 'Rangpur',
    nameBn: 'রংপুর',
    districts: [
      'Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari',
      'Panchagarh', 'Rangpur', 'Thakurgaon',
    ],
  },
  {
    name: 'Mymensingh',
    nameBn: 'ময়মনসিংহ',
    districts: ['Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur'],
  },
];

export const BD_DISTRICTS: string[] = BD_DIVISIONS.flatMap((d) => d.districts).sort();

export function districtsForDivision(division: string): string[] {
  return BD_DIVISIONS.find((d) => d.name === division)?.districts ?? [];
}

export function divisionForDistrict(district: string): string | null {
  return BD_DIVISIONS.find((d) => d.districts.includes(district))?.name ?? null;
}

/**
 * Countries offered at checkout.
 *
 * Bangladesh first because it is the primary market (§1.2); the rest are the
 * destinations the shipping zones actually cover. A country we cannot quote
 * for should not be selectable — §7.3 prefers preventing the error to
 * explaining it afterwards.
 */
export const SHIPPING_COUNTRIES: { code: string; name: string }[] = [
  { code: 'BD', name: 'Bangladesh' },
  { code: 'IN', name: 'India' },
  { code: 'NP', name: 'Nepal' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'BT', name: 'Bhutan' },
  { code: 'MV', name: 'Maldives' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'IE', name: 'Ireland' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'JP', name: 'Japan' },
];

/**
 * Labels adapt by country (§22): "Thana/Upazila" and "District" for BD,
 * "State" and "ZIP" for the US, "County" and "Postcode" for the UK.
 */
export function addressLabels(country: string): {
  area: string;
  city: string;
  region: string;
  postcode: string;
  postcodeRequired: boolean;
} {
  switch (country) {
    case 'BD':
      return {
        area: 'Thana / Upazila',
        city: 'District',
        region: 'Division',
        postcode: 'Postcode',
        postcodeRequired: false,
      };
    case 'US':
      return {
        area: 'Apartment, suite (optional)',
        city: 'City',
        region: 'State',
        postcode: 'ZIP code',
        postcodeRequired: true,
      };
    case 'GB':
      return {
        area: 'Apartment, suite (optional)',
        city: 'Town / City',
        region: 'County',
        postcode: 'Postcode',
        postcodeRequired: true,
      };
    default:
      return {
        area: 'Apartment, suite (optional)',
        city: 'City',
        region: 'State / Province',
        postcode: 'Postal code',
        postcodeRequired: true,
      };
  }
}
