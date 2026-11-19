const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("Running migration for conversation account_phone and message category...");
  try {
    await sql`ALTER TABLE conversation ADD COLUMN IF NOT EXISTS account_phone text;`;
    console.log("Added account_phone to conversation table.");
    
    await sql`ALTER TABLE message ADD COLUMN IF NOT EXISTS category text DEFAULT 'business';`;
    console.log("Added category to message table.");

    await sql`ALTER TABLE message ADD COLUMN IF NOT EXISTS is_business boolean DEFAULT true;`;
    console.log("Added is_business to message table.");

    // Backfill existing conversations with the default studio line if empty
    await sql`UPDATE conversation SET account_phone = '+2348130847299' WHERE account_phone IS NULL AND channel = 'whatsapp';`;
    console.log("Backfilled existing conversations with '+2348130847299'.");

    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migrate();
