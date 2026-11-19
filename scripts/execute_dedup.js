const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function executeDeduplication() {
  console.log('--- 1. FETCHING CURRENT GALLERY ITEMS ---');
  const items = await sql.query(`
    SELECT gi.id as gi_id, gi.gallery_id, gi.asset_id, gi.display_order,
           g.slug as gallery_slug, g.title as gallery_title,
           a.storage_key, a.alt_text
    FROM gallery_item gi
    JOIN gallery g ON gi.gallery_id = g.id
    JOIN asset a ON gi.asset_id = a.id
    ORDER BY g.slug, gi.display_order ASC
  `);
  console.log(`Initial total gallery items: ${items.length}`);

  // Group by MD5
  const hashToItems = new Map();
  for (const it of items) {
    let rel = it.storage_key;
    if (rel.startsWith('/')) rel = rel.slice(1);
    const fullPath = path.resolve('public', rel.replace(/^public\//, ''));
    if (!fs.existsSync(fullPath)) continue;

    const buf = fs.readFileSync(fullPath);
    const hash = crypto.createHash('md5').update(buf).digest('hex');

    if (!hashToItems.has(hash)) {
      hashToItems.set(hash, []);
    }
    hashToItems.get(hash).push({ ...it, fullPath });
  }

  const toKeep = [];
  const toDelete = [];

  for (const [hash, group] of hashToItems.entries()) {
    if (group.length === 1) {
      toKeep.push(group[0]);
    } else {
      // Preference: subfolder > lowest display order
      group.sort((a, b) => {
        const aHasSub = a.storage_key.includes('/weddings/') || a.storage_key.includes('/corporate/') || a.storage_key.includes('/events/') || a.storage_key.includes('/curated_master/');
        const bHasSub = b.storage_key.includes('/weddings/') || b.storage_key.includes('/corporate/') || b.storage_key.includes('/events/') || b.storage_key.includes('/curated_master/');
        if (aHasSub && !bHasSub) return -1;
        if (!aHasSub && bHasSub) return 1;
        return a.display_order - b.display_order;
      });

      const primary = group[0];
      const duplicates = group.slice(1);

      toKeep.push(primary);
      duplicates.forEach(d => toDelete.push(d));
    }
  }

  console.log(`Distinct images to retain: ${toKeep.length}`);
  console.log(`Duplicate gallery_items to delete: ${toDelete.length}`);

  // Delete duplicate gallery items
  const giIdsToDelete = toDelete.map(d => d.gi_id);
  const assetIdsToCheck = toDelete.map(d => d.asset_id);

  if (giIdsToDelete.length > 0) {
    console.log('\n--- 2. DELETING DUPLICATE GALLERY_ITEM ROWS ---');
    await sql.query(`
      DELETE FROM gallery_item
      WHERE id = ANY($1::uuid[])
    `, [giIdsToDelete]);
    console.log(`Deleted ${giIdsToDelete.length} duplicate gallery_items from database.`);

    // Delete orphaned assets if they are no longer in any gallery_item
    console.log('\n--- 3. REMOVING UNREFERENCED DUPLICATE ASSETS ---');
    const orphaned = await sql.query(`
      DELETE FROM asset
      WHERE id = ANY($1::uuid[])
        AND id NOT IN (SELECT asset_id FROM gallery_item)
      RETURNING id, storage_key
    `, [assetIdsToCheck]);
    console.log(`Removed ${orphaned.length} orphaned duplicate assets.`);
  }

  // Normalize display_orders in each gallery
  console.log('\n--- 4. NORMALIZING DISPLAY ORDERS ---');
  const galleries = await sql.query(`SELECT id, slug, title FROM gallery`);
  for (const gal of galleries) {
    const galItems = await sql.query(`
      SELECT id FROM gallery_item
      WHERE gallery_id = $1
      ORDER BY display_order ASC, created_at ASC
    `, [gal.id]);

    for (let i = 0; i < galItems.length; i++) {
      await sql.query(`
        UPDATE gallery_item
        SET display_order = $1
        WHERE id = $2
      `, [i, galItems[i].id]);
    }
  }

  // Verification
  console.log('\n--- 5. FINAL VERIFICATION ---');
  const finalItems = await sql.query(`
    SELECT gi.id as gi_id, g.slug as gallery_slug, g.title as gallery_title, a.storage_key
    FROM gallery_item gi
    JOIN gallery g ON gi.gallery_id = g.id
    JOIN asset a ON gi.asset_id = a.id
    ORDER BY g.slug, gi.display_order ASC
  `);

  console.log(`Final total gallery items: ${finalItems.length}`);
  const perGallery = {};
  finalItems.forEach(it => {
    perGallery[it.gallery_title] = (perGallery[it.gallery_title] || 0) + 1;
  });
  for (const [title, count] of Object.entries(perGallery)) {
    console.log(` - ${title}: ${count} unique photos`);
  }

  // Check uniqueness of MD5 hashes again
  const finalHashes = new Set();
  let duplicateCount = 0;
  for (const it of finalItems) {
    let rel = it.storage_key;
    if (rel.startsWith('/')) rel = rel.slice(1);
    const fullPath = path.resolve('public', rel.replace(/^public\//, ''));
    if (fs.existsSync(fullPath)) {
      const buf = fs.readFileSync(fullPath);
      const hash = crypto.createHash('md5').update(buf).digest('hex');
      if (finalHashes.has(hash)) {
        console.error(`ERROR: Duplicate hash found for ${it.storage_key}`);
        duplicateCount++;
      } else {
        finalHashes.add(hash);
      }
    }
  }

  if (duplicateCount === 0) {
    console.log(`\nSUCCESS: 100% of the ${finalItems.length} photos in the gallery are completely unique! Zero duplicates remain.`);
  } else {
    console.error(`WARNING: Still found ${duplicateCount} duplicate hashes.`);
  }
}

executeDeduplication().catch(console.error);
