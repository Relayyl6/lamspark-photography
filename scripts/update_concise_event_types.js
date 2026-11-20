const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: '.env' });
}
const sql = neon(process.env.DATABASE_URL);

async function cleanEventTypeNames() {
  const updates = [
    { slug: 'official-portrait', name: 'Executive Bilateral', badge_color: '#B8893A' },
    { slug: 'wedding', name: 'Luxury Weddings', badge_color: '#C59B27' },
    { slug: 'event', name: 'Grand Galas', badge_color: '#D97706' },
    { slug: 'cultural', name: 'Cultural Gala', badge_color: '#059669' },
    { slug: 'memorial', name: 'Memorial Tribute', badge_color: '#6366F1' },
    { slug: 'commercial', name: 'Commercial Brand', badge_color: '#2563EB' },
    { slug: 'milestones', name: 'Milestone Celebrations', badge_color: '#DB2777' },
    { slug: 'maternity', name: 'Maternity Atelier', badge_color: '#E11D48' },
    { slug: 'toddler', name: 'Toddler & Children', badge_color: '#0D9488' },
    { slug: 'portraits', name: 'Studio Atelier', badge_color: '#78716C' },
  ];

  for (const u of updates) {
    await sql.query(
      `UPDATE event_type SET name = $1, badge_color = $2 WHERE slug = $3`,
      [u.name, u.badge_color, u.slug]
    );
  }
  console.log("Updated event_type names and badge colors successfully!");

  const res = await sql.query(`SELECT slug, name, badge_color FROM event_type ORDER BY display_order`);
  console.log("New Event Types:", res);
}

cleanEventTypeNames().catch(console.error);
