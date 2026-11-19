const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

async function createTable() {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS session_override (
      slug TEXT PRIMARY KEY,
      price_override INTEGER,
      cover_image_url TEXT,
      delivery_days TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('Created session_override table successfully!');
}
createTable().catch(console.error);
