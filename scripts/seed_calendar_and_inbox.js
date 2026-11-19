require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function seedCalendarAndInbox() {
  console.log("=== SEEDING CONTENT_ITEM, CONVERSATION, AND MESSAGE DIRECTLY INTO NEON DB ===");

  // 1. Seed Content Items
  const existingItems = await sql.query(`SELECT count(*)::int as count FROM content_item`);
  if (existingItems[0]?.count === 0) {
    console.log("Seeding content_item rows into DB...");
    await sql.query(`
      INSERT INTO content_item (
        id, platforms, format, pillar, purpose, status, 
        publish_at_by_platform, caption_by_platform, created_at, updated_at
      )
      VALUES 
      (
        gen_random_uuid(),
        '["Instagram", "WhatsApp Status"]'::jsonb,
        'Carousel',
        'Craft & Light',
        'Behind the scenes of our unhurried toddler pacing in the Maitama studio',
        'Scheduled',
        '{"Instagram": "Next Monday 10:00 AM", "WhatsApp": "Next Monday 10:00 AM"}'::jsonb,
        '{"Instagram": "We don''t ask children to perform. We let them explore, laugh, and pause. Unhurried toddler portraits in Abuja."}'::jsonb,
        NOW(), NOW()
      ),
      (
        gen_random_uuid(),
        '["LinkedIn", "Instagram"]'::jsonb,
        'Editorial Image',
        'Executive Presence',
        'Why executive portraits in Abuja require gentle, architectural lighting',
        'Drafting',
        '{"LinkedIn": "Thursday 12:00 PM"}'::jsonb,
        '{"LinkedIn": "Executive gravitas is not rigid. It is quiet calm, confident poise, and tailored presence."}'::jsonb,
        NOW(), NOW()
      ),
      (
        gen_random_uuid(),
        '["TikTok", "Instagram"]'::jsonb,
        'Short Reel',
        'Purity & Pacing',
        'Lighting setup for luxury maternity portraits in Maitama',
        'Published',
        '{"TikTok": "Yesterday 4:00 PM"}'::jsonb,
        '{"TikTok": "Sculpting gentle shadows for expectant mothers."}'::jsonb,
        NOW(), NOW()
      ),
      (
        gen_random_uuid(),
        '["Instagram", "TikTok"]'::jsonb,
        'Carousel',
        'Cultural Heritage',
        'Regal traditional Aso-Oke portraits captured with natural contrast',
        'Scheduled',
        '{"Instagram": "Saturday 11:30 AM"}'::jsonb,
        '{"Instagram": "Honoring ancestral fabric, heirloom beadwork, and timeless elegance."}'::jsonb,
        NOW(), NOW()
      )
    `);
    console.log("✓ content_item rows seeded into Neon DB.");
  } else {
    console.log(`content_item already has ${existingItems[0]?.count} rows.`);
  }

  // 2. Ensure test clients exist for conversations
  const client1 = await sql.query(`
    INSERT INTO client (id, name, whatsapp_e164, email, source_first, messaging_consent, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Hadiza Mohammed', '+2348031234567', 'hadiza@example.com', 'WhatsApp Concierge', true, NOW(), NOW())
    ON CONFLICT (whatsapp_e164) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `);

  const client2 = await sql.query(`
    INSERT INTO client (id, name, whatsapp_e164, email, source_first, messaging_consent, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Dr. David O.', '+2348129876543', 'david@example.com', 'WhatsApp Concierge', true, NOW(), NOW())
    ON CONFLICT (whatsapp_e164) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `);

  const c1Id = client1[0].id;
  const c2Id = client2[0].id;

  // 3. Seed Conversations & Messages
  const existingConvs = await sql.query(`SELECT count(*)::int as count FROM conversation`);
  if (existingConvs[0]?.count === 0) {
    console.log("Seeding conversation and message rows into DB...");
    const conv1 = await sql.query(`
      INSERT INTO conversation (id, client_id, channel, state, last_inbound_at, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, 'WhatsApp', 'bot', NOW() - INTERVAL '15 minutes', NOW(), NOW())
      RETURNING id
    `, [c1Id]);

    const conv2 = await sql.query(`
      INSERT INTO conversation (id, client_id, channel, state, last_inbound_at, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, 'WhatsApp', 'human', NOW() - INTERVAL '45 minutes', NOW(), NOW())
      RETURNING id
    `, [c2Id]);

    // Insert messages for conv 1
    await sql.query(`
      INSERT INTO message (id, conversation_id, direction, body, ai_label, ai_draft, status, created_at, updated_at)
      VALUES 
      (
        gen_random_uuid(), $1, 'inbound',
        'Good morning! Can we bring three outfits for our twin girls'' 1st birthday shoot in Maitama?',
        'Wardrobe & Pacing Inquiry',
        'Hello Hadiza! Absolutely, your Luxury collection comfortably accommodates 3 to 4 outfit changes for both girls with calm breaks.',
        'received', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes'
      )
    `, [conv1[0].id]);

    // Insert messages for conv 2
    await sql.query(`
      INSERT INTO message (id, conversation_id, direction, body, ai_label, ai_draft, status, created_at, updated_at)
      VALUES 
      (
        gen_random_uuid(), $1, 'inbound',
        'I need to reschedule our executive headshots from Thursday to Friday afternoon if possible.',
        'Reschedule Request',
        'Hello Dr. David! We have Friday at 2:30 PM open in our Maitama studio. Let us know if that works smoothly for your schedule.',
        'received', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes'
      )
    `, [conv2[0].id]);

    console.log("✓ conversation and message rows seeded into Neon DB.");
  } else {
    console.log(`conversation already has ${existingConvs[0]?.count} rows.`);
  }

  console.log("=== DB SEEDING COMPLETED ===");
}

seedCalendarAndInbox().catch(console.error);
