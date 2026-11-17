# 10 Privacy, Consent and Background AI

## Principles
Compliance target: **Nigeria Data Protection Act 2023**. The privacy notice must be reviewed by a qualified adviser before launch.

## Data handling
- Encrypted in transit (TLS) and at rest. Dashboard requires login. **No client logins exist.**
- **Restricted fields** (health, emergency, comfort notes): visible to Owner/Full only, excluded from messages, reports, exports and logs unless deliberately included.
- Session preparation does **not** ask for general health detail. Single question: "Is there anything we should know to help you feel comfortable?" Specific health questions only where a session needs them (maternity).
- Children's information is parent-given and parent-agreed.
- Clients can request a copy of their data or deletion. Build an admin action for each. Payment and session records kept as long as business and tax rules require.
- Backups with a **tested restore** procedure documented in the handover guide.

## Consent model (separate, never bundled, never pre-ticked)
| Consent | Where collected | Notes |
|---|---|---|
| Booking and session messages | Booking page and when opening assistant or DM automation | Required to use the assistant |
| Greetings and offers (marketing) | Separate unticked box | Store date and exact wording |
| Image use for portfolio or marketing | Separate optional box | Per session, controls asset library eligibility |
| Public testimonial | At request time | Display only with consent |

All consents write to `consent_log` (append-only). Withdrawal is honoured immediately (`STOP`, dashboard toggle).

## Privacy notice must state
WhatsApp, Instagram and Facebook messages pass through Meta's platform. AI services process client information where AI features are used. Show it on the booking page and in session preparation.

## Background AI (clients never talk to an AI)
No AI output reaches a client without human review unless the owner explicitly enables automatic sending for a specific message type.

| Feature | Behaviour | Phase |
|---|---|---|
| Inbox triage | Labels incoming messages (price question, rescheduling, complaint, referral, personal) to route and prioritise. Suggestion only | **Launch** |
| Deposit screenshot checking | Reads amount, date, reference, compares to expected, highlights match or mismatch. **Never records a deposit** | **Launch** |
| Conversation summaries | Short summary at top of client record | Follow-on |
| Draft replies | Proposed reply in Osemene's voice, edited and sent by a human, never auto-sent | Follow-on |
| Image descriptions | Suggested alt text, approved before publish | Follow-on |
| Caption suggestions | Options in brand voice, human chooses | Follow-on |
| Editing time estimates | Suggested delivery date from history, team confirms | Follow-on |

### Implementation rules
- Wrap every AI call in one service module with: task-specific prompt, minimal data sent (only what the task needs), timeout, failure fallback to manual flow, and a log of inputs/outputs without restricted fields.
- Choose a commercial provider with written confirmation that client data is **not used for training** and nothing is stored beyond its terms. Provider decided with the client.
- Budget and running costs depend on volume. Add a monthly usage counter and a soft cap setting.
- The UI always shows AI output as a suggestion with an obvious edit/override.
