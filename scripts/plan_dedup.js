const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function planDeduplication() {
  const items = await sql.query(`
    SELECT gi.id as gi_id, gi.gallery_id, gi.asset_id, gi.display_order,
           g.slug as gallery_slug, g.title as gallery_title,
           a.storage_key, a.alt_text
    FROM gallery_item gi
    JOIN gallery g ON gi.gallery_id = g.id
    JOIN asset a ON gi.asset_id = a.id
    ORDER BY g.slug, gi.display_order ASC
  `);

  console.log(`Initial total gallery_items: ${items.length}`);

  // Calculate hash for each item
  const hashToItems = new Map();
  for (const it of items) {
    let rel = it.storage_key;
    if (rel.startsWith('/')) rel = rel.slice(1);
    const fullPath = path.resolve('public', rel.replace(/^public\//, ''));
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found: ${fullPath}`);
      continue;
    }
    const buf = fs.readFileSync(fullPath);
    const hash = crypto.createHash('md5').update(buf).digest('hex');

    if (!hashToItems.has(hash)) {
      hashToItems.set(hash, []);
    }
    hashToItems.get(hash).push({ ...it, fullPath });
  }

  console.log(`Distinct image files by MD5 content: ${hashToItems.size}`);

  const toKeep = [];
  const toDelete = [];

  for (const [hash, group] of hashToItems.entries()) {
    if (group.length === 1) {
      toKeep.push(group[0]);
    } else {
      // Pick the best one to keep:
      // Preference:
      // 1. Storage key with subfolder (e.g. /images/client/weddings/... over /images/client/weddings_1.jpg)
      // 2. Lowest display order
      // 3. Earliest ID
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

      console.log(`\nDuplicate Group [Hash: ${hash.slice(0, 8)}]:`);
      console.log(`  KEEP: [${primary.gallery_slug}] ${primary.storage_key} (gi_id: ${primary.gi_id})`);
      duplicates.forEach(d => {
        console.log(`  REMOVE: [${d.gallery_slug}] ${d.storage_key} (gi_id: ${d.gi_id})`);
      });
    }
  }

  console.log(`\n--- DEDUPLICATION SUMMARY ---`);
  console.log(`Items to keep: ${toKeep.length}`);
  console.log(`Items to remove: ${toDelete.length}`);
  console.log(`Total after deduplication: ${toKeep.length} (must equal distinct hashes: ${hashToItems.size})`);

  return { toKeep, toDelete };
}

planDeduplication().catch(console.error);
