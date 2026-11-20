const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

const sql = neon(process.env.DATABASE_URL);

async function distributeGalleries() {
  console.log("Starting authentic distribution across all 9 distinct event galleries...");

  // 1. Fetch all galleries
  const galleries = await sql.query(`SELECT id, slug, title, session_type FROM gallery ORDER BY display_order ASC`);
  console.log(`Found ${galleries.length} galleries in database.`);
  const galMap = new Map(galleries.map(g => [g.slug, g]));

  // 2. Fetch all assets
  const assets = await sql.query(`SELECT id, storage_key, alt_text, session_type FROM asset ORDER BY storage_key ASC`);
  console.log(`Found ${assets.length} assets in database.`);

  // Clear existing gallery_item associations to re-link cleanly
  await sql.query(`DELETE FROM gallery_item`);
  console.log("Cleared existing gallery_item table.");

  // Group assets by category / source
  const weddingsAssets = assets.filter(a => a.storage_key?.includes('/weddings/'));
  const eventsAssets = assets.filter(a => a.storage_key?.includes('/events/'));
  const corporateAssets = assets.filter(a => a.storage_key?.includes('/corporate/'));
  const masterAssets = assets.filter(a => a.storage_key?.includes('/curated_master/'));

  console.log(`Pools: weddings=${weddingsAssets.length}, events=${eventsAssets.length}, corporate=${corporateAssets.length}, master=${masterAssets.length}`);

  // Slices:
  // 1. Jessica & Tunji Luxury Wedding (weddings_1, weddings_2, weddings_3)
  const jessicaAssets = weddingsAssets.slice(0, 3);
  // 2. Sacred Unions & Traditional Ceremonies (weddings_4, weddings_5)
  const sacredUnionsAssets = weddingsAssets.slice(3);

  // 3. EFKAS 24' Cultural Gala (events_1 to events_10) -> 10 photos
  const efkasAssets = eventsAssets.slice(0, 10);
  // 4. Engr. Igninake Samuel Memorial Celebration (events_11 to events_18) -> 8 photos
  const igninakeAssets = eventsAssets.slice(10, 18);
  // 5. Grand Galas, Banquets & Public Celebrations (events_19 to end) -> 18 photos
  const grandGalasAssets = eventsAssets.slice(18);

  // 6. Koye Abuja Commercial Launch (corporate_40 to corporate_49) -> 10 photos
  const koyeAssets = corporateAssets.slice(40);
  // 7. Woodhall MOU & Bilateral Accord (corporate_1 to corporate_39) -> 45 photos
  const woodhallAssets = corporateAssets.slice(0, 40);

  // 8. Bribena Oyintare Isabel [Graduation & Birthday] (master_35 to master_43) -> 9 photos
  const bribenaAssets = masterAssets.slice(34);
  // 9. Studio Atelier & Editorial Master Archive (master_1 to master_34) -> 34 photos
  const studioAtelierAssets = masterAssets.slice(0, 34);

  const assignments = [
    {
      slug: "woodhall-mou",
      gallery: galMap.get("woodhall-mou"),
      assets: woodhallAssets,
      title: "Woodhall MOU & Bilateral Accord",
      sessionType: "official-portrait",
      defaultCaption: "Woodhall MOU — Bilateral diplomatic accords and executive delegation in Maitama",
    },
    {
      slug: "studio-curated-archive",
      gallery: galMap.get("studio-curated-archive"),
      assets: studioAtelierAssets,
      title: "Studio Atelier & Editorial Master Archive",
      sessionType: "maternity",
      defaultCaption: "Studio Atelier Archive — Heirloom maternity silhouette and fine art studio study",
    },
    {
      slug: "events-portfolio",
      gallery: galMap.get("events-portfolio"),
      assets: grandGalasAssets,
      title: "Grand Galas, Banquets & Public Celebrations",
      sessionType: "event",
      defaultCaption: "Grand Galas & Banquets — Unscripted joyous celebration and lavish banquet hall",
    },
    {
      slug: "weddings",
      gallery: galMap.get("weddings"),
      assets: sacredUnionsAssets,
      title: "Sacred Unions & Traditional Ceremonies",
      sessionType: "wedding",
      defaultCaption: "Sacred Unions — Traditional Nigerian ceremony and sacred vows",
    },
    {
      slug: "jessica-tunji-wedding",
      gallery: galMap.get("jessica-tunji-wedding"),
      assets: jessicaAssets,
      title: "Jessica & Tunji Luxury Wedding",
      sessionType: "wedding",
      defaultCaption: "Jessica & Tunji Luxury Wedding — Bespoke bridal couture and matrimonial celebration",
    },
    {
      slug: "efkas-24",
      gallery: galMap.get("efkas-24"),
      assets: efkasAssets,
      title: "EFKAS 24' Cultural Gala",
      sessionType: "cultural",
      defaultCaption: "EFKAS 24' Cultural Gala — Nigerian royal heritage and cultural gala celebration",
    },
    {
      slug: "engr-igninake-memorial",
      gallery: galMap.get("engr-igninake-memorial"),
      assets: igninakeAssets,
      title: "Engr. Igninake Samuel Memorial Celebration",
      sessionType: "memorial",
      defaultCaption: "Engr. Igninake Samuel Memorial Celebration — Generational legacy and celebration of life",
    },
    {
      slug: "koye-abuja-outlet",
      gallery: galMap.get("koye-abuja-outlet"),
      assets: koyeAssets,
      title: "Koye Abuja Commercial Launch",
      sessionType: "commercial",
      defaultCaption: "Koye Abuja Commercial Launch — Luxury boutique retail launch and architectural lighting",
    },
    {
      slug: "bribena-milestone",
      gallery: galMap.get("bribena-milestone"),
      assets: bribenaAssets,
      title: "Bribena Oyintare Isabel [Graduation & Birthday]",
      sessionType: "milestones",
      defaultCaption: "Bribena Oyintare Isabel [Graduation & Birthday] — Academic milestone and joyful anniversary portrait",
    },
  ];

  for (const asgn of assignments) {
    if (!asgn.gallery) {
      console.warn(`Gallery with slug ${asgn.slug} not found!`);
      continue;
    }

    const galId = asgn.gallery.id;
    console.log(`\nAssigning ${asgn.assets.length} photos to "${asgn.title}" (${asgn.slug})...`);

    // Update gallery session_type and title
    await sql.query(
      `UPDATE gallery SET session_type = $1, title = $2, cover_asset_id = $3 WHERE id = $4`,
      [asgn.sessionType, asgn.title, asgn.assets[0]?.id || null, galId]
    );

    // Insert gallery_items
    for (let i = 0; i < asgn.assets.length; i++) {
      const a = asgn.assets[i];
      const itemId = crypto.randomUUID();
      const caption = `${asgn.title} — Frame ${i + 1} of ${asgn.assets.length}`;

      await sql.query(
        `INSERT INTO gallery_item (id, gallery_id, asset_id, display_order, caption)
         VALUES ($1, $2, $3, $4, $5)`,
        [itemId, galId, a.id, i + 1, caption]
      );

      // Update asset session_type
      await sql.query(
        `UPDATE asset SET session_type = $1 WHERE id = $2`,
        [asgn.sessionType, a.id]
      );
    }
    console.log(`✓ Linked ${asgn.assets.length} items to ${asgn.slug}. Cover: ${asgn.assets[0]?.id || 'none'}`);
  }

  // Verify counts
  const summary = await sql.query(`
    SELECT g.slug, g.title, g.session_type, et.name as event_type_name, COUNT(gi.id) as photo_count
    FROM gallery g
    LEFT JOIN event_type et ON et.slug = g.session_type
    LEFT JOIN gallery_item gi ON gi.gallery_id = g.id
    GROUP BY g.slug, g.title, g.session_type, et.name, g.display_order
    ORDER BY g.display_order ASC
  `);

  console.log("\n================ DISTRIBUTION SUMMARY ================");
  summary.forEach((s, idx) => {
    console.log(`${idx + 1}. ${s.title} (${s.slug}) -> Event Type: "${s.event_type_name}" | ${s.photo_count} photos`);
  });
}

distributeGalleries().catch(console.error);
