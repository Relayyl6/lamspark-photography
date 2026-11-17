# 08 Messaging: WhatsApp Assistant and DM Automation

## Platform
- Official **WhatsApp Business Platform** on a dedicated business number, via a specialist messaging provider (choose with client). **No unofficial connections**, ever.
- Webhook endpoint verifies signatures, is idempotent, and logs every inbound and outbound message.
- Most conversations start from the client, and replies within the 24-hour service window are free. Booking and session messages use **utility templates**. Greetings and offers are **marketing templates** and go only to opted-in clients.
- Automated messages start with **new clients only**. Existing clients get nothing until they opt in (Osemene sends each one a personal invite, replies are added with consent recorded).

## Assistant behaviour
- Scripted state machine with tappable buttons/lists and a few keywords: `price`, `location`, `prepare`, `reschedule`, `cancel`. **It does not guess at open questions** and never gives a wrong answer about a booking.
- Introduces itself as "LamSparks' automated assistant". First message always offers **"Talk to Osemene"**.
- Anything needing a person goes to the **human inbox** and tells the client when to expect a reply (from working hours setting).
- `STOP` removes the client from all non-essential messages immediately and logs it.
- All wording is written in Osemene's voice, stored as editable templates, and **approved by her before launch** (`approved_by_owner` gate: a template cannot be used until true).
- Voice notes from Osemene only where WhatsApp permits, for example the welcome after deposit. Confirm which moments allow it before finalising.

## Entry flow
1. Client arrives with reference code (from booking page) or messages cold.
2. Code found: greet by name, restate session, purpose and feeling in one short line, show estimate summary, ask for deposit instructions or transfer screenshot.
3. No code: menu (prices, choose session -> link to `/book`, location, speak to Osemene).

## Deposit flow
1. Assistant shows bank details (from settings) and the exact deposit amount.
2. Client sends screenshot. Assistant replies "Received. We'll confirm shortly" and moves card to **Deposit reported**. **It never says the deposit is confirmed.**
3. Payment appears in the **deposit queue** with the screenshot and AI read-out (amount, date, reference vs expected, match or mismatch highlight).
4. Team member checks the bank and records it. Only then the card moves to **Deposit paid** and the confirmation message goes out.

## Message plan
Setting: **A** = automatic, **R** = reviewed (team approves or edits first), **P** = personal (system sends nothing, reminds the team).

| Moment | Content | Set | Phase |
|---|---|---|---|
| Deposit recorded | Booking confirmation, details, preparation link | A | Launch |
| No deposit after 48h | Gentle follow-up | A | Launch |
| No reply after 7 days | Polite close, can reopen anytime | A | Launch |
| 3 days before, prep unfinished | Reminder with link | A | Launch |
| 2 days before shoot | Time, location, what to bring | A | Launch |
| After shoot | Thank-you and editing timeline | A | Launch |
| On delivery | Private gallery link | A | Launch |
| 7 days after delivery | "Did everything arrive well?" | A | Launch |
| Before gallery link expires | Reminder to download | A | Launch |
| After gallery viewed | Request for a few words, consent first | R | Follow-on |
| Maternity due date approaching | Warm message to the mother | R | Follow-on |
| After a baby arrives | Congratulations, later newborn invite | P | Follow-on |
| Client birthday | Greeting (opted in) | A | Follow-on |
| Child's birthday | Greeting to parent (opted in) | A | Follow-on |
| Anniversaries | Greeting (opted in) | A | Follow-on |
| Seasonal and cultural | Greeting from owner's list | A | Follow-on |
| 6 months after delivery | Invitation to book again (opted in) | A | Follow-on |
| Referral recorded | Thank-you to referrer | R | Follow-on |

Removed by design: monthly greeting to every client. Print and album offers wait until the product can sell them.

### Message rules (enforced in the send function, not by convention)
- Names and details filled from the record. **Never send with a blank or placeholder** (validate variables, fail closed).
- Send only within sending hours (default 9am to 7pm Lagos). Queue otherwise.
- Greetings go to the parent or client, never to a child. No child's photo unless approved.
- Greetings and offers need a separate, unticked opt-in with date and exact wording.
- Support "no celebratory messages" flag per client and pausing any occasion.
- Respect the 24-hour window: outside it, only approved templates.

## Human inbox
Unified inbox across WhatsApp, Instagram and Facebook. Conversation states: `bot`, `human`, `closed`. When a team member takes over, automation stops for that conversation until handed back. Routes to the card owner by default. Shows summary, AI label (price question, reschedule, complaint, referral, personal), and draft reply (never auto-sent).

## Instagram and Facebook DM automation (Launch, if confirmed)
- Official Meta messaging API. Needs an Instagram professional account linked to a Facebook page, Meta app review for permissions, and obeys the same 24-hour rules. **Confirm current Meta requirements before building.**
- On a new DM: instant short welcome in Osemene's voice with options **See prices / Choose a session / Ask about location / Speak to Osemene**.
  - Prices: "from" prices plus booking link.
  - Session: link to that session page.
  - Speak to Osemene: hand to human inbox, create enquiry (source = Instagram or Facebook).
- Keywords `price`, `book`, `location` trigger matching replies.
- Stops when a team member takes over, resumes only if handed back. Every automated message logged to the enquiry.
- **Does not:** hold open conversation, give prices not on the list, reply to comments, post, or handle complaints, refunds or anything personal.
- **TikTok DMs are manual.** The booking link in the TikTok bio does the work.
- Flows and wording must be walked through with Osemene before finalising (proposal section 7.4). Mark as TBC until then.
