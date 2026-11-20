const { neon } = require("@neondatabase/serverless");
require("dotenv").config({ path: ".env.local" });
if (!process.env.DATABASE_URL) {
  require("dotenv").config({ path: ".env" });
}

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log("Creating event_type table in Neon DB...");

  await sql.query(`
    CREATE TABLE IF NOT EXISTS event_type (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      badge_color TEXT DEFAULT '#C9A96E',
      icon TEXT DEFAULT 'Sparkles',
      display_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log("event_type table ready.");

  const INITIAL_TYPES = [
    {
      slug: "official-portrait",
      name: "Official Portrait & Executive Bilateral",
      description: "Dignified bilateral accords, executive leadership delegations, and corporate diplomacy.",
      badgeColor: "#B8893A",
      order: 1,
    },
    {
      slug: "wedding",
      name: "Sacred Unions & Luxury Weddings",
      description: "Traditional ceremonies, church solemnizations, and matrimonial splendor.",
      badgeColor: "#C59B27",
      order: 2,
    },
    {
      slug: "event",
      name: "Grand Galas & Banquets",
      description: "Generational galas, diplomatic banquets, and milestone celebrations.",
      badgeColor: "#8E6D3B",
      order: 3,
    },
    {
      slug: "cultural",
      name: "Cultural Gala & Heritage",
      description: "Royal African textiles, cultural heritage banquets, and ancestral pride.",
      badgeColor: "#A65B32",
      order: 4,
    },
    {
      slug: "memorial",
      name: "Memorial Celebration of Life",
      description: "Generational legacy tributes and celebrations of extraordinary impact.",
      badgeColor: "#5A6577",
      order: 5,
    },
    {
      slug: "commercial",
      name: "Commercial Brand & Retail",
      description: "Architectural luxury retail, interior atmospheric lighting, and brand launches.",
      badgeColor: "#2F5C45",
      order: 6,
    },
    {
      slug: "milestones",
      name: "Academic Milestone & Birthday",
      description: "Graduation jubilation, birthdays, and significant life landmarks.",
      badgeColor: "#934A5F",
      order: 7,
    },
    {
      slug: "maternity",
      name: "Maternity & Motherhood Glow",
      description: "Sculpting gentle shadows for expectant mothers and new beginnings.",
      badgeColor: "#C98A7D",
      order: 8,
    },
    {
      slug: "toddler",
      name: "Toddler & Children",
      description: "Unhurried, joyful childhood portraits without stiff posing.",
      badgeColor: "#5B8E7D",
      order: 9,
    },
    {
      slug: "portraits",
      name: "Studio Atelier Portraits",
      description: "Archival fine art portraits captured in our private Maitama studio.",
      badgeColor: "#7A6855",
      order: 10,
    },
  ];

  for (const t of INITIAL_TYPES) {
    await sql.query(
      `INSERT INTO event_type (id, slug, name, description, badge_color, display_order, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         badge_color = EXCLUDED.badge_color,
         display_order = EXCLUDED.display_order,
         updated_at = NOW()`,
      [t.slug, t.name, t.description, t.badgeColor, t.order]
    );
  }

  const result = await sql.query("SELECT slug, name, display_order FROM event_type ORDER BY display_order ASC");
  console.log("Event types seeded successfully:");
  console.table(result);
}

run().catch(console.error);
