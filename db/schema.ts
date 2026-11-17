import { pgTable, text, timestamp, boolean, integer, jsonb, uuid, index } from "drizzle-orm/pg-core";

// 1. client
export const clients = pgTable(
  "client",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    whatsappE164: text("whatsapp_e164").notNull().unique(),
    email: text("email"),
    instagramHandle: text("instagram_handle"),
    sourceFirst: text("source_first"),
    notes: text("notes"),
    ownerId: text("owner_id"),
    marketingConsent: boolean("marketing_consent").default(false).notNull(),
    marketingConsentAt: timestamp("marketing_consent_at", { withTimezone: true }),
    marketingConsentWording: text("marketing_consent_wording"),
    messagingConsent: boolean("messaging_consent").default(true).notNull(),
    messagingConsentAt: timestamp("messaging_consent_at", { withTimezone: true }),
    messagingConsentWording: text("messaging_consent_wording"),
    noCelebratory: boolean("no_celebratory").default(false).notNull(),
    restrictedComfortNote: text("restricted_comfort_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    whatsappIdx: index("client_whatsapp_idx").on(table.whatsappE164),
  })
);

// 2. client_person
export const clientPersons = pgTable("client_person", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .references(() => clients.id, { onDelete: "cascade" })
    .notNull(),
  kind: text("kind").notNull(), // child | partner | family_member
  name: text("name").notNull(),
  age: integer("age"),
  birthdate: text("birthdate"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. package
export const packages = pgTable("package", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionType: text("session_type").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  startingPrice: integer("starting_price").notNull(), // in whole Naira or kobo
  deliverables: jsonb("deliverables"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. add_on
export const addOns = pgTable("add_on", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sessionTypes: jsonb("session_types"),
  unitPrice: integer("unit_price").notNull(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 5. pricing_rule
export const pricingRules = pgTable("pricing_rule", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionType: text("session_type").notNull(),
  ruleType: text("rule_type").notNull(), // lead_time_premium | location_fee | weekend_premium | discount
  parameters: jsonb("parameters").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 6. policy
export const policies = pgTable("policy", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionType: text("session_type").notNull().unique(),
  reschedulePolicy: text("reschedule_policy").notNull(),
  paymentTerms: text("payment_terms").notNull(),
  imageTurnaroundDays: integer("image_turnaround_days").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 7. enquiry
export const enquiries = pgTable(
  "enquiry",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .references(() => clients.id)
      .notNull(),
    sessionType: text("session_type").notNull(),
    packageId: uuid("package_id").references(() => packages.id),
    stage: text("stage").notNull().default("new_lead"),
    ownerId: text("owner_id"),
    waitingOn: text("waiting_on").notNull().default("us"), // client | us
    stageEnteredAt: timestamp("stage_entered_at", { withTimezone: true }).defaultNow().notNull(),
    source: text("source").default("web"),
    sourceDetail: text("source_detail"),
    referenceCode: text("reference_code").notNull().unique(),
    customQuote: boolean("custom_quote").default(false).notNull(),
    purposeText: text("purpose_text"),
    feelingText: text("feeling_text"),
    answers: jsonb("answers"),
    closedReason: text("closed_reason"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    referredByClientId: uuid("referred_by_client_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    referenceIdx: index("enquiry_reference_idx").on(table.referenceCode),
    stageQueueIdx: index("enquiry_stage_queue_idx").on(table.stage, table.waitingOn, table.stageEnteredAt),
  })
);

// 8. estimate_snapshot
export const estimateSnapshots = pgTable("estimate_snapshot", {
  id: uuid("id").defaultRandom().primaryKey(),
  enquiryId: uuid("enquiry_id")
    .references(() => enquiries.id, { onDelete: "cascade" })
    .notNull(),
  lineItems: jsonb("line_items").notNull(),
  total: integer("total").notNull(),
  depositPercent: integer("deposit_percent").notNull(),
  depositAmount: integer("deposit_amount").notNull(),
  balanceAmount: integer("balance_amount").notNull(),
  rulesVersion: text("rules_version").notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
  priceAgreedAt: timestamp("price_agreed_at", { withTimezone: true }),
  createdBySession: text("created_by_session"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 9. payment
export const payments = pgTable("payment", {
  id: uuid("id").defaultRandom().primaryKey(),
  enquiryId: uuid("enquiry_id")
    .references(() => enquiries.id, { onDelete: "cascade" })
    .notNull(),
  kind: text("kind").notNull(), // deposit | balance
  amountExpected: integer("amount_expected").notNull(),
  amountRecorded: integer("amount_recorded"),
  status: text("status").notNull().default("reported"), // reported | recorded | rejected
  screenshotAssetId: text("screenshot_asset_id"),
  aiCheck: jsonb("ai_check"),
  recordedBy: text("recorded_by"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }),
  bankReference: text("bank_reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 10. booking
export const bookings = pgTable("booking", {
  id: uuid("id").defaultRandom().primaryKey(),
  enquiryId: uuid("enquiry_id")
    .references(() => enquiries.id, { onDelete: "cascade" })
    .notNull(),
  shootStart: timestamp("shoot_start", { withTimezone: true }).notNull(),
  shootEnd: timestamp("shoot_end", { withTimezone: true }).notNull(),
  locationType: text("location_type").notNull().default("studio"), // studio | outside | both
  locationDetail: text("location_detail"),
  status: text("status").notNull().default("confirmed"), // confirmed | rescheduled | cancelled | completed
  rescheduleCount: integer("reschedule_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 11. preparation
export const preparations = pgTable("preparation", {
  id: uuid("id").defaultRandom().primaryKey(),
  enquiryId: uuid("enquiry_id")
    .references(() => enquiries.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  status: text("status").notNull().default("incomplete"), // incomplete | partial | complete
  answers: jsonb("answers"),
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
  comfortNote: text("comfort_note"),
  healthDetails: text("health_details"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 12. editing_job
export const editingJobs = pgTable("editing_job", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id")
    .references(() => bookings.id, { onDelete: "cascade" })
    .notNull(),
  status: text("status").notNull().default("queued"), // queued | culling | editing | review | done
  dueDate: timestamp("due_date", { withTimezone: true }),
  priority: boolean("priority").default(false).notNull(),
  assignedTo: text("assigned_to"),
  galleryUrl: text("gallery_url"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  galleryExpiresAt: timestamp("gallery_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 13. asset
export const assets = pgTable("asset", {
  id: uuid("id").defaultRandom().primaryKey(),
  storageKey: text("storage_key").notNull(),
  storageBucket: text("storage_bucket").notNull(),
  kind: text("kind").notNull(), // image | video | receipt
  sessionBookingId: uuid("session_booking_id"),
  sessionType: text("session_type"),
  colourGraded: boolean("colour_graded").default(false).notNull(),
  consentStatus: text("consent_status").default("none").notNull(), // none | portfolio | marketing | both
  moodTags: jsonb("mood_tags"),
  settingTags: jsonb("setting_tags"),
  altText: text("alt_text"),
  altTextApproved: boolean("alt_text_approved").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 14. gallery & gallery_item
export const galleries = pgTable("gallery", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  sessionType: text("session_type").notNull(),
  coverAssetId: text("cover_asset_id"),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const galleryItems = pgTable("gallery_item", {
  id: uuid("id").defaultRandom().primaryKey(),
  galleryId: uuid("gallery_id")
    .references(() => galleries.id, { onDelete: "cascade" })
    .notNull(),
  assetId: uuid("asset_id")
    .references(() => assets.id, { onDelete: "cascade" })
    .notNull(),
  caption: text("caption"),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 15. story
export const stories = pgTable("story", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  sessionType: text("session_type").notNull(),
  clientName: text("client_name"),
  body: text("body").notNull(),
  featuredAssetId: text("featured_asset_id"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 16. testimonial
export const testimonials = pgTable("testimonial", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: text("first_name").notNull(),
  sessionType: text("session_type").notNull(),
  quote: text("quote").notNull(),
  context: text("context"),
  consentAt: timestamp("consent_at", { withTimezone: true }),
  approvedBy: text("approved_by"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 17. journal_post
export const journalPosts = pgTable("journal_post", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  body: text("body").notNull(),
  heroAssetId: text("hero_asset_id"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 18. content_item
export const contentItems = pgTable("content_item", {
  id: uuid("id").defaultRandom().primaryKey(),
  platforms: jsonb("platforms").notNull(), // array of strings e.g. ["instagram", "tiktok"]
  format: text("format").notNull(), // reel, carousel, single
  purpose: text("purpose").notNull(),
  pillar: text("pillar").notNull(),
  sessionType: text("session_type"),
  assetIds: jsonb("asset_ids"),
  captionByPlatform: jsonb("caption_by_platform"),
  publishAtByPlatform: jsonb("publish_at_by_platform"),
  status: text("status").notNull().default("idea"), // idea | drafting | approved | scheduled | posted | reviewed
  liveUrlByPlatform: jsonb("live_url_by_platform"),
  journalPostId: uuid("journal_post_id"),
  sourceTag: text("source_tag"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 19. caption_bank & weekly_target
export const captionBanks = pgTable("caption_bank", {
  id: uuid("id").defaultRandom().primaryKey(),
  text: text("text").notNull(),
  pillar: text("pillar").notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const weeklyTargets = pgTable("weekly_target", {
  id: uuid("id").defaultRandom().primaryKey(),
  platform: text("platform").notNull(), // instagram | tiktok | journal
  perWeek: integer("per_week").notNull().default(3),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 20. conversation & message
export const conversations = pgTable(
  "conversation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    channel: text("channel").notNull().default("whatsapp"), // whatsapp | instagram | facebook | web
    state: text("state").notNull().default("bot"), // bot | human | closed
    takenOverBy: text("taken_over_by"),
    lastInboundAt: timestamp("last_inbound_at", { withTimezone: true }),
    windowExpiresAt: timestamp("window_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    windowExpiresIdx: index("conversation_window_expires_idx").on(table.windowExpiresAt),
  })
);

export const messages = pgTable("message", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .references(() => conversations.id, { onDelete: "cascade" })
    .notNull(),
  direction: text("direction").notNull(), // inbound | outbound
  body: text("body").notNull(),
  templateName: text("template_name"),
  status: text("status").notNull().default("sent"), // queued | sent | delivered | read | failed
  setting: text("setting").notNull().default("automatic"), // automatic | reviewed | personal
  aiLabel: text("ai_label"),
  aiDraft: text("ai_draft"),
  sentBy: text("sent_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 21. template, consent_log, user, audit_event, settings
export const templates = pgTable("template", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(), // utility | marketing
  body: text("body").notNull(),
  variables: jsonb("variables"),
  metaStatus: text("meta_status").notNull().default("approved"), // draft | submitted | approved | rejected
  approvedByOwner: boolean("approved_by_owner").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const consentLogs = pgTable("consent_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .references(() => clients.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(), // messaging | marketing_messages | image_use | testimonial
  granted: boolean("granted").notNull(),
  wording: text("wording").notNull(),
  ip: text("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("limited"), // owner | full | limited
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditEvents = pgTable("audit_event", {
  id: uuid("id").defaultRandom().primaryKey(),
  actor: text("actor").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  diff: jsonb("diff"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
