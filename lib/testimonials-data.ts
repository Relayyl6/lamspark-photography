export interface EditorialTestimonial {
  id: string;
  index: string; // e.g. "01"
  clientName: string;
  roleOrLocation: string;
  headline: string;
  quote: string;
  avatarUrl: string;
}

export const ATELIER_TESTIMONIALS: EditorialTestimonial[] = [
  {
    id: "amina-toddler",
    index: "01",
    clientName: "Amina Al-Hassan",
    roleOrLocation: "Toddler Luxury Session · Maitama, Abuja",
    headline: "Everything is Utterly Perfect!",
    quote: "From low-light shots to quiet intimate moments, this team never lets us down. Osemene has an extraordinary gift with children—our two-year-old was giggling without pressure, and the heirloom portraits on our wall bring tears to my eyes every day. Absolute game-changer!",
    avatarUrl: "/images/client/events_4.jpg",
  },
  {
    id: "chidinma-maternity",
    index: "02",
    clientName: "Chidinma & Obinna Eze",
    roleOrLocation: "Maternity Signature Grace · Guzape, Abuja",
    headline: "Pure Grace & Dignity.",
    quote: "Carrying our first child was both exhilarating and vulnerable. Osemene made me feel calm, dignified, and breathtakingly beautiful. There was zero awkwardness—just pure grace, delicate natural lighting, and unhurried artistry.",
    avatarUrl: "/images/client/events_2.jpg",
  },
  {
    id: "hadiza-newborn",
    index: "03",
    clientName: "Hadiza & Farouk Bello",
    roleOrLocation: "Newborn Archival Heirloom · Asokoro, Abuja",
    headline: "A Sanctuary for Memories.",
    quote: "The Maitama studio was warm, serene, and entirely baby-led. Osemene paused whenever our daughter needed feeding or quiet comfort. You do not simply receive pictures from LamSparks; you receive museum-grade family heirlooms.",
    avatarUrl: "/images/client/events_3.jpg",
  },
  {
    id: "folashade-dynasty",
    index: "04",
    clientName: "Chief (Mrs.) Folashade Adeleke",
    roleOrLocation: "Three-Generation Dynasty · Wuse II, Abuja",
    headline: "Generational Regality.",
    quote: "Gathering three generations for a portrait usually feels like an impossible trial. Osemene orchestrated our family with such warmth and regal composure that everyone—from grandma to my grandbabies—felt profoundly cherished.",
    avatarUrl: "/images/client/corporate_3.jpg",
  },
  {
    id: "zainab-melanin",
    index: "05",
    clientName: "Zainab & Tariq Mohammed",
    roleOrLocation: "Sunset Milestone · Jabi Lake, Abuja",
    headline: "Luminous Melanin Skin Tones.",
    quote: "The master colour grading for our melanin skin tones is unlike anything I have seen in Nigeria. No plastic artificial smoothing—just deep, luminous, generational skin tones that look breathlessly alive.",
    avatarUrl: "/images/client/weddings_2.jpg",
  },
  {
    id: "ngozi-atelier",
    index: "06",
    clientName: "Dr. Ngozi Okonjo-Nwosu",
    roleOrLocation: "Private Atelier Session · Katampe Hills, Abuja",
    headline: "Bespoke Luxury Redefined.",
    quote: "From the chilled hibiscus infusion upon arrival to the velvet-touch archival prints in handcrafted linen folios, LamSparks sets the absolute gold standard for luxury portraiture in West Africa.",
    avatarUrl: "/images/client/events_5.jpg",
  },
  {
    id: "tunde-executive",
    index: "07",
    clientName: "Tunde & Bankole Partners",
    roleOrLocation: "Executive Archival Portraits · Central Area, Abuja",
    headline: "Crisp, Warm & Authoritative.",
    quote: "We commissioned portraits for our corporate advisory partners. LamSparks delivered beyond all expectation—authoritative yet remarkably warm, completely transcending conventional corporate headshots.",
    avatarUrl: "/images/client/corporate_1.jpg",
  },
  {
    id: "halima-motherhood",
    index: "08",
    clientName: "Halima & Baby Kamsi",
    roleOrLocation: "Motherhood Legacy Bundle · Gwarinpa, Abuja",
    headline: "Tender, Unhurried Magic.",
    quote: "Having our maternity session flow seamlessly into the newborn portraits with matching tonality and handcrafted framing made our keepsake album look like an international art publication.",
    avatarUrl: "/images/client/events_1.jpg",
  },
];
