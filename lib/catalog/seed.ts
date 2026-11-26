import type { PackageItem, AddOnItem, SessionTypeSlug } from "../types";

export interface SessionTypeMeta {
  slug: SessionTypeSlug;
  title: string;
  tagline: string;
  description: string;
  fromPrice: number | null;
  promoPrice?: number | null;
  heroImage: string;
  heroImageMobile?: string;
  defaultDepositPercent: number;
  depositPercent?: number;
  standardDeliveryDays: string;
  expressDeliveryDays?: string;
  category: "studio" | "events" | "portraits";
}

export const SESSION_TYPES: Record<SessionTypeSlug, SessionTypeMeta> = {
  toddler: {
    slug: "toddler",
    title: "Toddler & Children",
    tagline: "Unhurried, joyful studio sessions for ages 1 to 10 in Abuja.",
    description: "Designed around your child's pace, personality, and natural wonder. We play, we pause, and we capture genuine sparkle without stiff posing.",
    fromPrice: 95000,
    heroImage: "/images/client/curated_master/curated_master_6.webp",
    defaultDepositPercent: 70,
    standardDeliveryDays: "7 to 14 working days",
    expressDeliveryDays: "3 to 5 business days",
    category: "studio",
  },
  maternity: {
    slug: "maternity",
    title: "Maternity & Motherhood",
    tagline: "Celebrating the quiet strength and beauty of carrying new life.",
    description: "Gentle, flattering lighting and intentional styling in our private Abuja studio. A calm space where expectant mothers feel thoroughly cared for.",
    fromPrice: 140000,
    heroImage: "/images/client/weddings_3.webp",
    defaultDepositPercent: 50, // Maternity list specifically states 50%
    standardDeliveryDays: "10 business days",
    expressDeliveryDays: "3 to 5 business days",
    category: "studio",
  },
  "motherhood-bundle": {
    slug: "motherhood-bundle",
    title: "Motherhood Bundle (Maternity + Newborn)",
    tagline: "One continuous story: carrying life, then holding life in your arms.",
    description: "Combine your maternity session with newborn portraits and enjoy a 15% bundled saving, seamless planning, and coordinated styling across both chapters.",
    fromPrice: 255000,
    heroImage: "/images/client/events_9.webp",
    defaultDepositPercent: 50,
    standardDeliveryDays: "10 business days per session",
    category: "studio",
  },
  event: {
    slug: "event",
    title: "Event Coverage",
    tagline: "Discreet, narrative documentation of milestone celebrations in Abuja.",
    description: "From intimate birthday gatherings and anniversaries to cultural galas. We capture the unscripted warmth, heartfelt laughter, and key moments without interrupting the joy.",
    fromPrice: 120000,
    heroImage: "/images/client/events_1.webp",
    defaultDepositPercent: 70,
    standardDeliveryDays: "5 to 7 business days",
    expressDeliveryDays: "24 to 48 hours",
    category: "events",
  },
  wedding: {
    slug: "wedding",
    title: "Weddings & Ceremonies",
    tagline: "Heirloom wedding coverage crafted with soul, elegance, and truth.",
    description: "Every wedding is unique. We provide comprehensive, bespoke consultation and tailored coverage for traditional ceremonies and white weddings.",
    fromPrice: null, // Personal quote required
    heroImage: "/images/client/weddings_1.webp",
    defaultDepositPercent: 70,
    standardDeliveryDays: "3 to 4 weeks",
    category: "events",
  },
  newborn: {
    slug: "newborn",
    title: "Newborn Portraits",
    tagline: "Tender, safe, temperature-controlled studio sessions for newborns.",
    description: "Patience above all. We schedule ample time for nursing, settling, and resting to ensure your newborn is relaxed, secure, and gently photographed.",
    fromPrice: 150000,
    heroImage: "/images/client/events_10.webp",
    defaultDepositPercent: 70,
    standardDeliveryDays: "7 to 10 business days",
    category: "studio",
  },
  family: {
    slug: "family",
    title: "Family Portraits",
    tagline: "Timeless generations together in genuine connection.",
    description: "Portraits that celebrate how your family actually loves. Unstiff, warm, and created to hang in your home for decades.",
    fromPrice: 160000,
    heroImage: "/images/client/corporate_3.webp",
    defaultDepositPercent: 70,
    standardDeliveryDays: "7 to 10 business days",
    category: "studio",
  },
  couple: {
    slug: "couple",
    title: "Couple & Engagement",
    tagline: "Intimate, unscripted portraits celebrating your bond.",
    description: "Quiet chemistry captured in natural light. Perfect for pre-wedding announcements, anniversaries, or simply honouring your shared journey.",
    fromPrice: 120000,
    heroImage: "/images/client/weddings_2.webp",
    defaultDepositPercent: 70,
    standardDeliveryDays: "7 business days",
    category: "portraits",
  },
  "individual-portrait": {
    slug: "individual-portrait",
    title: "Individual Portraits",
    tagline: "Thoughtful personal portraits that capture your authentic presence.",
    description: "A private studio experience tailored to your milestone, birthday, or creative expression. Guided posing that feels effortless.",
    fromPrice: 85000,
    heroImage: "/images/client/corporate_2.webp",
    defaultDepositPercent: 70,
    standardDeliveryDays: "5 to 7 business days",
    category: "portraits",
  },
  "official-portrait": {
    slug: "official-portrait",
    title: "Executive & Official Portraits",
    tagline: "Commanding, professional headshots for leaders, executives, and teams.",
    description: "High-impact visual presence for LinkedIn, annual reports, speaking engagements, and company websites in Abuja.",
    fromPrice: 95000,
    heroImage: "/images/client/corporate_1.webp",
    defaultDepositPercent: 70,
    standardDeliveryDays: "5 business days",
    category: "portraits",
  },
  "not-sure": {
    slug: "not-sure",
    title: "Bespoke Consultation",
    tagline: "Not sure which session fits? Let's design something special.",
    description: "Share what you have in mind with Osemene, and we'll recommend the ideal setup, time, and custom arrangement.",
    fromPrice: null,
    heroImage: "/images/client/events_5.webp",
    defaultDepositPercent: 70,
    standardDeliveryDays: "Consultation first",
    category: "portraits",
  },
};

