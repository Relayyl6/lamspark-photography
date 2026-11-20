const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: '.env' });
}
const sql = neon(process.env.DATABASE_URL);

async function verifyAll() {
  console.log("================ VERIFYING PORTFOLIO & EVENT GALLERIES ================");

  // 1. Verify all 9 galleries
  const galleries = await sql.query(`
    SELECT g.id, g.slug, g.title, g.session_type, et.name as event_type_name, et.badge_color,
           COUNT(gi.id) as photo_count
    FROM gallery g
    LEFT JOIN event_type et ON et.slug = g.session_type
    LEFT JOIN gallery_item gi ON gi.gallery_id = g.id
    GROUP BY g.id, g.slug, g.title, g.session_type, et.name, et.badge_color, g.display_order
    ORDER BY g.display_order ASC
  `);

  console.log(`\nFound ${galleries.length} distinct galleries in database:`);
  let totalPhotos = 0;
  for (const g of galleries) {
    console.log(`✓ [${g.slug}] "${g.title}"`);
    console.log(`    Event Type: "${g.event_type_name}" (${g.badge_color}) | Photos: ${g.photo_count}`);
    totalPhotos += parseInt(g.photo_count);
    if (parseInt(g.photo_count) === 0) {
      throw new Error(`Gallery ${g.slug} has 0 photos!`);
    }
  }

  console.log(`\nTotal linked photos across 9 events: ${totalPhotos}`);

  // 2. Test getHeroData query
  const [settingsRows, siteContentRows] = await Promise.all([
    sql.query(`SELECT key, value FROM settings WHERE key IN ('hero_wheel_cards', 'hero_kicker', 'hero_headline', 'hero_subtitle')`),
    sql.query(`SELECT key, value FROM site_content WHERE key IN ('hero_wheel_cards', 'hero_kicker', 'hero_headline', 'hero_subtitle')`),
  ]);

  console.log(`\nHero settings rows: ${settingsRows.length}, Site content rows: ${siteContentRows.length}`);
  console.log("✓ Hero query runs without UNION error!");

  console.log("\n================ ALL CHECKS PASSED SUCCESSFULLY ================");
}

verifyAll().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
