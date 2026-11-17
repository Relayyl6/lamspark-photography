# 03 Website Pages

All page content, images, prices and copy are editable from the dashboard (CMS-style fields, see file 06). Every page has its own title and meta description naming the service and Abuja, a canonical URL, and Open Graph image.

| Route | Purpose | Contents |
|-------|---------|----------|
| `/` | Strong first impression | Full-Bleed hero (file 02), line "Capturing Moments. Preserving Memories. Sparkling Lives.", session types as image tiles, short line about Lametu, two testimonials, "Book a session" and WhatsApp buttons |
| `/portfolio` | Prove quality | Galleries: Weddings, Maternity, Newborn and Family, Children, Portraits and Official, Events. 12 to 20 best images each, full-screen viewing, booking button at the end of each gallery |
| `/stories` | Show the feeling | A few full sessions told as stories with a handful of images. Only with client consent |
| `/about` | Build trust | Osemene's story, meaning of the name (Lam, from Lametu, her mother) and how to say it, how she works, portrait |
| `/sessions` and `/sessions/[type]` | Help the right clients decide | Per type: who it is for, inclusions, duration, editing and delivery, "from" price, sample images, short FAQs, start-booking button |
| `/weddings-and-events` | Handle higher-value work personally | Highlights, what coverage includes, enquiry form leading to a personal quote |
| `/training` | Promote training | What students learn, who it is for, apply or join waiting list (route per decision #20) |
| `/love-notes` | Social proof | Client words with first name and session type, consent only |
| `/journal` and `/journal/[slug]` | Google and expertise | Short posts: what to wear, preparing children, session stories, tips. Can be created from content calendar items |
| `/faq` | Remove doubts | Deposits, editing time, what to wear, children, rescheduling, image rights, delivery |
| `/contact` | Easy to reach | WhatsApp button, Instagram, Facebook, email, areas served, working hours |
| `/book` | Booking journey | Opens from every session page and button (file 04) |
| `/gallery` | Client delivery | Clear link to the private gallery service |
| `/legal/privacy`, `/legal/terms`, `/legal/shoot-guidelines` | Be open | Privacy notice (must say WhatsApp passes through Meta and AI services process data), terms, Shoot Guidelines |

## Session types (slugs)
`individual-portrait`, `official-portrait`, `maternity`, `newborn`, `family`, `child` (toddler, ages 1 to 10), `couple`, `wedding`, `event`, `not-sure`.

Portraits and Official page speaks to LinkedIn audiences (headshots, team pictures). Her LinkedIn links straight to it.

## Session page template
1. Hero image and one-line promise.
2. Who it is for.
3. What is included (from pricing catalog, file 05, never retyped).
4. How a session works: consultation, planning, shooting, editing, delivery.
5. Duration and editing and delivery times.
6. "From ₦X" price card (see file 04, section on two-step pricing).
7. Sample images and 1 to 2 testimonials for this type.
8. Short FAQ.
9. Sticky "Start booking" button (mobile).

## SEO and discovery
- Google Business Profile for LamSparks in Abuja, linked to the site (manual setup task, documented).
- Structured data: `LocalBusiness`, `Service`, `FAQPage`, `Review` where consented.
- XML sitemap and robots.
- **WordPress migration:** import existing content and add 301 redirects from every old URL. Keep a redirect map file in the repo.
- Analytics with source tagging: Instagram, Facebook, LinkedIn, TikTok, Google, WhatsApp. UTM and `?src=` parameters captured on first landing and stored on the enquiry.
- Website URL placed in every social bio and WhatsApp Business profile (handover checklist).

## Editing by the team
A trusted team member can add gallery images, publish Journal posts, add testimonials, change prices and edit page text from the dashboard without developer help. Training and written confirmation before handover.

## Content needed from client
Best images per category (with client permission), About text and portrait, session descriptions, final price list, FAQ answers, testimonials with permission, two or three session stories. Build with placeholders and track in file 12.
