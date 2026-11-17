# 02 Design System

## Brand feel
Elegant, warm, timeless, editorial. The photographs do the work: large images, generous white space, one or two typefaces, restrained colour. Reads like a magazine cover, not a template landing page.

## Colour tokens
Derived from the existing LamSparks price lists. Final logo colours override these once supplied (decision #7).

```css
:root {
  --cream:      #F8F4EE;  /* page background */
  --warm-white: #FDFBF8;  /* cards, surfaces */
  --deep:       #1A1410;  /* near-black text, dark pill, dark sections */
  --brown:      #4A3728;  /* secondary text */
  --gold:       #C9A96E;  /* accent, rules, small highlights */
  --gold-light: #E8D5B0;
  --muted:      #8A7A6E;  /* captions, labels */
  --line:       rgba(74,55,40,0.12);
}
```
Rules: text is near-black on cream. Gold is an accent only (rules, bullets, badges), never body text. No gradients in the hero. Dark sections use `--deep` with `--gold-light` accents.

## Typography
- **Display:** an editorial serif with strong contrast. Default **Cormorant Garamond** (300/400/600, italic for emphasis), matching the price lists. Alternative: a wide grotesk for the hero if Osemene prefers a modern feel. Make this a single CSS variable so it can be swapped.
- **UI/body:** **DM Sans** 300/400/500.
- **Name legibility:** capital `I` and lowercase `l` must look different in the chosen display face, because Instagram renders the name as "I am Spark". Verify with a test render of "LamSparks" and fix before sign-off.
- The script wordmark from the price lists ("Lamsparks" with PHOTOGRAPHY below, letter-spaced) is the logo. Use the supplied logo file. Do not recreate it in CSS.
- Scale: hero headline `clamp(64px, 21vw, 90px)` mobile, `160px` desktop. Section titles 32 to 48px. Body 16px. Small labels 10 to 12px uppercase with 0.18 to 0.26em tracking.

## Imagery
- Real, warm, never stock. One consistent colour grade across all site images.
- Every image has descriptive alt text (AI suggested, human approved).
- Serve responsive sizes (`srcset`, AVIF/WebP), lazy load below the fold, explicit width/height to avoid layout shift.
- Provide a **separate portrait crop** of hero and tile images for mobile via `<picture>`. Never squeeze the wide image.
- No heavy autoplay video.

## Layout principles
- Mobile-first, then 768px and 1440px designs.
- 16 to 24px side gutters on mobile. Rounded corners 9 to 12px on photos, 4px on cards.
- Sticky bottom bar on booking pages (total + CTA) on mobile.
- Generous vertical rhythm: 72 to 120px between sections on desktop, 48 to 64px mobile.
- One primary action per screen. WhatsApp button always reachable (nav pill or floating).

## Motion
- Entrance only, on load or first scroll into view. Ease-out, 600 to 800ms. Stagger 0.15s.
- Respect `prefers-reduced-motion`: disable translate and rotate, keep opacity fades.
- No parallax or scroll-jacking. Keep the main thread free for slow phones.

---

## Home hero: "Full-Bleed" (from the supplied prompt)
Giant type up top, one edge-to-edge photo filling the bottom half, a sticker-style cut-out object bridging the two.

### Desktop (1440px wide, background `--cream`)
1. **Nav:** small logo top-left. Dark pill (`--deep`) centred with short text and a round arrow button (suggested text: "Book a session"). Links on the right: Portfolio, Sessions, About.
2. **Headline line 1**, huge (~160px, line-height 0.9), aligned **left**.
3. **Description** under line 1 on the left: 3 lines, 15px, max-width 320px.
4. **Headline line 2**, same size, aligned **right**, so the two lines step down like stairs.
5. **Photo:** full-width, 12px rounded corners, 24px side margin, runs **past the bottom of the viewport** so people scroll.
6. **Cut-out object** overlapping the top edge of the photo, rotated about -15deg, sitting between headline and photo.

Style: near-black text, no buttons in the hero (the CTA lives in the nav pill), no gradients.

### Mobile (under 768px)
- Nav: small logo left, menu icon right. Hide the desktop pill and links.
- Headline line 1: left-aligned, ~84px (`clamp(64px, 21vw, 90px)`), line-height 0.9, tight letter-spacing.
- Description under line 1, left-aligned, 12 to 13px, max-width 230px.
- Headline line 2 breaks onto two lines, right-aligned, same size.
- Photo: portrait crop via `<picture>` with a mobile source, 10px side margins, 9px radius, starts right under the headline and runs past the bottom of the screen, `object-fit: cover`, focus on the subject.
- Cut-out object overlaps the top-left edge of the photo, ~45% of screen width, rotated like desktop.

### Animation on load (stagger 0.15s)
1. Line 1 rises in.
2. Description fades in.
3. Line 2 rises in.
4. Photo slides up (40px desktop, 30px mobile).
5. Object drops in with a slight rotation and settles.

### Rules from the prompt
- No buttons in the hero. The nav pill is the CTA.
- One photo only. Real and warm.
- Description stays tiny (13 to 15px) so the size contrast is extreme.
- If the headline feels too big on mobile it is probably right.

### LamSparks content for the hero (placeholders, confirm with Osemene)
- Line 1: `Capturing` / Line 2: `moments.` (or a two-line break of the brand line)
- Description: one warm sentence about unhurried, personal photography in Abuja.
- Photo: one hero portrait from her best session, with a portrait mobile crop.
- Cut-out object: a transparent PNG sticker-style element tied to the brand, such as an instant-photo print, a small frame, or a vintage camera. **Needs a client-approved cut-out asset.** Until supplied, ship a clearly marked placeholder PNG and list it in file 12.
- Implement as a `<Hero>` component taking `lineOne`, `lineTwo`, `description`, `photo`, `photoMobile`, `object` as props, editable from the dashboard.

## Components to build
Nav (with pill), Hero, SessionTile, GalleryGrid with full-screen viewer, TestimonialCard, PriceFromCard, PackageCard, EstimateSummary (sticky), Stepper, Accordion (FAQ), WhatsAppButton, Footer, Toast, form inputs (large tap targets, 48px min).

## Accessibility and performance targets
- WCAG AA contrast. Visible focus states. 48px tap targets.
- Usable first screen in about 3 seconds on typical mobile data. Test on mid-range Android, iPhone, Instagram in-app browser, throttled 3G/4G. Share results before launch.
- Lighthouse mobile target: Performance 85+, Accessibility 95+, SEO 95+.
