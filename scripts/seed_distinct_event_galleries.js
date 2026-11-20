const { neon } = require("@neondatabase/serverless");
require("dotenv").config({ path: ".env.local" });
if (!process.env.DATABASE_URL) {
  require("dotenv").config({ path: ".env" });
}

const sql = neon(process.env.DATABASE_URL);

async function seedDistinctGalleries() {
  console.log("Seeding distinct event galleries into Neon DB...");

  const EVENT_GALLERIES = [
    {
      slug: "woodhall-mou",
      title: "Woodhall MOU & Bilateral Accord",
      description: "Dignified bilateral accords, executive leadership delegations, and corporate diplomacy documented with architectural studio lighting.",
      sessionType: "official-portrait",
      displayOrder: 1,
      matchCriteria: (key, caption) =>
        caption === "WOODHALL MOU" ||
        key.includes("/corporate/") ||
        key.includes("corporate_"),
    },
    {
      slug: "studio-curated-archive",
      title: "Studio Atelier & Editorial Master Archive",
      description: "Curated master series of fine art maternity silhouettes, heirloom child portraits, and intimate family studies from our private Maitama studio.",
      sessionType: "maternity",
      displayOrder: 2,
      matchCriteria: (key, caption) =>
        caption === "FILES TO SEND FOR WEBSITE" ||
        key.includes("/curated_master/") ||
        key.includes("curated_master_"),
    },
    {
      slug: "events-portfolio",
      title: "Grand Galas, Banquets & Public Celebrations",
      description: "Generational galas, cultural heritage banquets, and unscripted joy documented with unobtrusive editorial precision.",
      sessionType: "event",
      displayOrder: 3,
      matchCriteria: (key, caption) =>
        caption === "EVENTS PORTFOLIO" ||
        key.includes("/events/") ||
        key.includes("events_"),
    },
    {
      slug: "weddings",
      title: "Sacred Unions & Traditional Ceremonies",
      description: "Intimate moments and authentic connections from sacred church solemnizations to opulent traditional Nigerian celebrations.",
      sessionType: "wedding",
      displayOrder: 4,
      matchCriteria: (key, caption) =>
        caption === "WEDDINGS" ||
        key.includes("/weddings/") ||
        key.includes("weddings_"),
    },
    {
      slug: "jessica-tunji-wedding",
      title: "Jessica & Tunji Luxury Wedding",
      description: "Bespoke bridal couture, sacred vows, and opulent matrimonial grandeur captured in high-fidelity clarity.",
      sessionType: "wedding",
      displayOrder: 5,
      matchCriteria: (key, caption) =>
        caption.toLowerCase().includes("jessica") ||
        key.toLowerCase().includes("jessica"),
    },
    {
      slug: "efkas-24",
      title: "EFKAS 24' Cultural Gala",
      description: "A celebration of Nigerian heritage, traditional royal textiles, and vibrant cultural ceremonies.",
      sessionType: "cultural",
      displayOrder: 6,
      matchCriteria: (key, caption) =>
        caption.toLowerCase().includes("efkas") ||
        key.toLowerCase().includes("efkas"),
    },
    {
      slug: "engr-igninake-memorial",
      title: "Engr. Igninake Samuel Memorial Celebration",
      description: "Generational legacy, dignified tribute, and celebration of an impactful and extraordinary life.",
      sessionType: "memorial",
      displayOrder: 7,
      matchCriteria: (key, caption) =>
        caption.toLowerCase().includes("igninake") ||
        key.toLowerCase().includes("igninake"),
    },
    {
      slug: "koye-abuja-outlet",
      title: "Koye Abuja Commercial Launch",
      description: "Architectural luxury retail, interior atmospheric lighting, and high-impact commercial branding.",
      sessionType: "commercial",
      displayOrder: 8,
      matchCriteria: (key, caption) =>
        caption.toLowerCase().includes("koye") ||
        key.toLowerCase().includes("koye"),
    },
    {
      slug: "bribena-milestone",
      title: "Bribena Oyintare Isabel [Graduation & Birthday]",
      description: "Academic milestone achievements, graduation jubilation, and joyful birthday atelier portraits.",
      sessionType: "milestones",
      displayOrder: 9,
      matchCriteria: (key, caption) =>
        caption.toLowerCase().includes("bribena") ||
        key.toLowerCase().includes("bribena"),
    },
  ];

  // 1. Upsert all distinct galleries
  const galleryMap = {};
  for (const eg of EVENT_GALLERIES) {
    const res = await sql.query(
      `INSERT INTO gallery (id, slug, title, description, session_type, display_order, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         session_type = EXCLUDED.session_type,
         display_order = EXCLUDED.display_order,
         updated_at = NOW()
       RETURNING id, slug, title`,
      [eg.slug, eg.title, eg.description, eg.sessionType, eg.displayOrder]
    );
    galleryMap[eg.slug] = res[0].id;
    console.log(`Gallery synced: [${eg.slug}] ${eg.title} -> ${res[0].id}`);
  }

  // 2. Fetch all gallery items joined with asset
  const allItems = await sql.query(`
    SELECT gi.id as item_id, gi.caption, a.id as asset_id, a.storage_key
    FROM gallery_item gi
    JOIN asset a ON gi.asset_id = a.id
  `);
  console.log(`Total gallery items to assign: ${allItems.length}`);

  // Re-link items to their specific event gallery
  let reassigned = 0;
  for (const item of allItems) {
    const key = item.storage_key || "";
    const cap = item.caption || "";

    let targetSlug = null;
    for (const eg of EVENT_GALLERIES) {
      if (eg.matchCriteria(key, cap)) {
        targetSlug = eg.slug;
        break;
      }
    }

    if (targetSlug && galleryMap[targetSlug]) {
      const targetGalleryId = galleryMap[targetSlug];
      await sql.query(
        `UPDATE gallery_item SET gallery_id = $1 WHERE id = $2`,
        [targetGalleryId, item.item_id]
      );
      reassigned++;
    }
  }
  console.log(`Reassigned ${reassigned} items to distinct event galleries.`);

  // 3. Set cover asset for each gallery
  for (const eg of EVENT_GALLERIES) {
    const gid = galleryMap[eg.slug];
    const coverRes = await sql.query(
      `SELECT gi.asset_id FROM gallery_item gi
       WHERE gi.gallery_id = $1
       ORDER BY gi.display_order ASC LIMIT 1`,
      [gid]
    );

    if (coverRes.length > 0) {
      await sql.query(
        `UPDATE gallery SET cover_asset_id = $1 WHERE id = $2`,
        [coverRes[0].asset_id, gid]
      );
    }
  }

  // 4. Remove obsolete consolidated galleries (e.g. old `corporate` and `maternity` slugs if separate from new ones)
  const obsoleteSlugs = ["corporate", "maternity"];
  for (const oldSlug of obsoleteSlugs) {
    // Check if there are any orphaned items
    const remaining = await sql.query(
      `SELECT count(*) FROM gallery_item WHERE gallery_id IN (SELECT id FROM gallery WHERE slug = $1)`,
      [oldSlug]
    );
    if (parseInt(remaining[0].count, 10) === 0) {
      await sql.query(`DELETE FROM gallery WHERE slug = $1`, [oldSlug]);
      console.log(`Cleaned up obsolete empty gallery [${oldSlug}]`);
    } else {
      console.log(`Gallery [${oldSlug}] still has ${remaining[0].count} items.`);
    }
  }

  // 5. Final counts
  const summary = await sql.query(`
    SELECT g.slug, g.title, count(gi.id) as photo_count
    FROM gallery g
    LEFT JOIN gallery_item gi ON gi.gallery_id = g.id
    GROUP BY g.slug, g.title, g.display_order
    ORDER BY g.display_order ASC
  `);
  console.log("\n--- Final Event Galleries Summary ---");
  console.table(summary);
}

seedDistinctGalleries().catch(console.error);
