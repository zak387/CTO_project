# Design System — SAWA Command Center

> The visual source of truth. Read this before any UI work.
> Aesthetic: **Minimal Light / Blue — executive-clean** (white surfaces, blue typeface, soft elevation).
> Live in: `webapp/src/app/globals.css` (the implemented design system).

_Created: 2026-06-16 · re-skinned to Minimal Light/Blue 2026-06-16_

## Product Context
- **What this is:** a bespoke, ~6-week "command center" for a campaign to book NY CTOs/CIOs onto a call with Adam ahead of an invite-only dinner (Jul 21, 2026).
- **Who it's for:** Adam (VIP, wants clarity and calm; desktop + mobile) and SAWA operators (work the pipeline).
- **Project type:** light, minimal web-app dashboard — Overview + working surfaces.

## Aesthetic Direction
- **Direction:** Minimal Light / Blue. White cards on a faint blue-grey page, deep-blue typeface, one blue accent, generous space, hairline borders, soft elevation.
- **Decoration level:** restrained — structure comes from white surfaces lifted by **subtle blue-tinted shadows** plus faint 1px dividers. One brand gradient on the logo mark only.
- **Mood:** quiet, precise, executive-clean. The product gets out of the way; content and a few key numbers carry it.
- **Reference:** Linear / Stripe / Vercel-class dashboards — light, restrained, content-first.
- **No emojis anywhere** — icons are Lucide-style inline SVG line icons; only monochrome control glyphs (`✕`, `✓`, status dots) are allowed.

## Color
Light theme, single functional accent. Color is rare and means something.

**Surfaces**
- App / page background `#F4F7FC` (faint blue-grey, so white cards read)
- Card / drawer / sidebar surface `#FFFFFF`
- Subtle inner fill (tracks, avatars, inputs, count pills) `#EDF2FA`
- Hover surface `#E6EDF7`

**Borders**
- Hairline (default) `#E4EAF3`
- Border (stronger / focus) `#CCD8E8`

**Text** (the "blue typeface")
- Primary `#1B3A66` (deep blue)
- Secondary / muted `#5C7593` (slate blue)
- Faint (uppercase labels, timestamps) `#93A6BF`

**Accent & semantics** (used sparingly — color = signal)
- **Blue `#2563EB`** (soft `rgba(37,99,235,.10)`): the accent — links, active nav, primary action, funnel/progress, selection/focus, scheduled.
- **Green `#0E9F6E`** (soft `rgba(14,159,110,.12)`): positive / booked / "good to go live."
- **Amber `#B9710E`** (soft `rgba(185,113,14,.13)`): attention — "Waiting on you" + drafts needing review.
- **Red `#DC2626`** (soft `rgba(220,38,38,.10)`): cancelled / error.
- Channel hues stay neutral (muted slate pills) so blue/green/amber read as *signal*, not decoration.

**Primary action button:** blue `#2563EB` fill, white text. "Go live / book" action: green fill, white text. Secondary button: white surface with `#CCD8E8` border + soft shadow, primary text.

**Brand mark only:** blue gradient `#2563EB → #60A5FA` on the SAWA logo avatar (white sparkle SVG). Never used for UI accents — brand identity only.

## Elevation / Shadow
Soft, blue-tinted shadows give white surfaces depth (replacing the old flat-dark borders).
- `--shadow-sm` `0 1px 2px rgba(20,45,85,.06)` — chips, buttons, kanban cards, calendar cells, inner blocks.
- `--shadow` `0 1px 3px rgba(20,45,85,.06), 0 6px 16px rgba(20,45,85,.07)` — cards/tables, banners, simulator cards, countdown.
- `--shadow-md` `0 8px 28px rgba(20,45,85,.10)` — mobile nav menu / popovers.
- `--shadow-lg` `0 24px 60px rgba(20,45,85,.20)` — side drawers.
Apply elevation to banners, kanban cards, tables/list cards, and panels — wherever a surface should lift off the page. Keep shadows subtle; never harsh or dark.

