# 07 Pipeline

One board where every client sits from first enquiry to delivery and beyond. Each client is one card with a stage, owner, history and next action. Replaces state living in DMs and memory.

## Stages (in order; any card can be closed with a reason)
1. **Enquiry**: created from booking page, IG/FB message, WhatsApp, referral or manual entry. Records source, session type, answers. Custom quotes flagged.
2. **Agreed to price**: client ticked "This price looks right to me" and opened WhatsApp. Estimate stored.
3. **Deposit reported**: client sent a transfer screenshot. Sits in the deposit queue.
4. **Deposit paid**: a team member checked and recorded it. Booking confirmed for calendar and assistant.
5. **Preparation**: prep link sent. Card shows incomplete, partial or complete.
6. **Confirmed**: date, time, location set in calendar. Two-day confirmation scheduled.
7. **Shot**: session happened. Editing tracker started.
8. **Editing**: culling and editing. Due date on card.
9. **Client review**: gallery ready, link sent.
10. **Delivered**: gallery delivered. Follow-ups scheduled.
11. **Closed**: cycle complete, or closed as lost with a reason.

## What moves a card
| Transition | Automatic when | By a person when |
|---|---|---|
| Enquiry created | Booking page submitted, DM asks for prices or Osemene, manual add | Never |
| Agreed to price | Price box ticked and assistant opened | Never |
| Deposit reported | Screenshot received via assistant | Never |
| Deposit paid | **Never automatic** | Team member checks screenshot against bank and records |
| Preparation | Prep link sent after deposit recorded | Team marks complete if client confirms elsewhere |
| Confirmed | Date and time set in calendar | Never |
| Shot | Session date passes and team confirms it happened | Team confirms |
| Editing | Team starts editing tracker | Never |
| Client review | Team uploads gallery, link sent | Never |
| Delivered | Client opens gallery, or team marks delivered | Team confirms if link not opened |
| Closed | Booking cancelled, no reply 7 days, or custom quote declined | Team closes manually with reason |

Implement as a single `transition(enquiry, to, actor, reason?)` service with a state machine table of allowed moves, guards (for example cannot reach Deposit paid without a payment record in `recorded` status), side effects (messages, calendar, tracker) and an `audit_event` per move. Test every row above.

## Stalled cards and the daily queue
- Every card shows time in stage and whose move it is: **waiting on client** or **waiting on us**.
- A card waiting on us longer than `stalled_after_hours` (setting) is flagged, counting **only inside working hours** so a Sunday message is not overdue Monday morning.
- **Today view** lists flagged cards first, then due actions (deposits to check, preps incomplete, shoots today and tomorrow, edits due).

## Views
- **Board:** stages as columns. Filter by session type, source, owner, shoot date, stage.
- **List:** same cards sorted by next action.
- **Timeline** per card: every stage change, message, payment, note, with time and person.
- **Calendar:** confirmed cards on shoot dates.

## Owners and handoffs
One owner per card. Handoff records a note. The human inbox routes to the card's owner by default.

## Lost enquiries
Closing requires a reason: price too high, date not available, went elsewhere, custom quote declined, no response, other (editable list). Monthly report shows reasons and trend.

## Reports
Conversion: enquiry to agreed price, agreed price to deposit, deposit to shoot, shoot to delivery, delivery to repeat booking. Average time in each stage. Revenue = value of confirmed bookings plus balance still to collect (cash flow). Break down by source and session type.

## Automation timers (cron or job queue)
- No deposit after 48h: gentle follow-up.
- No reply after 7 days: polite closing message, then close with reason `no response`. Reopenable any time.
- 3 days before shoot with prep unfinished: reminder with link.
- 2 days before: confirmation with time, location, what to bring.
- Delivery milestones per file 08.
All timers respect sending hours (default 9am to 7pm Lagos) and consent.
