# 09 Studio Dashboard

Private web app at `/studio`, login required, desktop and mobile usable (the team will check the deposit queue on phones). Mirrors the public site's design tokens but simpler, denser and quiet.

## Roles
| Role | Access |
|---|---|
| Owner | Everything, including prices, templates, settings, users, restricted fields |
| Full | Operations, restricted fields, no user or billing management |
| Limited | Pipeline, inbox, calendar, content planning. No restricted fields, no prices, no exports |

## Modules
1. **Today:** flagged stalled cards, deposits to check, preps incomplete, shoots today and tomorrow, edits due, content due, unread human inbox.
2. **Pipeline:** board, list, card detail and timeline (file 07).
3. **Clients:** records, people (children, partner), consent status, history, restricted fields hidden by default, export and delete on request.
4. **Deposit queue:** screenshot viewer, expected vs read amount/date/reference, match flag, "Record deposit" (amount, bank reference) and "Reject with reason". Only humans record.
5. **Human inbox:** unified conversations, AI label and summary, draft reply editor, take over / hand back, assign owner.
6. **Calendar:** confirmed shoots, capacity per week, blocked dates, drag to reschedule (triggers client notice per policy).
7. **Editing and delivery tracker:** per job status, due date, priority flag, gallery link, expiry, delivered marking. Suggested delivery date from AI, confirmed by team.
8. **Content calendar** (below).
9. **Asset library** (below).
10. **Website editor:** page blocks, galleries (drag order), stories, testimonials (consent required), Journal, FAQ, prices and packages, hero fields (file 02).
11. **Messaging:** template list with approval status and owner-approved flag, sending hours, STOP list, consent log.
12. **Reports:** pipeline conversion, stage durations, revenue and balances, lost reasons, source performance, post performance.
13. **Settings:** working hours, stalled threshold, weekly capacity, bank details, business number, deposit defaults, close reasons, weekly posting targets, users.

## Content calendar
Plans posts across Instagram, Facebook, LinkedIn, TikTok, WhatsApp Status and Journal.

**Content item fields:** platforms, format (carousel, reel, story, single image, LinkedIn article or post, Journal article), purpose (book, show a session, educate, celebrate, share a story, mark a season), pillar (craft, stories, experience, value of preserving memories, Osemene as the person), session type or none, assets, caption and hashtags per platform, publish date/time per platform, status (idea, drafting, approved, scheduled, posted, reviewed), live link.

**Views:** monthly calendar (colour by session type or platform), weekly planning list with statuses, drag between dates (logged). Weekly targets per platform (for example 3 Instagram, 1 LinkedIn). **Gap warning** when a week falls below target, visible before it happens.

**Caption bank:** saved captions with placeholders. AI can suggest options (optional). Nothing posts unless a person chooses it.

**Reminders:** at scheduled time the assistant WhatsApps a team number with caption, asset and platform. Team posts manually and marks posted with the live link. **Reminder is a prompt, not a publish.**

**Review:** one month after posting, links carry a source tag so enquiries and bookings are credited to posts. Show which posts, pillars and session types brought enquiries.

**Who does what:** Osemene approves captions, picks pillars, sets targets. Team plans, sources assets, posts, records links. Assistant reminds and collects links.

## Asset library
Every image or video used in content comes from here. Fields: session, session type, colour grade, consent status, mood and setting tags, alt text (approved). **An asset without marketing consent cannot be attached to a content item or scheduled.** Enforce in the API, not only the UI. Search by tags (for example outdoor maternity, last six months). Uploads are resized and compressed server side.

## Testimonials library
Consent required before public display. Approved testimonials feed website pages and can become content items.

## UX requirements
- Every list is filterable and searchable. Empty states explain next action.
- Destructive actions confirm. Every important change writes an `audit_event`.
- Keyboard accessible, mobile friendly tables (stacked cards under 768px).
