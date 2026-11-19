const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    const rows = await sql.query('SELECT * FROM session_override');
    console.log('Session overrides in DB (' + rows.length + '):');
    for (const r of rows) {
      console.log(`- Slug: ${r.slug}, Price: ${r.price_override}, Promo: ${r.promo_price}, Tiers count: ${r.package_tiers ? (Array.isArray(r.package_tiers) ? r.package_tiers.length : 'not array') : 'none'}`);
      if (r.package_tiers) {
        const tiers = Array.isArray(r.package_tiers) ? r.package_tiers : JSON.parse(r.package_tiers);
        console.log('   Tiers:', tiers.map(t => `${t.name} (₦${t.price})`).join(', '));
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
