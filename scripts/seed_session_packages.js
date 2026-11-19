const { neon } = require("@neondatabase/serverless");
require("dotenv").config({ path: ".env.local" });
if (!process.env.DATABASE_URL) {
  require("dotenv").config({ path: ".env" });
}

const sql = neon(process.env.DATABASE_URL);

// Packages default dataset matching seed.ts
const DEFAULT_PACKAGES = {
  maternity: [
    {
      id: "maternity-mini-glow",
      name: "Mini Glow",
      price: 140000,
      promoPrice: null,
      badge: "",
      deliveryDaysText: "10 business days",
      inclusions: [
        "1 studio outfit",
        "5 professionally edited images",
        "Private soft-copy online delivery gallery",
      ],
    },
    {
      id: "maternity-classic-bloom",
      name: "Classic Bloom",
      price: 185000,
      promoPrice: null,
      badge: "",
      deliveryDaysText: "10 business days",
      inclusions: [
        "2 outfit changes",
        "8 professionally edited images",
        "Private soft-copy online delivery gallery",
      ],
    },
    {
      id: "maternity-signature-grace",
      name: "Signature Grace",
      price: 255000,
      promoPrice: 235000,
      badge: "Popular Choice",
      deliveryDaysText: "10 business days",
      inclusions: [
        "2 to 3 outfit changes",
        "12 professionally edited images",
        "Private soft-copy online delivery gallery",
      ],
    },
    {
      id: "maternity-luxury-motherhood",
      name: "Luxury Motherhood",
      price: 520000,
      promoPrice: null,
      badge: "Heirloom",
      deliveryDaysText: "10 business days",
      inclusions: [
        "Multiple outfit changes",
        "18 professionally edited images",
        "Cinematic Instagram reels video",
        "16x20 frameless print",
        "Private soft-copy online delivery gallery",
      ],
    },
  ],
  toddler: [
    {
      id: "toddler-prince",
      name: "The Little Prince / Princess",
      price: 120000,
      promoPrice: null,
      badge: "Best Seller",
      deliveryDaysText: "7 to 10 working days",
      inclusions: [
        "2 outfits",
        "6 professionally retouched portraits",
        "Family members included (up to 3)",
        "Private digital delivery archive",
      ],
    },
    {
      id: "toddler-joyous",
      name: "The Joyous Milestone",
      price: 160000,
      promoPrice: null,
      badge: "",
      deliveryDaysText: "7 to 10 working days",
      inclusions: [
        "3 outfits",
        "10 professionally retouched portraits",
        "Parents & siblings included",
        "1 framed 8x10 heirloom desk print",
      ],
    },
    {
      id: "toddler-heirloom",
      name: "The Classic Heirloom",
      price: 240000,
      promoPrice: null,
      badge: "Heirloom",
      deliveryDaysText: "10 to 14 working days",
      inclusions: [
        "Unlimited unhurried wardrobe changes",
        "16 master retouched portraits",
        "Full family session included",
        "Handcrafted 10x10 linen photo book",
      ],
    },
    {
      id: "toddler-essence",
      name: "The Essence",
      price: 95000,
      promoPrice: null,
      badge: "",
      deliveryDaysText: "7 working days",
      inclusions: [
        "Plain backdrop setup",
        "1 outfit",
        "3 professionally edited images",
      ],
    },
  ],
  "motherhood-bundle": [
    {
      id: "bundle-dual-legacy",
      name: "The Dual Legacy",
      price: 360000,
      promoPrice: 320000,
      badge: "Signature Collection",
      deliveryDaysText: "10 business days per stage",
      inclusions: [
        "Part 1: Full luxury maternity session",
        "Part 2: Unhurried newborn / 3-month milestone session",
        "20 master retouched portraits across both sessions",
        "Priority studio scheduling",
      ],
    },
    {
      id: "bundle-complete-matrescence",
      name: "The Complete Matrescence",
      price: 680000,
      promoPrice: null,
      badge: "Heirloom Master",
      deliveryDaysText: "14 business days",
      inclusions: [
        "3 milestone shoots: Maternity, Newborn, 1st Birthday",
        "35 master retouched portraits",
        "Custom 12x12 luxury leather-bound family album",
        "Complimentary framed 16x20 fine art canvas",
      ],
    },
  ],
  wedding: [
    {
      id: "wedding-unhurried-day",
      name: "The Unhurried Day",
      price: 850000,
      promoPrice: null,
      badge: "Classic",
      deliveryDaysText: "3 to 4 weeks",
      inclusions: [
        "Full day ceremony & reception coverage",
        "Lead photographer + assistant",
        "300+ colour-graded high resolution images",
        "Online private gallery with 1-year hosting",
      ],
    },
    {
      id: "wedding-extended-union",
      name: "The Extended Union",
      price: 1450000,
      promoPrice: null,
      badge: "Popular Choice",
      deliveryDaysText: "4 weeks",
      inclusions: [
        "2-day coverage: Traditional engagement & White wedding",
        "2 photographers",
        "600+ master colour-graded images",
        "Luxury 12x12 handcrafted heirloom album",
      ],
    },
  ],
  event: [
    {
      id: "event-intimate",
      name: "Intimate Gathering",
      price: 250000,
      promoPrice: null,
      badge: "",
      deliveryDaysText: "7 to 10 working days",
      inclusions: [
        "Up to 4 hours coverage",
        "100+ colour-graded images",
        "Digital gallery download",
      ],
    },
    {
      id: "event-grand",
      name: "Grand Celebration",
      price: 450000,
      promoPrice: null,
      badge: "Full Day",
      deliveryDaysText: "10 to 14 working days",
      inclusions: [
        "Up to 8 hours comprehensive coverage",
        "Lead photographer + assistant",
        "250+ colour-graded images",
        "Highlight gallery ready in 48 hours for social media",
      ],
    },
  ],
  "official-portrait": [
    {
      id: "portrait-executive",
      name: "Executive Presence",
      price: 85000,
      promoPrice: null,
      badge: "",
      deliveryDaysText: "5 to 7 business days",
      inclusions: [
        "1 look / outfit",
        "3 magazine-grade retouched portraits",
        "High-res and LinkedIn/web optimized formats",
      ],
    },
    {
      id: "portrait-boardroom",
      name: "Boardroom Dynasty",
      price: 180000,
      promoPrice: null,
      badge: "Executive Favorite",
      deliveryDaysText: "5 to 7 business days",
      inclusions: [
        "Up to 3 outfit changes",
        "8 magazine-grade retouched portraits",
        "Tethered live iPad preview during shoot",
        "Print release and commercial usage license",
      ],
    },
  ],
};

async function seed() {
  console.log("Seeding session_override package_tiers into Neon DB...");

  for (const [slug, tiers] of Object.entries(DEFAULT_PACKAGES)) {
    const jsonTiers = JSON.stringify(tiers);
    await sql`
      INSERT INTO session_override (slug, package_tiers, updated_at)
      VALUES (${slug}, ${jsonTiers}::jsonb, NOW())
      ON CONFLICT (slug) DO UPDATE SET
        package_tiers = COALESCE(session_override.package_tiers, EXCLUDED.package_tiers),
        updated_at = NOW()
    `;
    console.log(`- Seeded packages for session: ${slug}`);
  }

  console.log("Finished seeding session packages!");
}

seed().catch(console.error);
