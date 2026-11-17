# 04 Booking Journey

Phone-first, works inside Instagram and TikTok in-app browsers. A client chooses a session, answers questions, sees a personal estimate, agrees to the price, then continues to WhatsApp with answers attached.

## Routes
- **Automatic estimate:** individual portrait, official portrait, maternity, newborn, family, child, couple.
- **Personal quote (form, no price):** wedding, event, "not sure yet".
- **Custom quote:** any request outside the standard list (very large group, special location). No price shown. Page says a personal quote will follow. Enquiry flagged `custom_quote`.

## Step flow
1. **Choose session** (tiles).
2. **About the person (before any price):**
   - "What is this session for?" (required)
   - "What feeling do you want from the photographs?" (optional)
   Both saved to the client record and quoted in the first WhatsApp message.
3. **Session questions:**
   - Family: number of people (estimate changes above the included number).
   - Child: child's name and age.
   - Couple: partner's name.
   - Maternity: due date or weeks pregnant.
   - All: location (studio / outside / both), preferred month, priority editing yes/no.
4. **Name and contact:** name, WhatsApp number (validated, Nigerian formats normalised to E.164), optional email. Source captured automatically.
5. **Estimate** (below).
6. **Agreement and hand-off.**

Use progressive disclosure: one question group per screen on mobile, progress indicator, back button never loses answers. Save a draft by session token so a dropped connection resumes.

## Two-step pricing
- Session pages show **"from ₦X"** only (the lowest package price from the catalog).
- The exact estimate appears only after the questions are answered. Prevents drop-off after effort and helps Google.

## Estimate (itemised, saved exactly as seen)
Show:
- Session type and base fee.
- Each additional item on its own line.
- Total in naira.
- Deposit amount, its percentage, and what it covers.
- Balance and when due.
- Note: booking fees are non-refundable.
- Editing timeline (standard, or priority if chosen).
- What is included, a short note on the work behind a session (consultation, planning, shooting, editing, delivery), 1 to 2 testimonials and sample images.
- **No fee may appear that is not itemised.**

Behaviour:
- Updates live as answers change. On mobile the total is fixed at the bottom of the screen.
- Stored as an immutable snapshot (JSON of line items, rules version, totals, deposit). Valid **7 days**, then shows "expired, refresh your estimate".
- Deposit default: **70% of total, 30% balance** (proposal). Maternity price list says 50%. See file 05 and 12. Make `deposit_percent` a per-session-type setting.

## Estimate engine requirements
- Pure function: `estimate(sessionType, packageId, answers, rules) -> lineItems, total, deposit, balance`.
- Pricing rules come from the database (file 05 seed), never hardcoded in UI.
- Rule types: base package, per-extra-person add-on, percentage of package (additional child), flat add-on (express, extra hour, extra image, reel), bundle discount (maternity+newborn 15%), priority editing fee.
- Unit tests for every rule type and for rounding (whole naira).

## Agreement
- Checkbox: **"This price looks right to me."** Timestamp recorded.
- Separate checkbox: agree to receive WhatsApp messages for this booking.
- The WhatsApp button is enabled only when the price box is ticked (and messaging consent ticked).
- Changing any answer afterward **clears the price tick**. Agreed price must always match answers.
- Optional, unticked by default: consent to use images for marketing or portfolio (recorded with date and exact wording).

## "Talk to Osemene first"
Button beside the estimate. Opens WhatsApp to Osemene with the enquiry attached, for clients not ready to agree. Creates the enquiry card with `waiting_on: us`.

## Hand-off to WhatsApp
- Create or update `Client` and `Enquiry`, store snapshot, move card to **Agreed to price**.
- Open `https://wa.me/<business_number>?text=<prefilled>` where the prefilled text includes a short reference code (for example `LS-4F7K`) so the assistant can match the conversation to the enquiry.
- First assistant message uses the client's name and answers (file 08).

## Capacity and dates
Show only next available dates, based on weekly capacity set in the dashboard (decision #16). Block dates from the calendar.

## Source tracking
Every enquiry stores a source: Instagram, Facebook, LinkedIn, TikTok, referral, Google, returning client, WhatsApp, other. Taken from `?src=`, UTM, or referrer, with a manual override.

## Anti-abuse and reliability
Rate limit submissions, honeypot field, server-side validation of every price (never trust client totals), idempotent submit.
