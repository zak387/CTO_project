# Design System — SAWA Command Center

> The visual source of truth. Read this before any UI work.
> Aesthetic: **Minimal Dark — developer-tool calm** (inspired by Resend/Vercel-class dashboards).
> Live in: `mockups/spec-screens/command-center.html` (the interactive prototype is now built in this system)

_Created: 2026-06-16 · inspired by a reference dashboard_

## Product Context
- **What this is:** a bespoke, ~6-week "command center" for a campaign to book NY CTOs/CIOs onto a call with Adam ahead of an invite-only dinner (Jul 21, 2026).
- **Who it's for:** Adam (VIP, wants clarity and calm; desktop + mobile) and SAWA operators (work the pipeline).
- **Project type:** dark, minimal web-app dashboard — Overview + working surfaces.

## Aesthetic Direction
- **Direction:** Minimal Dark. Near-black surfaces, near-white text, one green accent, generous space, hairline-thin borders.
- **Decoration level:** minimal — structure comes from spacing and faint 1px dividers, not boxes, fills, or shadows. No gradients except the brand mark.
- **Mood:** quiet, precise, premium-utilitarian. The product gets out of the way; content and a few key numbers carry it.
- **Reference:** Resend / Vercel / Linear-class dashboards — dark, restrained, content-first.

## Color
Dark theme, single functional accent. Color is rare and means something.

**Surfaces**
- App background `#0A0A0A`
- Sidebar / deepest surface `#000000`
- Card / input / elevated surface `#141414`
- Hover surface `#1A1A1A`

**Borders**
- Hairline (default) `#1F1F1F`
- Border (stronger / focus) `#2A2A2A`

**Text**
- Primary `#FAFAFA`
- Secondary / muted `#A1A1A1`
- Faint (uppercase labels, timestamps) `#6E6E6E`

**Accent & semantics** (used sparingly — color = signal)
- **Green `#3ECF8E`** (soft `rgba(62,207,142,.12)`): positive / booked / subscribed-equivalent / "good to go live." The one accent.
- **Amber `#E5A33D`** (soft `rgba(229,163,61,.12)`): attention — "Waiting on you" + drafts needing review.
- **Red `#F87171`** (soft `rgba(248,113,113,.12)`): cancelled / error.
- Channel hues stay neutral (muted grey text) so green/amber read as *action*, not decoration.

**Primary action button:** white `#FFFFFF` fill, `#0A0A0A` text (high-contrast, like the reference's "Add contacts"). Secondary button: transparent with `#2A2A2A` border, primary text.

**Brand mark only:** purple→magenta gradient `#A855F7 → #D946EF` for the SAWA logo avatar. Never used for UI accents — brand identity only.

## Typography
- **Primary (everything):** **Geist** — clean neutral grotesque, built for dark dev-tool UIs; emulates the reference without defaulting to Inter.
- **Numeric / IDs / mono moments (optional):** **Geist Mono** for emails, IDs, or dense figures if desired.
- **Loading:** Geist via Google Fonts / Vercel — `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap`
- **Weights:** 400 body · 500 medium (labels, emphasis, buttons) · 600 headings.
- **Scale (px):** page title 28 (600) · big stat 24–30 (500) · section head 15–16 (500) · body / table 14 · small 13 · label 11 (uppercase, `letter-spacing:.08em`, faint).
- **Tracking:** slight negative on large headings (`-.01em`); wide on uppercase labels.
- No serif anywhere.

## Spacing
- **Base unit:** 8px.
- **Density:** comfortable — generous row height (~52–56px table rows), roomy padding (16–24px in containers).
- **Scale:** 2xs(2) xs(4) sm(8) md(12) lg(16) xl(24) 2xl(32) 3xl(48).
- Whitespace and hairlines do the work; avoid heavy fills and shadows.

## Layout
- **Shell:** fixed left sidebar (~230px, `#000000`) with line-icon + label nav; main content on `#0A0A0A`.
- **Sidebar nav:** muted items; active item = subtle filled pill (`#141414`) with primary text. Line icons (~18px, Lucide-style) in muted grey.
- **Page header:** large title, optional tab row beneath (active tab = dark pill / underline), primary action top-right (white button).
- **Stat row:** uppercase faint labels with large values beneath (like ALL CONTACTS / SUBSCRIBERS in the reference).
- **Tables / lists:** faint 1px row separators, avatar circle + name/email, status as a subtle pill, secondary columns muted, an overflow `…` action at row end. No vertical gridlines.
- **Max content width:** wide; let the table breathe.
- **Border radius:** 8px standard (buttons, inputs, cards) · 6px small · pills fully rounded for status · avatars full circle.

## Motion
- **Approach:** minimal-functional. Hover feedback and gentle transitions only.
- **Easing / duration:** `ease` / 120–160ms for hovers and surface changes; up to 250ms for panel/drawer slides.
- **Signatures:** row hover lightens to `#141414`; buttons shift opacity; subtle fade-up on load. No bounce, no parallax, no decorative motion.

## Anti-patterns (do not introduce)
- Light/white backgrounds · purple/indigo as a UI accent (purple is brand-mark only) · gradient buttons · heavy drop shadows · boxed cards-in-cards · serif type · color used decoratively · dense gridlines. Keep it dark, flat, and quiet.

## Webapp Semantics Mapping
- Green = Booked / win / "good to go live" / positive status.
- Amber = Waiting on you / Draft needs review.
- Red = Cancelled.
- White button = the single primary action per screen.
- Channels (OUT / IN) = muted grey pills, no color.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-16 | Adopt "Minimal Dark" (Resend/Vercel-class) | User reference image; wants a clean, minimal dark dashboard. |
| 2026-06-16 | Geist as the single typeface | Matches the reference's neutral grotesque; built for dark dev UIs; avoids Inter default. |
| 2026-06-16 | Green single accent + amber/red semantics | One functional accent (positive/booked); amber for attention, red for cancelled. Color = signal. |
| 2026-06-16 | Purple gradient reserved for brand mark only | Keeps the UI accent unambiguous (green), purple = identity. |