## Typography
- **One typeface, everywhere:** **Geist** — clean neutral grotesque. Used for *all* text including numbers, dates, emails, times and IDs. **No second font (no separate mono):** consistency is a hard rule — every figure and label uses the same family/weights so nothing looks mismatched within a component (e.g. a card's follow-up label and its booked date must match).
- **Loading:** Geist via Google Fonts — `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap`
- **Weights:** 400 body · 500 controls · 600 labels / emphasis / headings / key figures.
- **Scale (px):** page title 28 (600) · big stat 17–24 (600) · section head 14 (600) · body / table 14 · small 13 · label 11 (uppercase, `letter-spacing:.06–.08em`, faint).
- **Tracking:** slight negative on large headings (`-.01em`); wide on uppercase labels.
- No serif anywhere.

## Spacing
- **Base unit:** 8px.
- **Density:** comfortable — generous row height, roomy padding (16–24px in containers).
- **Scale:** 2xs(2) xs(4) sm(8) md(12) lg(16) xl(24) 2xl(32) 3xl(48).
- Whitespace, hairlines, and soft shadows do the work.

## Layout
- **Shell:** fixed left sidebar (~230px, white) with SVG line-icon + label nav; main content on the faint blue-grey page.
- **Sidebar nav:** muted items; active item = soft blue pill (`--accent-soft`) with blue text. Lucide-style line icons (~17px) in muted slate.
- **Page header:** large title, optional control row beneath; primary action top-right (blue button).
- **Stat row:** uppercase faint labels with large values beneath.
- **Tables / lists:** white card with soft shadow, faint 1px row separators, avatar circle + name/email, status as a subtle pill, secondary columns muted. No vertical gridlines.
- **Border radius:** 10px cards · 8px buttons/inputs/cells · 6px small · pills fully rounded · avatars full circle.

## Motion
- **Approach:** minimal-functional. Hover feedback and gentle transitions only.
- **Easing / duration:** `ease` / 120–160ms for hovers and surface changes; up to 250ms for panel/drawer slides.
- **Signatures:** row hover → `#E6EDF7`; kanban card hover lifts shadow `sm → md`; buttons shift opacity / border to accent; subtle fade-up on load. No bounce, no parallax.

## Anti-patterns (do not introduce)
- Dark backgrounds · purple/indigo as a UI accent (purple retired; brand mark is now blue) · a second typeface or mono for numbers (one font only) · emojis · gradient buttons · heavy/dark drop shadows · boxed cards-in-cards · serif type · color used decoratively · dense gridlines. Keep it light, calm, and consistent.

## Webapp Semantics Mapping
- Blue = accent / links / primary action / progress / selection / scheduled.
- Green = Booked / win / "good to go live" / positive status.
- Amber = Waiting on you / Draft needs review.
- Red = Cancelled.
- Blue button = the single primary action per screen (green for the book/go-live action).
- Channels (OUT / IN) = muted slate pills, no color.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-16 | Adopt "Minimal Dark" (Resend/Vercel-class) | Initial reference image; clean minimal dark dashboard. (Superseded.) |
| 2026-06-16 | Re-skin to "Minimal Light / Blue" | User request: white skin, blue typeface, subtle shadows, no emojis, consistent font. |
| 2026-06-16 | Single typeface (Geist) for everything incl. numbers — no mono | User flagged mismatched fonts within cards; one family guarantees consistency. |
| 2026-06-16 | Blue `#2563EB` accent + green/amber/red semantics | Blue is the accent/brand; green=booked, amber=attention, red=cancelled. Color = signal. |
| 2026-06-16 | Subtle blue-tinted shadows for elevation | Light theme needs soft elevation (banners, kanban, tables) instead of dark flat borders. |
| 2026-06-16 | Brand mark gradient now blue; emojis removed → SVG icons | Cohesion with blue theme; no emojis anywhere per request. |
