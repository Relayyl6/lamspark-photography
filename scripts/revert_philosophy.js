const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const sql = neon(process.env.DATABASE_URL);

const CANONICAL_PHOTOS = [
  {
    src: "/images/client/weddings/weddings_1.jpg",
    ar: 0.72,
    cluster: 0,
    z: 3,
    title: "Sacred Unions",
    sub: "Wedding ceremonies",
    d: { x: 30, y: 235, w: 200, rot: -3 },
    m: { x: 12, y: 96, w: 118, rot: -3 },
  },
  {
    src: "/images/client/weddings/weddings_2.jpg",
    ar: 0.72,
    cluster: 0,
    z: 1,
    title: "Cultural Heritage",
    sub: "Aso-Oke & grace",
    d: { x: 178, y: 90, w: 185, rot: 0.5 },
    m: { x: 100, y: 20, w: 118, rot: 0.5 },
  },
  {
    src: "/images/client/events/events_1.jpg",
    ar: 0.72,
    cluster: 0,
    z: 2,
    title: "Milestone Galas",
    sub: "Unscripted warmth",
    d: { x: 345, y: 150, w: 205, rot: 3 },
    m: { x: 200, y: 110, w: 130, rot: 3 },
  },
  {
    src: "/images/client/corporate/corporate_1.jpg",
    ar: 0.72,
    cluster: 1,
    z: 2,
    title: "Executive Gravitas",
    sub: "Commanding presence",
    d: { x: 960, y: 220, w: 210, rot: -2 },
    m: { x: 20, y: 100, w: 130, rot: -2 },
  },
  {
    src: "/images/client/events/events_3.jpg",
    ar: 1.5,
    cluster: 1,
    z: 1,
    title: "Authentic Moments",
    sub: "Life, as it happens",
    d: { x: 1210, y: 140, w: 220, rot: 2.5 },
    m: { x: 180, y: 40, w: 140, rot: 2 },
  },
  {
    src: "/images/client/corporate/corporate_3.jpg",
    ar: 0.72,
    cluster: 2,
    z: 2,
    title: "Dynasty & Legacy",
    sub: "Portraits of honor",
    d: { x: 1780, y: 220, w: 200, rot: -1.5 },
    m: { x: 20, y: 110, w: 130, rot: -1.5 },
  },
  {
    src: "/images/client/corporate/corporate_6.jpg",
    ar: 0.72,
    cluster: 2,
    z: 1,
    title: "Studio Dignity",
    sub: "Tailored composure",
    d: { x: 1990, y: 80, w: 195, rot: 2 },
    m: { x: 170, y: 30, w: 130, rot: 2 },
  },
];

async function update() {
  await sql.query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ('philosophy_photos', $1, NOW())
     ON CONFLICT (key) DO UPDATE
     SET value = $1, updated_at = NOW()`,
    [JSON.stringify(CANONICAL_PHOTOS)]
  );
  console.log('Successfully reverted philosophy_photos in settings to canonical coordinates!');
}

update().catch(console.error);
