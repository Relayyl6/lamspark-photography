const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function updateCards() {
  const cards = [
    {
      id: "weddings",
      category: "WEDDINGS",
      label: "Sacred Unions",
      subtitle: "Unhurried wedding ceremonies in Abuja",
      image: "/images/client/weddings_1.webp",
      href: "/sessions",
    },
    {
      id: "traditional",
      category: "TRADITIONAL",
      label: "Cultural Heritage",
      subtitle: "Vibrant Aso-Oke & generational grace",
      image: "/images/client/weddings_2.webp",
      href: "/sessions",
    },
    {
      id: "events",
      category: "EVENTS",
      label: "Milestone Galas",
      subtitle: "Unscripted warmth & celebrations",
      image: "/images/client/events_1.webp",
      href: "/sessions",
    },
    {
      id: "executive",
      category: "EXECUTIVE",
      label: "Executive Leadership",
      subtitle: "Commanding visual presence",
      image: "/images/client/corporate_1.webp",
      href: "/portfolio",
    },
    {
      id: "lifestyle",
      category: "LIFESTYLE",
      label: "Authentic Moments",
      subtitle: "Honouring unscripted warmth & life",
      image: "/images/client/events_3.webp",
      href: "/sessions",
    },
    {
      id: "legacy",
      category: "LEGACY",
      label: "Generational Craft",
      subtitle: "Heirloom memories for decades",
      image: "/images/client/corporate_3.webp",
      href: "/sessions",
    },
    {
      id: "atelier",
      category: "ATELIER",
      label: "Studio Dignity",
      subtitle: "Quiet authority and elegance",
      image: "/images/client/corporate_6.webp",
      href: "/sessions",
    },
  ];

  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('hero_wheel_cards', ${JSON.stringify(cards)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = NOW();
  `;

  console.log("Successfully updated settings with optimized WebP cards!");
}

updateCards().catch(console.error);
