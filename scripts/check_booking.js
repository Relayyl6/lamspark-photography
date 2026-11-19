const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

async function checkBooking() {
  const cols = await sql.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'booking'
    ORDER BY ordinal_position
  `);
  console.log('Booking columns:', cols);
}
checkBooking().catch(console.error);