export const PACKAGES: PackageItem[] = [
  // Toddler / Child
  {
    id: "toddler-luxury",
    sessionType: "toddler",
    name: "Luxury",
    price: 650000,
    badge: "Most Complete",
    sort: 1,
    deliveryDaysText: "7 to 14 working days",
    inclusions: [
      "3 studio setups",
      "3 to 4 outfit changes",
      "20 professionally edited images",
      "1 medium frame",
      "1 premium photo album",
      "Covers all siblings",
      "Complimentary family session with 4 edited images",
      "Complimentary studio gift",
    ],
  },
  {
    id: "toddler-premium",
    sessionType: "toddler",
    name: "The Premium",
    price: 350000,
    badge: "Best Seller",
    sort: 2,
    deliveryDaysText: "7 to 14 working days",
    inclusions: [
      "2 studio setups",
      "2 to 3 outfit changes",
      "10 professionally edited images",
      "1 small frame",
      "Complimentary studio gift",
    ],
  },
  {
    id: "toddler-basic",
    sessionType: "toddler",
    name: "The Basic",
    price: 180000,
    sort: 3,
    deliveryDaysText: "7 to 14 working days",
    inclusions: [
      "1 studio setup",
      "1 outfit",
      "5 professionally edited images",
      "Complimentary studio gift",
    ],
  },
  {
    id: "toddler-essence",
    sessionType: "toddler",
    name: "The Essence",
    price: 95000,
    sort: 4,
    deliveryDaysText: "7 to 14 working days",
    inclusions: [
      "Plain backdrop only",
      "Minimal props (numbers, chairs)",
      "1 outfit",
      "3 professionally edited images",
      "Short studio session",
    ],
  },

  // Maternity & Motherhood
  {
    id: "maternity-mini-glow",
    sessionType: "maternity",
    name: "Mini Glow",
    price: 140000,
    sort: 1,
    deliveryDaysText: "10 business days",
    inclusions: [
      "1 studio outfit",
      "5 professionally edited images",
      "Private soft-copy online delivery gallery",
    ],
  },
  {
    id: "maternity-classic-bloom",
    sessionType: "maternity",
    name: "Classic Bloom",
    price: 185000,
    sort: 2,
    deliveryDaysText: "10 business days",
    inclusions: [
      "2 outfit changes",
      "8 professionally edited images",
      "Private soft-copy online delivery gallery",
    ],
  },
  {
    id: "maternity-signature-grace",
    sessionType: "maternity",
    name: "Signature Grace",
    price: 255000,
    badge: "Popular Choice",
    sort: 3,
    deliveryDaysText: "10 business days",
    inclusions: [
      "2 to 3 outfit changes",
      "12 professionally edited images",
      "Private soft-copy online delivery gallery",
    ],
  },
  {
    id: "maternity-luxury-motherhood",
    sessionType: "maternity",
    name: "Luxury Motherhood",
    price: 520000,
    badge: "Heirloom",
    sort: 4,
    deliveryDaysText: "10 business days",
    inclusions: [
      "Multiple outfit changes",
      "18 professionally edited images",
      "Cinematic Instagram reels video",
      "16x20 frameless print",
      "Private soft-copy online delivery gallery",
    ],
  },

  // Motherhood Bundles (15% off combined)
  {
    id: "bundle-bloom",
    sessionType: "motherhood-bundle",
    name: "Bloom Collection (Maternity + Newborn)",
    price: 255000, // Orig 300,000
    badge: "15% Saving",
    sort: 1,
    deliveryDaysText: "10 business days per session",
    inclusions: [
      "Maternity session: 6 edited images, 1-2 outfits",
      "Newborn session: 6 edited images, 1-2 setups",
      "15% bundled savings applied",
      "Coordinated styling across both chapters",
    ],
  },
  {
    id: "bundle-grace",
    sessionType: "motherhood-bundle",
    name: "Grace Collection (Maternity + Newborn)",
    price: 357000, // Orig 420,000
    badge: "Popular Bundle",
    sort: 2,
    deliveryDaysText: "10 business days per session",
    inclusions: [
      "Maternity session: 6 edited images, 1-2 outfits",
      "Newborn session: 8 edited images, 1-2 setups",
      "15% bundled savings applied",
      "Coordinated styling across both chapters",
    ],
  },
  {
    id: "bundle-legacy",
    sessionType: "motherhood-bundle",
    name: "Legacy Collection (Maternity + Newborn)",
    price: 510000, // Orig 600,000
    badge: "Heirloom Bundle",
    sort: 3,
    deliveryDaysText: "10 business days per session",
    inclusions: [
      "Maternity session: 12 edited images, multiple outfits",
      "Newborn session: 12 edited images, multiple setups",
      "15% bundled savings applied",
      "Private soft-copy online delivery gallery for both sessions",
    ],
  },

  // Event Coverage
  {
    id: "event-2h",
    sessionType: "event",
    name: "2 Hours Coverage",
    price: 120000,
    sort: 1,
    deliveryDaysText: "5 to 7 business days",
    inclusions: [
      "Up to 2 consecutive hours of event photography",
      "All high-resolution edited images",
      "Private online delivery gallery",
    ],
  },
  {
    id: "event-4h",
    sessionType: "event",
    name: "4 Hours Coverage",
    price: 200000,
    badge: "Most Popular",
    sort: 2,
    deliveryDaysText: "5 to 7 business days",
    inclusions: [
      "Up to 4 consecutive hours of event photography",
      "All high-resolution edited images",
      "Private online delivery gallery",
    ],
  },
  {
    id: "event-6h",
    sessionType: "event",
    name: "6 Hours Coverage",
    price: 300000,
    sort: 3,
    deliveryDaysText: "5 to 7 business days",
    inclusions: [
      "Up to 6 consecutive hours of event photography",
      "All high-resolution edited images",
      "Private online delivery gallery",
    ],
  },
];

