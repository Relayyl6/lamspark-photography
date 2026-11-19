const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function inspect() {
  const items = await sql.query(`
    SELECT gi.id as gi_id, gi.gallery_id, gi.asset_id, g.slug as gallery_slug, g.title as gallery_title,
           a.storage_key, a.alt_text
    FROM gallery_item gi
    JOIN gallery g ON gi.gallery_id = g.id
    JOIN asset a ON gi.asset_id = a.id
    ORDER BY g.slug, gi.display_order ASC
  `);
  console.log('Total gallery items in database:', items.length);

  // 1. Check duplicate storage_key
  const byKey = {};
  items.forEach(it => {
    byKey[it.storage_key] = byKey[it.storage_key] || [];
    byKey[it.storage_key].push(it);
  });

  const duplicateKeys = Object.entries(byKey).filter(([k, list]) => list.length > 1);
  console.log('\n--- 1. DUPLICATE STORAGE KEYS ---');
  console.log('Unique storage keys:', Object.keys(byKey).length);
  console.log('Duplicate storage keys count:', duplicateKeys.length);
  duplicateKeys.forEach(([k, list]) => {
    console.log(` - ${k} (${list.length} times): [${list.map(x => x.gallery_slug + ':' + x.gi_id).join(', ')}]`);
  });

  // 2. Check duplicate file hashes (identical binary image content)
  const byHash = {};
  let missingFiles = 0;
  for (const it of items) {
    let rel = it.storage_key;
    if (rel.startsWith('/')) rel = rel.slice(1);
    const fullPath = path.resolve('public', rel.replace(/^public\//, ''));
    if (fs.existsSync(fullPath)) {
      const buf = fs.readFileSync(fullPath);
      const hash = crypto.createHash('md5').update(buf).digest('hex');
      byHash[hash] = byHash[hash] || [];
      byHash[hash].push({ ...it, fullPath });
    } else {
      missingFiles++;
      console.log('Missing file:', fullPath);
    }
  }

  console.log('\n--- 2. DUPLICATE FILE CONTENT (MD5 HASH) ---');
  console.log('Missing files on disk:', missingFiles);
  console.log('Unique binary image files:', Object.keys(byHash).length);
  const duplicateHashes = Object.entries(byHash).filter(([h, list]) => list.length > 1);
  console.log('Images appearing multiple times by content:', duplicateHashes.length);
  
  let excessCount = 0;
  duplicateHashes.forEach(([h, list]) => {
    excessCount += (list.length - 1);
    console.log(`\nHash ${h.slice(0, 10)} (${list.length} duplicates):`);
    list.forEach(x => {
      console.log(`   * gallery: ${x.gallery_slug} | key: ${x.storage_key} | gi_id: ${x.gi_id}`);
    });
  });

  console.log('\nTotal excess duplicate gallery items to remove:', excessCount);
}

inspect().catch(console.error);
