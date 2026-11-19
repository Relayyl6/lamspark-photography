const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function seed() {
  console.log("Seeding site content and settings into Neon DB...");

  // 1. Ensure settings table exists
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key TEXT UNIQUE NOT NULL,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Also ensure site_content table exists
  await sql`
    CREATE TABLE IF NOT EXISTS site_content (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // 2. Initial Data Payloads
  const wheelCards = [
    {
      id: "weddings",
      category: "WEDDINGS",
      label: "Sacred Unions",
      subtitle: "Unhurried wedding ceremonies in Abuja",
      image: "/images/client/weddings_1.jpg",
      href: "/sessions",
    },
    {
      id: "traditional",
      category: "TRADITIONAL",
      label: "Cultural Heritage",
      subtitle: "Vibrant Aso-Oke & generational grace",
      image: "/images/client/weddings_2.jpg",
      href: "/sessions",
    },
    {
      id: "events",
      category: "EVENTS",
      label: "Milestone Galas",
      subtitle: "Unscripted warmth & celebrations",
      image: "/images/client/events_1.jpg",
      href: "/sessions",
    },
    {
      id: "executive",
      category: "EXECUTIVE",
      label: "Executive Leadership",
      subtitle: "Commanding visual presence",
      image: "/images/client/corporate_1.jpg",
      href: "/portfolio",
    },
    {
      id: "lifestyle",
      category: "LIFESTYLE",
      label: "Authentic Moments",
      subtitle: "Honouring unscripted warmth & life",
      image: "/images/client/events_3.jpg",
      href: "/sessions",
    },
    {
      id: "legacy",
      category: "LEGACY",
      label: "Generational Craft",
      subtitle: "Heirloom memories for decades",
      image: "/images/client/corporate_3.jpg",
      href: "/sessions",
    },
    {
      id: "atelier",
      category: "ATELIER",
      label: "Studio Dignity",
      subtitle: "Quiet authority and elegance",
      image: "/images/client/corporate_6.jpg",
      href: "/sessions",
    },
  ];

  const faqs = [
    {
      q: "Where is the LamSparks studio located?",
      a: "Our private portrait studio is based in Abuja, Nigeria. To preserve a peaceful, unhurried atmosphere for every client, studio visits are strictly by appointment. The exact address and directions are provided upon booking confirmation.",
    },
    {
      q: "What is your deposit and payment policy?",
      a: "To reserve your date on our calendar, a non-refundable booking fee is required (70% standard, or 50% for Maternity collections). The remaining balance is due on or before shoot day. Sessions cannot proceed without balance payment.",
    },
    {
      q: "How long until I receive my edited photographs?",
      a: "Standard editing delivery times are tailored to each collection: Toddler sessions take 7 to 14 working days; Maternity takes 10 business days; and Events take 5 to 7 business days. Express Delivery (3 to 5 business days or 24-48 hours for events) is available as an add-on.",
    },
    {
      q: "What if my child or I need to reschedule?",
      a: "We understand that children get sick and unexpected events happen. We offer one complimentary reschedule when you notify us at least 48 hours prior to your session time. Rescheduling with less than 48 hours notice forfeits the booking fee.",
    },
    {
      q: "Do you supply raw or unedited files?",
      a: "No. Raw files are unfinished digital negatives and do not represent the craftsmanship of LamSparks. Every image delivered to you has undergone master colour grading, exposure balance, and fine-art retouching.",
    },
    {
      q: "What should we wear for our session?",
      a: "Upon booking, we send our gentle Prep Guide outlining recommended colour palettes (earth tones, warm neutrals, soft creams, textures) and advice on coordinating outfits without matchy-matchy uniforms.",
    },
    {
      q: "Will my images be published on social media?",
      a: "Only with your explicit consent! We strictly uphold client dignity and NDPA 2023 privacy rights. If you prefer to keep your portraits private, we honour that completely.",
    },
    {
      q: "Can I bring family members to a toddler or maternity session?",
      a: "Yes! Toddler packages include parents or siblings per collection tier (e.g., Luxury covers siblings and includes a family session). For smaller tiers, additional family members or children can be added transparently via our estimate builder.",
    },
  ];

  const stats = [
    {
      value: "10+",
      label: "Years of Empathy",
      desc: "Capturing Nigeria's most tender family and milestone stories.",
      iconName: "Clock",
    },
    {
      value: "1,200+",
      label: "Heirloom Keepsakes",
      desc: "Museum-grade Italian leather albums & archival wooden frames delivered.",
      iconName: "Award",
    },
    {
      value: "100%",
      label: "Unhurried Pace",
      desc: "Only one family per half-day in our Maitama studio. Zero time pressure.",
      iconName: "Heart",
    },
    {
      value: "4.98★",
      label: "Client Reverence",
      desc: "Abuja's premier word-of-mouth studio for families and dignitaries.",
      iconName: "Sparkles",
    },
  ];

  const cameraPerspectives = [
    {
      id: "canon-50",
      name: "Vintage Canon Rangefinder",
      lensSpec: "50mm f/1.8 S.C. · Melanin Tonal Fidelity",
      description: "Upgrade your memories and see life through an unhurried, generational lens. Reserved for intimate portraits in Abuja.",
      tag: "[Calculate Your Estimate ↗]",
    },
    {
      id: "hasselblad-80",
      name: "Medium Format Archival",
      lensSpec: "80mm Planar · Generational Clarity",
      description: "Ample space for changes and quiet moments. Delivering handcrafted heirloom albums and museum-grade frame prints.",
      tag: "[Reserve Your Session ↗]",
    },
    {
      id: "leica-35",
      name: "Atelier 35mm Prime",
      lensSpec: "35mm Summicron · Candid Intimacy",
      description: "Giving quiet moments the reverence they deserve. No rushed schedules, no plastic smoothing, just authentic grace.",
      tag: "[Our Atelier · Maitama]",
    },
  ];

  const testimonials = [
    {
      id: "amina-toddler",
      index: "01",
      clientName: "Amina Al-Hassan",
      roleOrLocation: "Toddler Luxury Session · Maitama, Abuja",
      headline: "Everything is Utterly Perfect!",
      quote: "From low-light shots to quiet intimate moments, this team never lets us down. Osemene has an extraordinary gift with children—our two-year-old was giggling without pressure, and the heirloom portraits on our wall bring tears to my eyes every day. Absolute game-changer!",
      avatarUrl: "/images/client/events_4.jpg",
      active: true,
    },
    {
      id: "chidinma-maternity",
      index: "02",
      clientName: "Chidinma & Obinna Eze",
      roleOrLocation: "Maternity Signature Grace · Guzape, Abuja",
      headline: "Pure Grace & Dignity.",
      quote: "Carrying our first child was both exhilarating and vulnerable. Osemene made me feel calm, dignified, and breathtakingly beautiful. There was zero awkwardness—just pure grace, delicate natural lighting, and unhurried artistry.",
      avatarUrl: "/images/client/events_2.jpg",
      active: true,
    },
    {
      id: "hadiza-newborn",
      index: "03",
      clientName: "Hadiza & Farouk Bello",
      roleOrLocation: "Newborn Archival Heirloom · Asokoro, Abuja",
      headline: "A Sanctuary for Memories.",
      quote: "The Maitama studio was warm, serene, and entirely baby-led. Osemene paused whenever our daughter needed feeding or quiet comfort. You do not simply receive pictures from LamSparks; you receive museum-grade family heirlooms.",
      avatarUrl: "/images/client/events_3.jpg",
      active: true,
    },
    {
      id: "folashade-dynasty",
      index: "04",
      clientName: "Chief (Mrs.) Folashade Adeleke",
      roleOrLocation: "Three-Generation Dynasty · Wuse II, Abuja",
      headline: "Generational Regality.",
      quote: "Gathering three generations for a portrait usually feels like an impossible trial. Osemene orchestrated our family with such warmth and regal composure that everyone—from grandma to my grandbabies—felt profoundly cherished.",
      avatarUrl: "/images/client/corporate_3.jpg",
      active: true,
    },
    {
      id: "zainab-melanin",
      index: "05",
      clientName: "Zainab & Tariq Mohammed",
      roleOrLocation: "Sunset Milestone · Jabi Lake, Abuja",
      headline: "Luminous Melanin Skin Tones.",
      quote: "The master colour grading for our melanin skin tones is unlike anything I have seen in Nigeria. No plastic artificial smoothing—just deep, luminous, generational skin tones that look breathlessly alive.",
      avatarUrl: "/images/client/weddings_2.jpg",
      active: true,
    },
    {
      id: "ngozi-atelier",
      index: "06",
      clientName: "Dr. Ngozi Okonjo-Nwosu",
      roleOrLocation: "Executive Portraiture · Central Business District",
      headline: "Quiet Authority & Dignity.",
      quote: "As an executive, one often dreads corporate photography. Osemene commands an atmosphere of quiet dignity. The lighting was sculpted with architectural precision. Truly world-class.",
      avatarUrl: "/images/client/corporate_1.jpg",
      active: true,
    },
  ];

  const stories = [
    {
      id: "story-1",
      number: "01",
      title: "The Al-Hassan Twins' First Birthday Wonder",
      subtitle: "Unhurried Afternoon in Maitama",
      sessionType: "Toddler Luxury Studio Session",
      sessionSlug: "/sessions#toddler",
      client: "Hadiza & Farouk Al-Hassan",
      date: "September 2026",
      location: "Private Studio Suite, Maitama, Abuja",
      lightDetails: "Soft northern window glow paired with warm bounce reflectors",
      excerpt: "When the twins arrived, they were understandably curious and cautious. We opened our studio floor, offered hand-carved wooden toys, and let their laughter lead the tempo. No timers, no shrill calls to look here.",
      quote: "They did not feel photographed. They felt cherished.",
      quoteAuthor: "Hadiza Al-Hassan",
      studioMood: "Warm, unhurried, fragrant lavender air",
      craft: {
        lens: "50mm f/1.2 L Prime",
        lighting: "Diffused North Skylight",
        pacing: "Baby-led breaks every 20 minutes",
        keepsake: "30-page Italian Nubuck Album",
      },
      image: "/images/client/events_4.jpg",
      imageAlt: "Toddler portrait in warm natural studio light",
      vintageSign: "Abuja Studio Suite · Archive No. 0184",
    },
    {
      id: "story-2",
      number: "02",
      title: "Chidinma & Obinna's Expectant Sunset Serenity",
      subtitle: "A Quiet Reverence for New Life",
      sessionType: "Maternity Signature Grace",
      sessionSlug: "/sessions#maternity",
      client: "Chidinma & Obinna Eze",
      date: "August 2026",
      location: "Guzape Hills & Private Atelier",
      lightDetails: "Golden hour horizon light washing across raw silk drapery",
      excerpt: "Maternity is both deeply vulnerable and breathtakingly powerful. We designed this session around gentle resting postures, soothing teas, and unscripted intimacy between husband and expectant mother.",
      quote: "I never imagined feeling this serene in front of a lens.",
      quoteAuthor: "Chidinma Eze",
      studioMood: "Gentle acoustic harp, soft golden hues",
      craft: {
        lens: "85mm f/1.4 Portrait Prime",
        lighting: "Golden Hour Natural Rim Light",
        pacing: "Resting lounge pauses with herbal infusions",
        keepsake: "Archival Linen Folio Box",
      },
      image: "/images/client/events_2.jpg",
      imageAlt: "Maternity portrait with gentle natural sunset glow",
      vintageSign: "Guzape Atelier · Archive No. 0211",
    },
    {
      id: "story-3",
      number: "03",
      title: "Three Generations of Grace: The Adeleke Dynasty",
      subtitle: "Honouring Matriarchal Wisdom",
      sessionType: "Generational Family Heirloom",
      sessionSlug: "/sessions#family",
      client: "Chief (Mrs.) Folashade Adeleke & Family",
      date: "July 2026",
      location: "Maitama Studio Suite",
      lightDetails: "Sculpted Rembrandt key with gentle ambient fill",
      excerpt: "Gathering grandmother, daughters, and granddaughters in matching rich Aso-Oke textiles. We spent the first hour drinking coffee and sharing stories before the shutter clicked once.",
      quote: "A testament to where our family has journeyed from.",
      quoteAuthor: "Chief (Mrs.) Folashade Adeleke",
      studioMood: "Regal, joyous, multi-generational storytelling",
      craft: {
        lens: "35mm f/1.4 Art & 50mm Prime",
        lighting: "Dual Diffusion Softbox Key",
        pacing: "Storytelling lounge session before shooting",
        keepsake: "Grand Archival Canvas with Hand-applied Varnish",
      },
      image: "/images/client/corporate_3.jpg",
      imageAlt: "Generational family portrait in Abuja",
      vintageSign: "Maitama Studio Suite · Archive No. 0167",
    },
    {
      id: "story-4",
      number: "04",
      title: "Diplomatic Dignity: Official Portraiture",
      subtitle: "Quiet Authority & Leadership",
      sessionType: "Executive & Official Portraits",
      sessionSlug: "/sessions#corporate",
      client: "Dr. Ngozi Okonjo-Nwosu",
      date: "October 2026",
      location: "Central Business District Executive Suite",
      lightDetails: "Crisp architectural key with deliberate dark feathering",
      excerpt: "Modern leadership demands visual dignity without stiffness. We created a portfolio of executive portraits that exude gravitas, approachability, and intellectual sharpness.",
      quote: "Commanding, authentic, and free from artificial airs.",
      quoteAuthor: "Dr. Ngozi Okonjo-Nwosu",
      studioMood: "Focused, sophisticated, classical jazz",
      craft: {
        lens: "105mm f/1.4 Telephoto Prime",
        lighting: "Octabox Key with Black Feather V-Flat",
        pacing: "Tethered real-time iPad review",
        keepsake: "High-Resolution Press & Boardroom Assets",
      },
      image: "/images/client/corporate_1.jpg",
      imageAlt: "Official executive portrait with authoritative lighting",
      vintageSign: "Abuja CBD Suite · Archive No. 0249",
    },
  ];

  const philosophyPhotos = [
    {
      src: "/images/client/weddings/weddings_1.jpg",
      title: "Sacred Unions",
      sub: "Wedding ceremonies",
      ar: 0.72,
      cluster: 0,
      z: 3,
      d: { x: 440, y: 160, w: 200, rot: -3 },
      m: { x: 12, y: 96, w: 118, rot: -3 },
    },
    {
      src: "/images/client/weddings/weddings_2.jpg",
      title: "Cultural Heritage",
      sub: "Aso-Oke & grace",
      ar: 0.72,
      cluster: 0,
      z: 1,
      d: { x: 670, y: 80, w: 195, rot: 1 },
      m: { x: 100, y: 20, w: 118, rot: 0.5 },
    },
    {
      src: "/images/client/events/events_1.jpg",
      title: "Milestone Galas",
      sub: "Unscripted warmth",
      ar: 0.72,
      cluster: 0,
      z: 2,
      d: { x: 890, y: 170, w: 205, rot: 3 },
      m: { x: 200, y: 110, w: 130, rot: 3 },
    },
    {
      src: "/images/client/corporate/corporate_1.jpg",
      title: "Executive Gravitas",
      sub: "Commanding presence",
      ar: 0.72,
      cluster: 1,
      z: 2,
      d: { x: 1560, y: 90, w: 200, rot: -2 },
      m: { x: 24, y: 24, w: 120, rot: -2 },
    },
    {
      src: "/images/client/events/events_3.jpg",
      title: "Authentic Moments",
      sub: "Generational grace",
      ar: 0.72,
      cluster: 1,
      z: 1,
      d: { x: 1790, y: 180, w: 210, rot: 2.5 },
      m: { x: 120, y: 100, w: 130, rot: 2.5 },
    },
    {
      src: "/images/client/corporate/corporate_3.jpg",
      title: "Dynasty & Legacy",
      sub: "Heirloom memories",
      ar: 0.72,
      cluster: 2,
      z: 3,
      d: { x: 2460, y: 80, w: 200, rot: 1 },
      m: { x: 18, y: 30, w: 120, rot: 1 },
    },
    {
      src: "/images/client/corporate/corporate_6.jpg",
      title: "Studio Dignity",
      sub: "Quiet authority",
      ar: 0.72,
      cluster: 2,
      z: 1,
      d: { x: 2690, y: 190, w: 200, rot: -2.5 },
      m: { x: 110, y: 115, w: 125, rot: -3 },
    },
  ];

  const siteTexts = {
    hero_kicker: "I CAPTURE · YOU REMEMBER",
    hero_headline: "REAL MOMENTS. BEAUTIFUL MEMORIES",
    hero_subtitle: "I capture real emotions and raw moments that tell your story in the most authentic and timeless way.",
    about_quote: "I believe the most extraordinary moments are usually the quietest ones.",
    studio_hours: "09:00 – 18:00 WAT · Monday through Saturday",
    studio_address: "Maitama Studio Suite, Maitama District, Abuja, Federal Capital Territory, Nigeria",
    concierge_phone_primary: "+234 813 084 7299",
    concierge_phone_secondary: "+234 906 498 2841",
    concierge_whatsapp: "2348130847299",
    concierge_email: "concierge@lamsparks.com",
  };

  // Upsert all into settings table
  const entries = [
    ["hero_wheel_cards", wheelCards],
    ["site_faqs", faqs],
    ["about_stats", stats],
    ["camera_perspectives", cameraPerspectives],
    ["site_testimonials", testimonials],
    ["site_stories", stories],
    ["philosophy_photos", philosophyPhotos],
    ...Object.entries(siteTexts),
  ];

  for (const [key, val] of entries) {
    await sql`
      INSERT INTO settings (key, value, updated_at)
      VALUES (${key}, ${JSON.stringify(val)}::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = NOW()
    `;

    // Also populate site_content for string keys
    if (typeof val === "string") {
      await sql`
        INSERT INTO site_content (key, value, updated_at)
        VALUES (${key}, ${val}, NOW())
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          updated_at = NOW()
      `;
    }
  }

  console.log("Successfully seeded all settings & site content into Neon DB!");
}

seed().catch(console.error);