export const ADD_ONS: AddOnItem[] = [
  // Toddler Add-ons
  {
    id: "addon-toddler-family-member",
    sessionType: "toddler",
    name: "Additional Family Member",
    price: 30000,
    kind: "per_person",
    description: "Include an additional older or younger sibling or relative in setups",
  },
  {
    id: "addon-toddler-child-percent",
    sessionType: "toddler",
    name: "Additional Child (Twins / Multiples)",
    price: 0,
    kind: "percent_of_package",
    percentValue: 50,
    description: "50% of the selected package price for twins or triplets",
  },
  {
    id: "addon-toddler-family-special",
    sessionType: "toddler",
    name: "Family Portrait Special Add-On",
    price: 100000,
    kind: "flat",
    description: "1 outfit change, 1 backdrop, 3 edited images for the parents & child together",
  },

  // Maternity Add-ons
  {
    id: "addon-maternity-extra-image",
    sessionType: "maternity",
    name: "Extra Edited Image",
    price: 10000,
    kind: "per_image",
    description: "₦10,000 per additional professionally retouched image",
  },
  {
    id: "addon-maternity-reels",
    sessionType: "maternity",
    name: "Content Reel (2 short videos)",
    price: 150000,
    kind: "flat",
    description: "2 edited cinematic video reels formatted for Instagram / TikTok",
  },
  {
    id: "addon-maternity-express",
    sessionType: "maternity",
    name: "Express Delivery (3 to 5 business days)",
    price: 30000,
    kind: "flat",
    description: "Priority expedited editing within 3 to 5 business days",
  },
  {
    id: "addon-maternity-partner",
    sessionType: "maternity",
    name: "Additional Person (Partner or Sibling)",
    price: 20000,
    kind: "per_person",
    description: "Include partner or sibling in selected setups",
  },

  // Event Add-ons
  {
    id: "addon-event-express",
    sessionType: "event",
    name: "Event Express Delivery (24 to 48 hrs)",
    price: 30000,
    kind: "flat",
    description: "Fast-track delivery of edited highlights within 24 to 48 hours",
  },
  {
    id: "addon-event-reels",
    sessionType: "event",
    name: "2 Short Highlight Reels",
    price: 200000,
    kind: "flat",
    description: "Edited cinematic short-form highlight videos",
  },
  {
    id: "addon-event-extra-hour",
    sessionType: "event",
    name: "Additional Hour of Coverage",
    price: 35000,
    kind: "per_hour",
    description: "₦35,000 per additional hour beyond package coverage",
  },

  // General Priority
  {
    id: "addon-general-priority",
    sessionType: "all",
    name: "Priority Editing Turnaround",
    price: 30000,
    kind: "flat",
    description: "Moves your session to the front of the editing queue",
  },
];
