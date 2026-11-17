import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
if (!connectionString) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const sql = neon(connectionString);
const db = drizzle(sql, { schema });

const GALLERY_DEFINITIONS = [
  {
    slug: "weddings",
    title: "Sacred Unions & Luxury Nigerian Weddings",
    description: "Unhurried, intimate documentation of authentic vows, regal traditional regalia, and emotional celebration in Abuja and beyond.",
    sessionType: "wedding",
    displayOrder: 1,
    images: [
      {
        src: "/images/client/weddings_1.jpg",
        title: "The Distinguished Brotherhood",
        caption: "Groom & Groomsmen in tailored black-tie tuxedos, quiet camaraderie before the sacred vows.",
        alt: "Groom and groomsmen standing together in tailored evening suits before wedding ceremony",
      },
      {
        src: "/images/client/weddings_2.jpg",
        title: "Regal Velvet & Crowned Splendor",
        caption: "Traditional Nigerian royal union, rich emerald velvet, handcrafted coral beads, and ancestral dignity.",
        alt: "Nigerian couple in emerald traditional attire adorned with royal coral beads",
      },
      {
        src: "/images/client/weddings_3.jpg",
        title: "Whispered Devotion",
        caption: "Intimate couple portrait in gentle golden hour warmth, authentic unhurried romance.",
        alt: "Bride and groom embracing gently during golden hour wedding reception",
      },
      {
        src: "/images/client/weddings_4.jpg",
        title: "Bridal Suite Serenity",
        caption: "Maids of honor celebrating the bride with joyful toasts and quiet anticipation.",
        alt: "Bridal party celebrating in evening dress with celebratory laughter",
      },
      {
        src: "/images/client/weddings_5.jpg",
        title: "The Banquet Toast",
        caption: "Evening reception celebration, exquisite tablescapes and generational blessing.",
        alt: "Wedding banquet celebration with distinguished guests and ambient candlelight",
      },
    ],
  },
  {
    slug: "corporate",
    title: "Executive Leadership & Bilateral MOU Ceremonies",
    description: "Commanding, dignified documentation of historic accords, state delegations, and high-level leadership assemblies.",
    sessionType: "corporate",
    displayOrder: 2,
    images: [
      {
        src: "/images/client/corporate_1.jpg",
        title: "The Statesman's Resolve",
        caption: "Dignitary portrait in bespoke dark suit, commanding presence with authentic warmth.",
        alt: "Corporate executive leader standing dignified against dark backdrop",
      },
      {
        src: "/images/client/corporate_2.jpg",
        title: "Leadership in Discourse",
        caption: "High commissioner portrait reflecting wisdom, calm authority, and distinguished service.",
        alt: "Senior executive smiling warmly during diplomatic session",
      },
      {
        src: "/images/client/corporate_3.jpg",
        title: "Executive Presence",
        caption: "Official leadership frame with rich melanin color grading and museum-grade tonal depth.",
        alt: "Executive portrait with sharp contrast and natural skin tone grading",
      },
      {
        src: "/images/client/corporate_4.jpg",
        title: "The Bilateral Accord",
        caption: "Historic MOU signing ceremony in Abuja, bilateral delegations cementing cross-border partnerships.",
        alt: "Dignitaries and delegation members seated at official signing table with documents",
      },
      {
        src: "/images/client/corporate_5.jpg",
        title: "Delegation in Summit",
        caption: "High-level bilateral round-table discussion, strategic diplomacy in Maitama.",
        alt: "Official international delegation meeting in conference boardroom",
      },
      {
        src: "/images/client/corporate_6.jpg",
        title: "Formal Protocol & Exchange",
        caption: "Senior envoys exchanging commemorative diplomatic documents and accords.",
        alt: "Two government leaders holding bilateral agreement folders",
      },
      {
        src: "/images/client/corporate_7.jpg",
        title: "The Diplomatic Handshake",
        caption: "Historic partnership sealed with mutual respect and photographic precision.",
        alt: "Formal handshake between corporate partners after MOU signing",
      },
      {
        src: "/images/client/corporate_8.jpg",
        title: "Maitama Boardroom Assembly",
        caption: "Executive committee convened for annual governance and strategic direction.",
        alt: "Corporate executive board seated together around conference table",
      },
      {
        src: "/images/client/corporate_9.jpg",
        title: "Keynote Address",
        caption: "Distinguished chairman addressing international investors and summit delegates.",
        alt: "Keynote speaker delivering address at podium during formal conference",
      },
      {
        src: "/images/client/corporate_10.jpg",
        title: "Commemorative Plenary Frame",
        caption: "Distinguished delegation group portrait, generational impact documented.",
        alt: "Summit delegation standing together for official group photograph",
      },
      {
        src: "/images/client/corporate_11.jpg",
        title: "Senior Counsel & Consultation",
        caption: "Quiet strategic consultation between chief legal advisors prior to execution.",
        alt: "Executive advisors in earnest discussion over documents",
      },
      {
        src: "/images/client/corporate_12.jpg",
        title: "The Sovereign Accord",
        caption: "Closing moments of the bilateral assembly, historic archive preserved for posterity.",
        alt: "Official bilateral summit concluding ceremony in Abuja",
      },
    ],
  },
  {
    slug: "events",
    title: "Grand Galas, Banquets & Milestone Celebrations",
    description: "Vibrant, atmospheric storytelling capturing the prestige, architectural beauty, and jubilant energy of landmark occasions.",
    sessionType: "event",
    displayOrder: 3,
    images: [
      {
        src: "/images/client/events_1.jpg",
        title: "The Grand Banquet Hall",
        caption: "Lush botanical ceiling installations and ambient candlelight setting the scene for an unforgettable night.",
        alt: "Luxurious banquet hall illuminated with ambient crystal chandeliers and florals",
      },
      {
        src: "/images/client/events_2.jpg",
        title: "The Golden Jubilee",
        caption: "50th birthday celebration honored with heartfelt speeches, joy, and laughter.",
        alt: "Celebrant smiling warmly surrounded by guests at milestone birthday gala",
      },
      {
        src: "/images/client/events_3.jpg",
        title: "Laughter in Harmony",
        caption: "Candid emotional moments shared among lifelong friends across dinner tables.",
        alt: "Distinguished guests laughing together during gala dinner speeches",
      },
      {
        src: "/images/client/events_4.jpg",
        title: "A Toast to Excellence",
        caption: "Crystal champagne flutes raised in honor of distinguished community service.",
        alt: "Guests raising glasses in celebratory toast under warm ambient lighting",
      },
      {
        src: "/images/client/events_5.jpg",
        title: "Honour & Recognition",
        caption: "Lifetime achievement award presented to venerable matriarch and civic leader.",
        alt: "Civic leader receiving commemorative plaque on stage at awards gala",
      },
      {
        src: "/images/client/events_6.jpg",
        title: "Jubilant Youth & Spark",
        caption: "Youthful celebration filled with laughter, vibrant African prints, and dynamic energy.",
        alt: "Young guests celebrating joyfully on banquet dance floor",
      },
      {
        src: "/images/client/events_7.jpg",
        title: "VIP Tablescape Artistry",
        caption: "Handcrafted golden cutlery, bespoke menu cards, and fragrant floral centerpieces.",
        alt: "Detailed close-up of luxury VIP banquet table arrangement",
      },
      {
        src: "/images/client/events_8.jpg",
        title: "Family Matriarch's Blessing",
        caption: "Three generations assembled in reverence and gratitude around the celebrant.",
        alt: "Family matriarch surrounded by children and grandchildren in celebratory setting",
      },
      {
        src: "/images/client/events_9.jpg",
        title: "Evening Reverie & Dance",
        caption: "Dance floor comes alive with rhythmic African jazz and spirited celebration.",
        alt: "Guests dancing joyfully at evening wedding banquet",
      },
      {
        src: "/images/client/events_10.jpg",
        title: "Live Symphonic Ensemble",
        caption: "Live musicians creating rich sonic textures for Abuja's premier social gathering.",
        alt: "Live musicians performing on stage under atmospheric blue and gold spotlights",
      },
      {
        src: "/images/client/events_11.jpg",
        title: "Diplomatic Gala Soirée",
        caption: "Intimate conversations between international ambassadors and cultural icons.",
        alt: "Diplomats conversing quietly in luxury lounge during gala intermission",
      },
      {
        src: "/images/client/events_12.jpg",
        title: "The Midnight Finale",
        caption: "Confetti burst and standing ovation celebrating another historic LamSparks occasion.",
        alt: "Gala finale with confetti and celebratory applause across the hall",
      },
    ],
  },
  {
    slug: "portraits",
    title: "Fine Art Atelier & Official Portraits",
    description: "Meticulously illuminated, soul-revealing portraits crafted in our calm Abuja atelier or on private location.",
    sessionType: "portrait",
    displayOrder: 4,
    images: [
      {
        src: "/images/client/corporate_1.jpg",
        title: "The Diplomat's Gazing Room",
        caption: "Soulful, unhurried official portraiture celebrating character and dignity.",
        alt: "Official executive portrait with refined rim lighting and rich skin tones",
      },
      {
        src: "/images/client/corporate_2.jpg",
        title: "Warmth of Command",
        caption: "Approachable executive portrait, delicate eye catchlights and authentic texture.",
        alt: "Distinguished leader portrait with gentle natural expression",
      },
      {
        src: "/images/client/corporate_3.jpg",
        title: "Mastery in Stillness",
        caption: "Studio study in chiaroscuro contrast, celebrating rich melanin skin tones with zero artificial smoothing.",
        alt: "Close portrait study with delicate illumination and natural skin texture",
      },
    ],
  },
];

