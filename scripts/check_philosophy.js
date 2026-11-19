const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const sql = neon(process.env.DATABASE_URL);

async function run() {
  const res = await sql.query("SELECT key, value FROM settings WHERE key = 'philosophy_photos'");
  console.log('philosophy_photos in settings:');
  const photos = res[0]?.value;
  if (Array.isArray(photos)) {
    photos.forEach((p, idx) => {
      console.log(`[${idx}] src: ${p.src}, title: ${p.title}, cluster: ${p.cluster}, x: ${p.d?.x}, y: ${p.d?.y}`);
    });
  } else {
    console.log(photos);
  }
}

run().catch(console.error);
