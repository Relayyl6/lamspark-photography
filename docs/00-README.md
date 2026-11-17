# LamSparks Platform: Agent Build Suite

You are building a website and client operating system for **LamSparks Photography** (Abuja, Nigeria). Owner: **Osemene**. Builder: **Yemuel**.

Read these files in order before writing any code.

| # | File | What it settles |
|---|------|-----------------|
| 01 | `01-product-overview.md` | What we are building, for whom, scope sets, hard rules |
| 02 | `02-design-system.md` | Look, type, colour, motion, the Full-Bleed hero spec |
| 03 | `03-website-pages.md` | Every public page and its content |
| 04 | `04-booking-journey.md` | Booking flow, questions, estimate engine, agreement |
| 05 | `05-pricing-catalog.md` | All prices and packages, as seed data, plus conflicts to resolve |
| 06 | `06-data-model.md` | Entities, fields, relationships |
| 07 | `07-pipeline.md` | Stages, automation rules, stalled cards, reports |
| 08 | `08-messaging.md` | WhatsApp assistant, IG/FB DM automation, message plan |
| 09 | `09-dashboard.md` | Studio dashboard modules, content calendar, asset library |
| 10 | `10-privacy-consent-ai.md` | Consent, data rules, background AI |
| 11 | `11-architecture-build-plan.md` | Stack, structure, milestones, definition of done |
| 12 | `12-open-decisions.md` | Unresolved items and placeholder policy |

## Source of truth
1. Proposal v1.0 (Oct 2026) defines scope and behaviour.
2. The three price lists define seed pricing (file 05).
3. The Full-Bleed hero prompt defines the home hero (file 02).
4. Where sources disagree, follow file 05 and `12-open-decisions.md`. Do not silently pick a winner. Use the configurable default stated there and flag it.

## Working rules for the agent
- Build the **Launch set** only (file 01). Leave clean extension points for Follow-on and Growth, but do not build them.
- Mobile first. Most traffic arrives from Instagram, TikTok and WhatsApp in-app browsers on mobile data.
- Everything the client may want to change (prices, copy, images, message wording) must be editable from the dashboard, not hardcoded.
- Never invent copy, prices, testimonials, phone numbers or images. Use clearly marked placeholders and list them in `12-open-decisions.md`.
- A person always records a deposit and always publishes client-facing content. The system never decides money or publishing alone.
- Write tests for the estimate engine and pipeline transitions first. They carry the business logic.
- Keep each milestone shippable. Commit per milestone with a short changelog.
