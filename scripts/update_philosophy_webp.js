const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

const updatedPhotos = [
  {
    d: { w: 200, x: 30, y: 235, rot: -3 },
    m: { w: 118, x: 12, y: 96, rot: -3 },
    z: 3,
    ar: 0.72,
    src: '/images/client/weddings_1.webp',
    sub: 'Wedding ceremonies',
    title: 'Sacred Unions',
    cluster: 0
  },
  {
    d: { w: 185, x: 178, y: 90, rot: 0.5 },
    m: { w: 118, x: 100, y: 20, rot: 0.5 },
    z: 1,
    ar: 0.72,
    src: '/images/client/weddings_2.webp',
    sub: 'Aso-Oke & grace',
    title: 'Cultural Heritage',
    cluster: 0
  },
  {
    d: { w: 205, x: 345, y: 150, rot: 3 },
    m: { w: 130, x: 200, y: 110, rot: 3 },
    z: 2,
    ar: 0.72,
    src: '/images/client/events_1.webp',
    sub: 'Unscripted warmth',
    title: 'Milestone Galas',
    cluster: 0
  },
  {
    d: { w: 210, x: 960, y: 220, rot: -2 },
    m: { w: 130, x: 20, y: 100, rot: -2 },
    z: 2,
    ar: 0.72,
    src: '/images/client/corporate_1.webp',
    sub: 'Commanding presence',
    title: 'Executive Gravitas',
    cluster: 1
  },
  {
    d: { w: 220, x: 1210, y: 140, rot: 2.5 },
    m: { w: 140, x: 180, y: 40, rot: 2 },
    z: 1,
    ar: 0.72,
    src: '/images/client/events_3.webp',
    sub: 'Life, as it happens',
    title: 'Authentic Moments',
    cluster: 1
  },
  {
    d: { w: 200, x: 1780, y: 220, rot: -1.5 },
    m: { w: 130, x: 20, y: 110, rot: -1.5 },
    z: 2,
    ar: 0.72,
    src: '/images/client/corporate_3.webp',
    sub: 'Portraits of honor',
    title: 'Dynasty & Legacy',
    cluster: 2
  },
  {
    d: { w: 195, x: 1990, y: 80, rot: 2 },
    m: { w: 130, x: 170, y: 30, rot: 2 },
    z: 1,
    ar: 0.72,
    src: '/images/client/corporate_6.webp',
    sub: 'Tailored composure',
    title: 'Studio Dignity',
    cluster: 2
  }
];

async function run() {
  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('philosophy_photos', ${JSON.stringify(updatedPhotos)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = ${JSON.stringify(updatedPhotos)}::jsonb, updated_at = NOW()
  `;
  console.log("Successfully updated philosophy_photos in settings table with WebP!");
}

run().catch(console.error);