async function seed() {
  console.log("Starting Neon database portfolio seed...");

  // 1. Clear existing items
  console.log("Cleaning existing gallery records in Neon...");
  await db.delete(schema.galleryItems);
  await db.delete(schema.galleries);
  await db.delete(schema.assets);

  let totalAssets = 0;
  let totalGalleries = 0;

  for (const def of GALLERY_DEFINITIONS) {
    const galleryId = randomUUID();
    console.log(`\nInserting gallery: [${def.slug}] "${def.title}"...`);

    let coverAssetId: string | null = null;
    const insertedAssets: { id: string; item: (typeof def.images)[0]; order: number }[] = [];

    for (let i = 0; i < def.images.length; i++) {
      const img = def.images[i];
      const assetId = randomUUID();
      if (i === 0) coverAssetId = assetId;

      await db.insert(schema.assets).values({
        id: assetId,
        storageKey: img.src,
        storageBucket: "neon_production",
        kind: "image",
        sessionType: def.sessionType,
        colourGraded: true,
        consentStatus: "portfolio",
        altText: img.alt,
        altTextApproved: true,
      });

      insertedAssets.push({ id: assetId, item: img, order: i + 1 });
      totalAssets++;
    }

    // Insert Gallery
    await db.insert(schema.galleries).values({
      id: galleryId,
      slug: def.slug,
      title: def.title,
      description: def.description,
      sessionType: def.sessionType,
      coverAssetId: coverAssetId,
      displayOrder: def.displayOrder,
    });
    totalGalleries++;

    // Insert Gallery Items
    for (const a of insertedAssets) {
      await db.insert(schema.galleryItems).values({
        id: randomUUID(),
        galleryId: galleryId,
        assetId: a.id,
        caption: `${a.item.title} — ${a.item.caption}`,
        displayOrder: a.order,
      });
    }

    console.log(`  ✓ Inserted ${insertedAssets.length} assets and gallery items for ${def.slug}`);
  }

  console.log(`\n🎉 SEED COMPLETE!`);
  console.log(`- Total Galleries in Neon: ${totalGalleries}`);
  console.log(`- Total Assets in Neon: ${totalAssets}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
