import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { hashPassword } from "../lib/auth/session";

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL must be defined in environment");
}

const sql = neon(connectionString);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("Seeding LamSparks production database...");

  // 1. Studio Users (Configured via .env)
  console.log("Syncing staff users from environment...");
  const ownerEmail = (process.env.STUDIO_OWNER_EMAIL || "osemene@lamsparks.com").toLowerCase().trim();
  const ownerPassword = process.env.STUDIO_OWNER_PASSWORD;
  const ownerName = process.env.STUDIO_OWNER_NAME || "Osemene (Studio Owner)";

  const leadEmail = (process.env.STUDIO_LEAD_EMAIL || "staff@lamsparks.com").toLowerCase().trim();
  const leadPassword = process.env.STUDIO_LEAD_PASSWORD;
  const leadName = process.env.STUDIO_LEAD_NAME || "Chidi Okafor (Lead Photographer)";

  const assistantEmail = (process.env.STUDIO_ASSISTANT_EMAIL || "assistant@lamsparks.com").toLowerCase().trim();
  const assistantPassword = process.env.STUDIO_ASSISTANT_PASSWORD;
  const assistantName = process.env.STUDIO_ASSISTANT_NAME || "Zainab Bello (Studio Assistant)";

  if (!ownerPassword || !leadPassword || !assistantPassword) {
    throw new Error(
      "Missing staff passwords in environment. Please define STUDIO_OWNER_PASSWORD, STUDIO_LEAD_PASSWORD, and STUDIO_ASSISTANT_PASSWORD in .env.local"
    );
  }

  const usersToInsert = [
    {
      email: ownerEmail,
      name: ownerName,
      role: "owner",
      passwordHash: hashPassword(ownerPassword),
      active: true,
    },
    {
      email: leadEmail,
      name: leadName,
      role: "full",
      passwordHash: hashPassword(leadPassword),
      active: true,
    },
    {
      email: assistantEmail,
      name: assistantName,
      role: "limited",
      passwordHash: hashPassword(assistantPassword),
      active: true,
    },
  ];

  for (const u of usersToInsert) {
    await db
      .insert(schema.users)
      .values(u)
      .onConflictDoUpdate({
        target: schema.users.email,
        set: { passwordHash: u.passwordHash, role: u.role, name: u.name, active: u.active, updatedAt: new Date() },
      });
  }

  // 2. Settings (Bank details from .env)
  console.log("Seeding studio settings...");
  const bankName = process.env.BANK_NAME || "Fidelity Bank";
  const bankAccountNumber = process.env.BANK_ACCOUNT_NUMBER || "5601662438";
  const bankAccountName = process.env.BANK_ACCOUNT_NAME || "Lamsparks Photography";

  await db
    .insert(schema.settings)
    .values({
      key: "studio_config",
      value: {
        studioName: "LamSparks Photography",
        location: "Abuja, Nigeria",
        businessNumber: "+2348130847299",
        workingHours: "09:00 - 18:00 (Africa/Lagos)",
        sendingHours: "09:00 - 19:00 (Africa/Lagos)",
        stalledAfterHours: 48,
        weeklyCapacity: 12,
        bankDetails: {
          bankName,
          accountNumber: bankAccountNumber,
          accountName: bankAccountName,
        },
        depositDefaults: {
          defaultPercent: 70,
          maternityPercent: 50,
        },
      },
    })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: {
        value: {
          studioName: "LamSparks Photography",
          location: "Abuja, Nigeria",
          businessNumber: "+2348130847299",
          workingHours: "09:00 - 18:00 (Africa/Lagos)",
          sendingHours: "09:00 - 19:00 (Africa/Lagos)",
          stalledAfterHours: 48,
          weeklyCapacity: 12,
          bankDetails: {
            bankName,
            accountNumber: bankAccountNumber,
            accountName: bankAccountName,
          },
          depositDefaults: {
            defaultPercent: 70,
            maternityPercent: 50,
          },
        },
        updatedAt: new Date(),
      },
    });

  // 3. Packages
  console.log("Seeding packages...");
  const catalogPackages = [
    // Toddler / Child
    {
      sessionType: "toddler",
      name: "The Essence",
      slug: "toddler-essence",
      description: "Plain backdrop, minimal props, 1 outfit, short gentle session.",
      startingPrice: 95000,
      deliverables: ["1 studio setup", "1 outfit", "3 edited high-res images", "Soft copy delivery"],
      active: true,
    },
    {
      sessionType: "toddler",
      name: "The Basic",
      slug: "toddler-basic",
      description: "Classic studio portraits with custom staging.",
      startingPrice: 180000,
      deliverables: ["1 studio setup", "1 outfit", "5 edited high-res images", "Complimentary gift"],
      active: true,
    },
    {
      sessionType: "toddler",
      name: "The Premium (Best Seller)",
      slug: "toddler-premium",
      description: "Our signature child experience with multi-setup styling.",
      startingPrice: 350000,
      deliverables: ["2 studio setups", "2 to 3 outfits", "10 edited images", "1 small frame", "Complimentary gift"],
      active: true,
    },
    {
      sessionType: "toddler",
      name: "Luxury",
      slug: "toddler-luxury",
      description: "Heirloom coverage covering all siblings with family portrait included.",
      startingPrice: 650000,
      deliverables: [
        "3 studio setups",
        "3 to 4 outfits",
        "20 edited images",
        "1 medium frame",
        "1 photo album",
        "Family session with 4 edited images",
      ],
      active: true,
    },

    // Maternity
    {
      sessionType: "maternity",
      name: "Mini Glow",
      slug: "maternity-mini-glow",
      description: "Intimate and focused maternity session celebrating mother.",
      startingPrice: 140000,
      deliverables: ["1 outfit", "5 edited high-res images", "Soft copy delivery"],
      active: true,
    },
    {
      sessionType: "maternity",
      name: "Classic Bloom",
      slug: "maternity-classic-bloom",
      description: "Elevated studio lighting with wardrobe changes.",
      startingPrice: 185000,
      deliverables: ["2 outfits", "8 edited images", "Soft copy delivery"],
      active: true,
    },
    {
      sessionType: "maternity",
      name: "Signature Grace",
      slug: "maternity-signature-grace",
      description: "Editorial gown draping and expressive motherhood portraits.",
      startingPrice: 255000,
      deliverables: ["2 to 3 outfits", "12 edited images", "Soft copy delivery"],
      active: true,
    },
    {
      sessionType: "maternity",
      name: "Luxury Motherhood",
      slug: "maternity-luxury-motherhood",
      description: "Grand editorial production with cinematic motion reel and frameless wall art.",
      startingPrice: 520000,
      deliverables: [
        "Multiple outfit changes",
        "18 edited images",
        "Cinematic Instagram reels video",
        "16x20 frameless art print",
      ],
      active: true,
    },

    // Event Coverage
    {
      sessionType: "event",
      name: "2 Hours Coverage",
      slug: "event-2-hours",
      description: "Intimate gatherings, birthdays, and private milestone dinners.",
      startingPrice: 120000,
      deliverables: ["2 hours continuous coverage", "Professionally retouched gallery", "Online delivery"],
      active: true,
    },
    {
      sessionType: "event",
      name: "4 Hours Coverage (Popular)",
      slug: "event-4-hours",
      description: "Comprehensive celebration and ceremony coverage.",
      startingPrice: 200000,
      deliverables: ["4 hours continuous coverage", "Professionally retouched gallery", "Online delivery"],
      active: true,
    },
    {
      sessionType: "event",
      name: "6 Hours Coverage",
      slug: "event-6-hours",
      description: "Full event documentary with guest portraits and decor details.",
      startingPrice: 300000,
      deliverables: ["6 hours continuous coverage", "Full documentary storytelling", "Online delivery"],
      active: true,
    },
  ];

  for (const pkg of catalogPackages) {
    await db
      .insert(schema.packages)
      .values(pkg)
      .onConflictDoUpdate({
        target: schema.packages.slug,
        set: {
          name: pkg.name,
          startingPrice: pkg.startingPrice,
          deliverables: pkg.deliverables,
          description: pkg.description,
          active: true,
        },
      });
  }

  // 4. Add-ons
  console.log("Seeding add-ons...");
  const catalogAddOns = [
    {
      name: "Extra Edited Image",
      slug: "extra-edited-image",
      sessionTypes: ["maternity", "toddler", "portrait", "family"],
      unitPrice: 10000,
      description: "Per additional high-resolution retouched image.",
      active: true,
    },
    {
      name: "Express Delivery (3-5 Days)",
      slug: "express-delivery-maternity",
      sessionTypes: ["maternity", "toddler"],
      unitPrice: 30000,
      description: "Priority post-production expedited in 3 to 5 business days.",
      active: true,
    },
    {
      name: "Express Delivery (24-48 Hours)",
      slug: "express-delivery-event",
      sessionTypes: ["event"],
      unitPrice: 30000,
      description: "Rapid delivery for social and media press.",
      active: true,
    },
    {
      name: "Content Highlight Reels (2 Videos)",
      slug: "highlight-reels",
      sessionTypes: ["maternity", "event"],
      unitPrice: 150000,
      description: "Professionally edited vertical reels for Instagram & TikTok.",
      active: true,
    },
    {
      name: "Additional Family Member",
      slug: "additional-family-member",
      sessionTypes: ["toddler", "maternity"],
      unitPrice: 25000,
      description: "Includes partner, sibling, or grandparent in the session.",
      active: true,
    },
  ];

  for (const addon of catalogAddOns) {
    await db
      .insert(schema.addOns)
      .values(addon)
      .onConflictDoUpdate({
        target: schema.addOns.slug,
        set: {
          name: addon.name,
          unitPrice: addon.unitPrice,
          description: addon.description,
          sessionTypes: addon.sessionTypes,
          active: true,
        },
      });
  }

  // 5. Pricing Rules
  console.log("Seeding pricing rules...");
  const rules = [
    {
      sessionType: "maternity",
      ruleType: "bundle_discount",
      parameters: { partnerSession: "newborn", discountPercent: 15 },
      active: true,
    },
    {
      sessionType: "general",
      ruleType: "lead_time_premium",
      parameters: { thresholdDays: 5, surchargePercent: 20 },
      active: true,
    },
  ];

  for (const r of rules) {
    await db.insert(schema.pricingRules).values(r);
  }

  // 6. Policies
  console.log("Seeding policies...");
  const policiesList = [
    {
      sessionType: "maternity",
      reschedulePolicy: "One free reschedule with at least 48 hours notice. 30-minute grace period on start time.",
      paymentTerms: "50% non-refundable deposit to lock calendar, balance due on or before shoot day.",
      imageTurnaroundDays: 10,
    },
    {
      sessionType: "toddler",
      reschedulePolicy: "Reschedule with at least 48 hours notice; under 48 hours forfeits deposit.",
      paymentTerms: "70% non-refundable deposit to lock date, balance paid on or before session day.",
      imageTurnaroundDays: 14,
    },
    {
      sessionType: "event",
      reschedulePolicy: "Date changes subject to studio availability with 7 days written notice.",
      paymentTerms: "70% booking deposit, balance settled prior to gallery delivery.",
      imageTurnaroundDays: 7,
    },
  ];

  for (const pol of policiesList) {
    await db
      .insert(schema.policies)
      .values(pol)
      .onConflictDoUpdate({
        target: schema.policies.sessionType,
        set: {
          reschedulePolicy: pol.reschedulePolicy,
          paymentTerms: pol.paymentTerms,
          imageTurnaroundDays: pol.imageTurnaroundDays,
        },
      });
  }

  // 7. Testimonials
  console.log("Seeding testimonials...");
  const sampleTestimonials = [
    {
      firstName: "Amina",
      sessionType: "maternity",
      quote: "Osemene made me feel so radiant and safe during our maternity session. The portraits are pure art.",
      context: "Studio Session, Abuja",
      active: true,
    },
    {
      firstName: "Dr. Kalu",
      sessionType: "family",
      quote: "Patience with children is rare. LamSparks captured our toddler's true joy without forcing a single pose.",
      context: "Maitama Studio",
      active: true,
    },
  ];
  for (const t of sampleTestimonials) {
    await db.insert(schema.testimonials).values(t);
  }

  console.log("✅ Database successfully synced from environment!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed error:", err);
    process.exit(1);
  });
