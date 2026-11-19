const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

async function run() {
  const rows = await sql.query("SELECT key, value FROM settings WHERE key = 'philosophy_photos'");
  if (rows.length === 0) {
    console.log("No philosophy_photos row in settings!");
    return;
  }
  const val = typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value;
  console.log(`Found ${val.length} photos:`);
  val.forEach((p, i) => {
    console.log(`[${i}] src: ${p.src}, title: ${p.title}, cluster: ${p.cluster}, d: (x: ${p.d?.x}, y: ${p.d?.y}, w: ${p.d?.w})`);
  });
}
run();
