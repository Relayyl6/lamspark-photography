const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    // 1. Update concierge_phone_secondary
    await sql.query(
      "UPDATE settings SET value = $1 WHERE key = 'concierge_phone_secondary'",
      [JSON.stringify("+234 813 084 7299")]
    );
    console.log("Updated concierge_phone_secondary in settings.");

    // 2. Update studio_config bankDetails and businessNumber
    const rows = await sql.query("SELECT value FROM settings WHERE key = 'studio_config'");
    if (rows.length > 0) {
      let cfg = typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value;
      if (cfg.bankDetails) {
        cfg.bankDetails.accountNumber = "08130847299";
      }
      cfg.businessNumber = "+2348130847299";
      await sql.query(
        "UPDATE settings SET value = $1 WHERE key = 'studio_config'",
        [JSON.stringify(cfg)]
      );
      console.log("Updated studio_config in settings:", cfg.bankDetails, cfg.businessNumber);
    }

    console.log("Database phone & account update complete!");
  } catch (err) {
    console.error("DB update error:", err);
  }
}
run();
