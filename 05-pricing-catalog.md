# 05 Pricing Catalog (seed data)

All amounts in naira. Seed these into the `Package`, `AddOn` and `PricingRule` tables. They must be editable from the dashboard. Source files: Event Coverage list, Toddler Packages v2, Maternity & Motherhood Collections.

## Event Coverage (hours-based)
| Package | Price | Includes |
|---|---|---|
| 2 Hours | ₦120,000 | Professionally edited images, online delivery gallery |
| 4 Hours (Popular) | ₦200,000 | Same |
| 6 Hours | ₦300,000 | Same |

Add-ons: Express Delivery ₦30,000 (images within 24 to 48 hrs). 2 Short Highlight Reels ₦200,000 (edited videos delivered digitally). Additional Hour ₦35,000.
Delivery: private online gallery within 5 to 7 business days.
Booking: DM or WhatsApp. Note: events and weddings go through a personal quote per file 04. Show these as "from" guidance only.

## Toddler / Child (ages 1 to 10, Abuja studio)
| Package | Price | Includes |
|---|---|---|
| Luxury | ₦650,000 | 3 studio setups, 3 to 4 outfit changes, 20 edited images, 1 medium frame, 1 photo album, complimentary gift. Covers all siblings. Includes complimentary family session with 4 edited images |
| The Premium (Best Seller) | ₦350,000 | 2 studio setups, 2 to 3 outfits, 10 edited images, 1 small frame, complimentary gift |
| The Basic | ₦180,000 | 1 studio setup, 1 outfit, 5 edited images, complimentary gift |
| The Essence | ₦95,000 | Plain backdrop only, minimal props (numbers, chairs), 1 outfit, 3 edited images, short studio session |

Add-ons: Additional Family Member ₦30,000 (older or younger siblings). Additional Child **50% of selected package** (twins, triplets, etc.).
Family Portrait Special: ₦100,000, 1 outfit change, 1 backdrop, 3 edited images. Discounted rate, separate from regular Family Portrait pricing.

Toddler terms: non-refundable booking fee deducted from total. Full payment before or on session day, no session without it. Reschedule with at least 48 hours notice, less than 48 hours forfeits the booking fee. Delivery 7 to 14 working days. Extra images purchasable at an agreed rate. Portfolio/marketing use of images unless agreed in writing otherwise. Props, outfits, setups subject to availability.

## Maternity & Motherhood
| Package | Price | Includes |
|---|---|---|
| Mini Glow | ₦140,000 | 5 edited images, 1 outfit, soft copy delivery |
| Classic Bloom | ₦185,000 | 8 edited images, 2 outfits, soft copy |
| Signature Grace | ₦255,000 | 12 edited images, 2 to 3 outfits, soft copy |
| Luxury Motherhood | ₦520,000 | 18 edited images, multiple outfits, cinematic Instagram reels video, 16x20 frameless print |

### Motherhood Bundle: Maternity + Newborn (15% off when combined)
| Bundle | Original | Bundle price | Includes |
|---|---|---|---|
| Bloom | ₦300,000 | ₦255,000 | Maternity 6 images, Newborn 6 images, 1 to 2 outfits per session |
| Grace | ₦420,000 | ₦357,000 | Maternity 6, Newborn 8, 1 to 2 outfits per session |
| Legacy | ₦600,000 | ₦510,000 | Maternity 12, Newborn 12, multiple outfits, soft copy |

Add-ons: Extra Edited Image ₦10,000. Content Reel (2 videos) ₦150,000. Express Delivery (3 to 5 business days) ₦30,000. Additional Person (partner or sibling) ₦20,000.

Maternity terms: 50% non-refundable deposit, balance on or before shoot day. Delivery 10 business days (express 3 to 5). No raw files in any package. One free reschedule with at least 48 hours notice. 30-minute grace period on start time. Arrival beyond grace incurs ₦10,000 lateness fee. Extra guests billed as Additional Person. Extra outfits at extra cost subject to session time. Contact on list: 0813 084 7299.

## Not yet priced (needed before launch, decision #1)
Newborn standalone, individual portrait, official portrait and headshots, couple, family beyond the included people, priority editing fee, locations and travel charges. Seed with `price: null`, `quote_required: true` and show "personal quote" until Osemene supplies them. Do not invent numbers.

## Data modelling notes
- `Package(session_type, name, price, inclusions[], badge, sort)`.
- `PricingRule(kind: base | per_person | percent_of_package | flat | bundle_discount | priority, params)`.
- Bundle discount stored as `percent: 15` and computed, with the listed bundle prices used as test fixtures (300000 -> 255000, 420000 -> 357000, 600000 -> 510000).
- Terms text is data (`Policy` records per session type) and shown on the estimate and booking confirmation.

## Conflicts to resolve (use the configurable default, flag in file 12)
| Topic | Sources | Default until decided |
|---|---|---|
| Deposit % | Proposal 70/30. Maternity list 50% | Per session type: **70%** globally, maternity **50%** as on its published list. Owner to confirm |
| Delivery time | Proposal and event list 5 to 7 business days. Toddler 7 to 14 working days. Maternity 10 business days | Per session type as published, standard timeline editable |
| Express delivery | Event 24 to 48 hrs. Maternity 3 to 5 business days | Per session type as published |
| Rescheduling | Toddler and maternity: 48 hours notice. Maternity: one free reschedule | 48 hours notice, one free reschedule |
| Contact number | Maternity list shows 0813 084 7299 | Use as WhatsApp business number only after owner confirms (decision #12) |
