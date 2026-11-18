const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

async function seed() {
  console.log('Seeding enquiries and clients into Neon DB...');

  const clients = [
    {
      name: 'Kamsi & Parents',
      whatsapp: '+2348012345678',
      email: 'kamsi.milestone@example.com',
      source: 'Instagram'
    },
    {
      name: 'Ngozi Okonkwo',
      whatsapp: '+2348023456789',
      email: 'ngozi.maternity@example.com',
      source: 'WhatsApp'
    },
    {
      name: 'Chief Adeyemi',
      whatsapp: '+2348034567890',
      email: 'chief.adeyemi@example.com',
      source: 'Referral'
    },
    {
      name: 'Dr. & Mrs. Ibrahim',
      whatsapp: '+2348045678901',
      email: 'ibrahim.wedding@example.com',
      source: 'Website'
    }
  ];

  const clientMap = {};
  for (const c of clients) {
    const res = await sql.query(`
      INSERT INTO client (id, name, whatsapp_e164, email, source_first, marketing_consent, messaging_consent, no_celebratory, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, true, true, false, NOW(), NOW())
      ON CONFLICT (whatsapp_e164) DO UPDATE SET name = $1, email = $3, updated_at = NOW()
      RETURNING id;
    `, [c.name, c.whatsapp, c.email, c.source]);
    clientMap[c.whatsapp] = res[0].id;
  }

  const enquiries = [
    {
      client_id: clientMap['+2348012345678'],
      reference_code: 'LS-9B2K',
      session_type: 'toddler',
      stage: 'deposit_reported',
      waiting_on: 'us',
      source: 'Instagram',
      custom_quote: false,
      purpose_text: '1st Birthday Milestone for baby Kamsi',
      feeling_text: 'Pure joy, unhurried, warm neutral backdrops',
      answers: JSON.stringify({
        purpose: '1st Birthday Milestone',
        childName: 'Kamsi',
        childAge: '1',
        additionalFamilyCount: 1,
        agreedPrice: 680000
      })
    },
    {
      client_id: clientMap['+2348023456789'],
      reference_code: 'LS-4M7L',
      session_type: 'maternity',
      stage: 'deposit_paid',
      waiting_on: 'us',
      source: 'WhatsApp',
      custom_quote: false,
      purpose_text: 'First pregnancy at 32 weeks',
      feeling_text: 'Serene, regal, soft drapery',
      answers: JSON.stringify({
        purpose: 'First pregnancy',
        weeksPregnant: '32 weeks',
        agreedPrice: 255000
      })
    },
    {
      client_id: clientMap['+2348034567890'],
      reference_code: 'LS-7T3Q',
      session_type: 'event',
      stage: 'editing',
      waiting_on: 'us',
      source: 'Referral',
      custom_quote: false,
      purpose_text: '60th Birthday Celebration Banquet',
      feeling_text: 'Dignified, warm, documentary',
      answers: JSON.stringify({
        purpose: '60th Birthday Banquet',
        agreedPrice: 500000
      })
    },
    {
      client_id: clientMap['+2348045678901'],
      reference_code: 'LS-3P8X',
      session_type: 'wedding',
      stage: 'enquiry',
      waiting_on: 'us',
      source: 'Website',
      custom_quote: true,
      purpose_text: 'Two-day traditional & church wedding in Abuja',
      feeling_text: 'Timeless luxury, majestic',
      answers: JSON.stringify({
        purpose: 'Two-day wedding in Abuja',
        agreedPrice: 1500000
      })
    }
  ];

  const enqMap = {};
  for (const e of enquiries) {
    const res = await sql.query(`
      INSERT INTO enquiry (id, client_id, reference_code, session_type, stage, waiting_on, stage_entered_at, source, custom_quote, purpose_text, feeling_text, answers, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9, $10::jsonb, NOW(), NOW())
      ON CONFLICT (reference_code) DO UPDATE SET stage = $4, waiting_on = $5, updated_at = NOW()
      RETURNING id, reference_code;
    `, [e.client_id, e.reference_code, e.session_type, e.stage, e.waiting_on, e.source, e.custom_quote, e.purpose_text, e.feeling_text, e.answers]);
    enqMap[res[0].reference_code] = res[0].id;
  }

  // Seed payments
  const payments = [
    {
      enquiry_id: enqMap['LS-9B2K'],
      kind: 'deposit',
      amount_expected: 476000,
      amount_recorded: null,
      status: 'pending',
      screenshot_asset_id: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      bank_reference: null,
      recorded_by: null
    },
    {
      enquiry_id: enqMap['LS-4M7L'],
      kind: 'deposit',
      amount_expected: 178500,
      amount_recorded: 178500,
      status: 'verified',
      screenshot_asset_id: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      bank_reference: 'GTB-TXN-88492019',
      recorded_by: 'Osemene'
    }
  ];

  for (const p of payments) {
    await sql.query(`
      INSERT INTO payment (id, enquiry_id, kind, amount_expected, amount_recorded, status, screenshot_asset_id, bank_reference, recorded_by, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    `, [p.enquiry_id, p.kind, p.amount_expected, p.amount_recorded, p.status, p.screenshot_asset_id, p.bank_reference, p.recorded_by]);
  }

  console.log('Seeded 4 enquiries, clients, and payments successfully into Neon DB!');
}

seed().catch(console.error);
