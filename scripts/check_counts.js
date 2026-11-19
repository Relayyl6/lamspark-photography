const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const sql = neon(process.env.DATABASE_URL);

async function run() {
  const allGalleries = await sql.query('SELECT id, slug, title FROM gallery ORDER BY display_order ASC');
  let total = 0;
  for (const gal of allGalleries) {
    const items = await sql.query('SELECT count(*) as cnt FROM gallery_item WHERE gallery_id = $1', [gal.id]);
    const cnt = parseInt(items[0].cnt);
    console.log(`${gal.title} (${gal.slug}): ${cnt} items`);
    total += cnt;
  }
  console.log(`Total across all galleries: ${total}`);
}
run().catch(console.error);
