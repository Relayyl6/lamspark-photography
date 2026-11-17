# 11 Architecture and Build Plan

The proposal does not fix a stack. The defaults below suit mobile-first, ownership by the client, and low running cost. Swap only with a stated reason.

## Recommended stack
- **App:** Next.js (App Router, TypeScript) for site and dashboard in one repo. Server components for public pages, route handlers for APIs and webhooks.
- **DB:** Postgres (Supabase or Neon) with migrations (Drizzle or Prisma). Row-level checks in the service layer.
- **Auth:** email login for studio users, roles per file 09.
- **Storage/CDN:** object storage with an image pipeline (resize, AVIF/WebP). Private bucket for payment screenshots.
- **Jobs:** a queue or scheduled functions for timers, message sends, reminders.
- **Messaging:** WhatsApp Cloud API via the chosen provider. Meta Graph API for IG/FB DMs.
- **Styling:** Tailwind with tokens from file 02. Motion with CSS first, small library only if needed.
- **Analytics:** privacy-friendly with source tagging.
- **Hosting:** Vercel or equivalent, **in LamSparks' account**. Domain registered in LamSparks' name.

## Repo layout
```
/app
  (site)/            public pages
  book/              booking journey
  studio/            dashboard
  api/               route handlers, webhooks (whatsapp, instagram, facebook)
/lib
  estimate/          pure pricing engine + tests
  pipeline/          state machine + tests
  messaging/         send function, templates, rules, windows
  ai/                single AI service wrapper
  consent/           consent checks
/db                  schema, migrations, seed (file 05)
/docs                these md files
```

## Core modules to unit test first
1. `estimate` (all rule types, rounding, bundle fixtures, 7-day validity).
2. `pipeline.transition` (allowed moves, guards, side effects, audit).
3. `messaging.send` (consent, sending hours, 24h window, blank variable block, STOP).
4. `consent` (asset eligibility, testimonial display).

## Milestones (each shippable)
1. **Foundations:** repo, tokens, layout, Nav, DB schema, seed catalog, auth and roles.
2. **Public site:** Full-Bleed hero, home, sessions, portfolio, About, FAQ, Contact, Legal, SEO, redirects, performance pass.
3. **Booking:** estimate engine, booking flow, snapshot, agreement, handoff to WhatsApp (link only), source tracking.
4. **Pipeline and clients:** board, card detail, transitions, Today view, close reasons.
5. **Deposit and WhatsApp:** webhook, assistant flows, screenshot intake, deposit queue, AI screenshot check, templates approval gate.
6. **Calendar, prep, editing tracker, delivery messages.**
7. **Inbox and IG/FB automation** (after Meta review status is known).
8. **Content calendar, asset library, caption bank, reminders, Journal link.**
9. **Website editor and training mode**, reports, backups and restore test.
10. **Hardening:** accessibility, in-app browser and slow network tests, privacy review items, handover docs.

Start Meta business verification and WhatsApp template submission in **week 1** (calendar-independent, not under our control).

## Definition of done (Launch)
- All pages live with real content or flagged placeholders listed in file 12.
- Booking produces a correct itemised estimate for every automatic session type and matches seeded prices.
- A test booking travels Enquiry to Delivered with the correct automatic and manual transitions and audit trail.
- No deposit can reach "Deposit paid" without a human recording it.
- No asset or message can reach the public or a client without recorded consent.
- Prices, text, images and message wording editable by the team without a developer.
- Performance: usable first screen about 3 seconds on throttled mobile, test results shared with client.
- Backup and **restore tested**. Written handover guide. Training recorded. All accounts in LamSparks' name.

## Handover checklist
Domain, hosting, database, Meta business account, WhatsApp number, messaging provider, IG/FB setup, gallery service, AI account and code repository all transferred or created under LamSparks. Builder retains access only.
