const { neon } = require("@neondatabase/serverless");
require("dotenv").config({ path: ".env.local" });
if (!process.env.DATABASE_URL) {
  require("dotenv").config({ path: ".env" });
}

const sql = neon(process.env.DATABASE_URL);

async function consolidate() {
  console.log("Consolidating galleries into 4 unified luxury collections...");

  // Master galleries configuration
  const MASTER_GALLERIES = [
    {
      slug: "weddings",
      title: "Sacred Unions & Luxury Nigerian Weddings",
      description: "Unhurried, intimate moments from sacred church ceremonies to opulent traditional Nigerian celebrations across Abuja and beyond.",
      sessionType: "wedding",
      displayOrder: 1,
      sourceSlugs: ["weddings", "wedding-gallery"],
    },
    {
      slug: "corporate",
      title: "Executive Leadership & Official Portraits",
      description: "Dignified corporate presence, high-level bilateral MOU signings, and executive gravitas crafted with architectural studio lighting.",
      sessionType: "official-portrait",
      displayOrder: 2,
      sourceSlugs: ["corporate", "official-portrait-gallery", "portraits"],
    },
    {
      slug: "events",
      title: "Grand Galas, Banquets & Milestone Celebrations",
      description: "Generational galas, cultural heritage banquets, and unscripted joy documented with unobtrusive editorial precision.",
      sessionType: "event",
      displayOrder: 3,
      sourceSlugs: ["events", "event-gallery"],
    },
    {
      slug: "maternity",
      title: "Motherhood Glow & Studio Atelier Archive",
      description: "Curated master portfolio of luxury maternity silhouettes, intimate child milestones, and archival heirloom portraits.",
      sessionType: "maternity",
      displayOrder: 4,
      sourceSlugs: ["maternity-gallery", "toddler-gallery"],
    },
  ];

  for (const mg of MASTER_GALLERIES) {
    // 1. Ensure master gallery exists
    const galRes = await sql.query(
      `INSERT INTO gallery (id, slug, title, description, session_type, display_order, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         session_type = EXCLUDED.session_type,
         display_order = EXCLUDED.display_order,
         updated_at = NOW()
       RETURNING id`,
      [mg.slug, mg.title, mg.description, mg.sessionType, mg.displayOrder]
    );

    const targetGalleryId = galRes[0].id;

    // 2. Re-assign all gallery_items from sourceSlugs to this master gallery
    const reassignRes = await sql.query(
      `UPDATE gallery_item
       SET gallery_id = $1
       WHERE gallery_id IN (
         SELECT id FROM gallery WHERE slug = ANY($2)
       )`,
      [targetGalleryId, mg.sourceSlugs]
    );

    // 3. Set cover asset
    const coverRes = await sql.query(
      `SELECT gi.asset_id FROM gallery_item gi
       WHERE gi.gallery_id = $1
       ORDER BY gi.display_order ASC LIMIT 1`,
      [targetGalleryId]
    );

    if (coverRes.length > 0) {
      await sql.query(
        `UPDATE gallery SET cover_asset_id = $1 WHERE id = $2`,
        [coverRes[0].asset_id, targetGalleryId]
      );
    }

    // 4. Clean up old duplicate gallery records that are not the master slug
    const duplicateSlugs = mg.sourceSlugs.filter((s) => s !== mg.slug);
    if (duplicateSlugs.length > 0) {
      await sql.query(
        `DELETE FROM gallery WHERE slug = ANY($1)`,
        [duplicateSlugs]
      );
    }

    // 5. Count final items
    const countRes = await sql.query(
      `SELECT count(*) as count FROM gallery_item WHERE gallery_id = $1`,
      [targetGalleryId]
    );

    console.log(`✓ ${mg.title} (${mg.slug}): ${countRes[0].count} photos`);
  }

  // Total assets count
  const totalAssets = await sql.query(`SELECT count(*) as count FROM asset`);
  const totalGalleryItems = await sql.query(`SELECT count(*) as count FROM gallery_item`);
  console.log(`\nFinal Totals: ${totalAssets[0].count} total assets in DB, ${totalGalleryItems[0].count} items organized into portfolio galleries!`);
}

consolidate().catch(console.error);
