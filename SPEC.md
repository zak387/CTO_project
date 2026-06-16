# SAWA Command Center — Build Spec (Blueprint)

> The detailed "build exactly this" document. Inherits all context from `CLAUDE.md`.
> Status: **complete** — all 10 sections designed. (§9 email: tool pick pending one answer. Build underway: §§1,2,5,6,7 already live in `webapp/`.)

_Last updated: 2026-06-16_

## Table of contents
1. **Overview** ✅ designed
2. **Lead Pipeline (outbound + inbound)** ✅ designed
3. **Meetings Booked** ✅ designed
4. **Artefacts (content calendar)** ✅ designed
5. **Lead Detail / timeline** ✅ designed
6. **Data model & identity (Reconciliation Queue)** ✅ designed
7. **Integrations (Dripify · Calendly · Landing)** ✅ designed
8. **Tech stack & hosting** ✅ designed
9. **Email platform & sequences** ✅ designed _(final tool pick pending one answer)_
10. **Out of scope** ✅ designed

---

## 1. Overview

**Mockup:** `mockups/spec-screens/01-briefing-home.html`

**Purpose:** the single screen everyone lands on. Adam answers "who do I need to talk to, and how's it going?" in seconds. SAWA gets the same snapshot, then drills into Pipeline to work.

**Design principle:** top = *act* (who replied and is waiting on you) → middle = *understand* (the funnel + next calls) → bottom = *content* (this week's posts).

### Tracking model (drives this screen)
We track **only the initial reply**, not the ongoing conversation:
`Connection sent → Initial message sent → Replied (tracked) → [Adam handles, untracked] → Booked (tracked)`.
- **"Waiting on you" = replied but not yet booked.** No status flipping, no "I replied" button — Adam does zero data entry.
- A lead leaves the Waiting list automatically when they **book** (→ Meetings) or **decline**.

### Layout (top → bottom)

```
┌──────────────────────────────────────────────────────────────┐
│ SAWA Command · NY CTO Dinner                ⏱ 35 days to Jul 21│  Top bar
├──────────────────────────────────────────────────────────────┤
│  ⚑ WAITING ON YOU  (4)                          [hero block]  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Derek Cho ↗        CTO · Northwind Logistics  OUT · 12m │  │
│  │ Anita Patel ↗      CIO · Meridian Bank        IN  · 40m │  │
│  │ Thomas Wells ↗     CTO · Halcyon Media        OUT · 2h  │  │
│  │ Carla Mendes ↗     CIO · Vela Energy          IN  · 5h  │  │
│  └────────────────────────────────────────────────────────┘  │
│   (name links to the person's LinkedIn profile)               │
├───────────────────────────────┬──────────────────────────────┤
│  CAMPAIGN FUNNEL (combined)    │  NEXT MEETINGS                │
│  Contacted          212        │  Tue 17 · 10:30 Rajesh Kumar  │
│  Connected/Engaged  124        │  Tue 17 · 14:00 Sofia M.      │
│  Replied/Signed up   69        │  Wed 18 · 09:15 Derek Cho     │
│  Booked              23        │  Thu 19 · 11:00 Anita Patel   │
│  ── Outbound 14 · Inbound 9 ── │  …                            │
├───────────────────────────────┴──────────────────────────────┤
│  THIS WEEK'S ARTEFACTS                                         │
│  Mon ● Live "Boardroom…"  Wed ◷ Scheduled "CIO…"  Fri ✎ Draft │
└──────────────────────────────────────────────────────────────┘
```

### Block-by-block

**A. Top bar** — campaign name + **countdown to Jul 21**. Nothing else (no sync health — internal concern, not for Adam).

**B. ⚑ Waiting on you (HERO)** — the daily hook: people who replied to initial outreach and haven't booked yet, **most recent first**. Each row:
- **Full first + last name, linked to their LinkedIn profile** (click the name → opens their LinkedIn).
- Title · company · **channel badge** (OUT / IN) · **"replied Xm/Xh ago"**.
- No buttons, no "I replied." Just a clear, named list of who to go talk to.
- Empty state: *"All caught up — nobody's waiting."*

**C. Campaign funnel (combined, both channels)** — Contacted → Connected/Engaged → Replied/Signed-up → **Booked**, with the **outbound/inbound split** on the Booked row. (No goal strip, no "went quiet.") Clicking a stage → opens Pipeline filtered to it.

**D. Next meetings** — Adam's upcoming booked calls (date · time · who), soonest first. Replaces a separate "recently booked" block (same purpose). Clicking → Meetings section.

**E. This week's artefacts** — the 3 LinkedIn posts for the week with status (Live / Scheduled / Draft-needs-review). Clicking → Artefacts.

### Behaviour & rules
- **Auto-refreshes** as webhooks arrive — no manual reload.
- **Single unified view** for Adam + SAWA; SAWA's deeper work happens in Pipeline.
- **Mobile:** bands stack vertically; **Waiting on you stays the top full-width hero**.
- Every block is a **doorway** — clicking drills into the matching section.

### Out of scope for this screen
- No live-sync/health indicator.
- No goal/quota strip.
- No "recently booked" block (Next Meetings covers it).
- No reply/conversation tracking or buttons; no inline message reading.

---

## 2. Lead Pipeline

**Mockup:** `mockups/spec-screens/02-lead-pipeline.html`

**Purpose:** SAWA's operational workshop — every lead and its stage, find anyone fast, see who's still getting email follow-ups, and drill into any lead. Adam can view it; the SAWA team works in it.

**Locked decisions:** channel toggle with **native stages per channel** · **board (kanban) first**, with an optional table.

### Stages differ by channel (this is the whole point)

```
Outbound:  Connection Sent → Connected → Message Sent → Replied → Booked
           └─ email follow-ups run in parallel until they reply or book ─┘

Inbound:   Signed Up → Warm Email Sent → Replied → Booked
           (no connection step — they came to us)
```
- **Message Sent** = the *follow-up phase*, not a single message. A lead stays in this column through **as many LinkedIn follow-ups as it takes** (1, 2, 3…). Dripify fires a `message_sent` event for each one (logged on the timeline), but the card doesn't move until they reply. _(Optional: show a "N follow-ups sent" counter on the card.)_
- **Replied** = the handoff point (these are the people in Adam's "Waiting on you" hero). One reply moves them here and stops the auto-follow-ups; Adam takes the conversation from there.
- **Booked** = leaves the active working pipeline (still visible via the Booked filter + Meetings).
- **Cancelled** = a booked lead whose Calendly call was cancelled; returns to view so it's not lost.

### Top controls (kept deliberately minimal)
- **Channel toggle:** `Outbound · Inbound` — the two primary views; each shows its own native stages.
- **View toggle:** `Board` (default) · `Table`
- **Search:** a single box to find a lead by name or company.
- **No filter chiplets, no sort controls, no "last activity"** — keep it clean.

### Board view (default — kanban)
- **Columns = the selected channel's native stages**, in order:
  - Outbound: `Connection Sent · Connected · Message Sent · Replied · Booked`
  - Inbound: `Signed Up · Emailed · Replied · Booked`
- Each column header shows a **count**. Cards = leads, each showing **name (→ LinkedIn) · title · company**.
- `Replied` cards are visually flagged (these are Adam's "Waiting on you" people); `Booked` column reads as the win state.
- Cards advance left→right automatically as Dripify/Calendly webhooks fire.

### Table view (optional toggle)
A plain list — **Lead (→ LinkedIn) · Title · Company · Stage** — for when you'd rather scan/search a flat list than see the board.

### Clicking a lead → Lead Detail (see §5)
Full event timeline, contact info (LinkedIn + Revenue Base email), current stage, and **manual override** (move stage / merge duplicates) for when a webhook misfires.

### Out of scope (explicitly removed to keep it simple)
- ❌ No "last activity" column or timestamps in the list.
- ❌ No email-sequence / suppressed column or filter (that logic still runs behind the scenes; it's just not shown here).
- ❌ No sort controls, no filter chiplets.
- No editing of LinkedIn/email *content* here; no bulk messaging from this tool.

---

## 3. Meetings Booked

**Purpose:** a clean, focused view of **only booked calls** — no pipeline noise. Adam answers "what's on my calendar for this campaign, and who am I talking to next?" The Past log also lets SAWA eyeball momentum toward the 50-call goal without crossing the tracking boundary.

**Mockup:** `mockups/spec-screens/03-meetings.html` (inherits the Overview design language).

**Locked decisions:** Upcoming + Past sections · agenda list **grouped by day** · row = time · name (→ LinkedIn) · title · company · channel badge · **Past collapsed by default** · cancellations drop from Upcoming and appear struck-through in Past (keeping the OUT/IN badge).

### Tracking boundary (stays firm)
We never ask "did the call happen / did they attend?" A meeting simply slides **Upcoming → Past** when its start time passes — purely by clock, no manual action, no completed/attended/no-show state.

### Data per meeting
- From **Calendly** webhook: invitee name/email, **company (from the booking form)**, start time, reschedule/cancel URL, video/location URL — matched to the right lead by **email → company + name** (§6.3), since Adam sends his own untagged link.
- From the **lead record**: full name, title, company, channel (OUT / IN), LinkedIn URL.

### Layout (top → bottom)

```
┌──────────────────────────────────────────────────────────────┐
│ Meetings                                                       │
│ Booked calls with Adam — nothing else.                         │
├──────────────────────────────────────────────────────────────┤
│  UPCOMING (5)                                                  │
│   Tue · Jul 17                                                 │
│     10:30   Rajesh Kumar ↗   CTO · Acme Cloud         OUT     │
│     14:00   Sofia Marlow ↗   CIO · Beacon Health      IN      │
│   Wed · Jul 18                                                 │
│     09:15   Derek Cho ↗      CTO · Northwind Logistics OUT    │
│   …                                                            │
├──────────────────────────────────────────────────────────────┤
│  PAST (18)                                         ▶ collapsed │
│   Mon · Jul 14                                                 │
│     11:00   Priya Nair ↗     CIO · Vela Energy        IN      │
│     15:30   T̶o̶m̶ ̶W̶e̶l̶l̶s̶      CTO · Brightline CANCELLED OUT  │
│   …                                                            │
└──────────────────────────────────────────────────────────────┘
```

### Block-by-block

**A. Header** — title + sub ("Booked calls with Adam — nothing else"). No countdown and **no goal/quota strip** — those live on the Overview; this screen stays focused.

**B. Upcoming** — agenda list, **soonest first**, grouped under day headers (`Tue · Jul 17`). Each row: time · **name (linked to LinkedIn)** · title · company · **OUT/IN badge**. The Upcoming count sits in the header. Clicking a row → **Lead Detail (§5)**, where the reschedule / video link lives (no join link on the row itself).
- **Empty state:** *"No calls booked yet — they'll appear here the moment someone books with Adam."*

**C. Past** — **collapsed by default** (native `<details>` toggle), **most-recent first**, rows muted. Same row shape as Upcoming. **Cancelled** calls appear here **struck-through** with a red `CANCELLED` tag (keeping their OUT/IN badge) — a visible record that a booking was lost. No action taken here; re-activation happens in the Pipeline.

### Behaviour & rules
- **Auto-refreshes** as Calendly webhooks arrive: a new booking pops into Upcoming; a cancellation moves the row to Past (struck-through) and **decrements the global Booked count**.
- A meeting moves Upcoming → Past purely by clock time.
- **Mobile:** single column; the day-grouped agenda reads identically on small screens.
- Every row is a **doorway** → Lead Detail (§5).

### Out of scope for this screen
- ❌ No attended / completed / no-show tracking.
- ❌ No calendar grid (agenda list only).
- ❌ No goal/quota strip or countdown (the Overview owns those).
- ❌ No reschedule/cancel **actions** here — Adam manages his own calendar; we only reflect it.

---

## 4. Artefacts (content calendar)

**Mockup:** `mockups/spec-screens/04-artefacts.html` · interactive: `mockups/spec-screens/command-center.html`

**Purpose:** the single surface where Adam reviews the **entire campaign's LinkedIn content in one sitting**. SAWA writes the post copy; **Adam is the reviewer**. He opens any post, reads it, edits the text, and signs it off — and that sign-off is what moves the post forward.

**Core role (locked):** **plan + review only.** This surface never publishes to LinkedIn — posting is done manually outside the tool. There is no LinkedIn posting integration.

**Design principle:** *review everything at once.* The whole campaign is visible on one grid so Adam can do a single review pass, not a post-at-a-time trickle.

### What a post artefact holds
- **Body text** — the LinkedIn post itself (plain text with line breaks / emojis). Editable inline.
- **Hook / theme label** — a short title shown on the calendar cell (e.g. "Boardroom story").
- **Scheduled date** — the intended publish day (drives grid position + the Overview's "this week").
- **Status** — `Draft · Scheduled · Live` (see below).
- **SAWA note** _(optional)_ — an internal guidance note, shown in the post panel only, visually distinct from the body.
- **Activity log** — an append-only, timestamped trail of what happened to this post (`Drafted by SAWA → Edited by Adam → Reviewed by Adam — good to go live`). This is the audit trail that proves Adam actually engaged with the post.

> No image/media attachments and no file storage — text only. Keeps the build simple given the small post count.

### Status model (Adam's review drives it)
`Draft → Scheduled → Live`.
- **Draft** — the default for every post. SAWA has written the copy; it is **awaiting Adam's review**. Flagged on the grid (amber outline) as needing his eyes.
- **Scheduled** — Adam has reviewed the post and clicked **"✓ Good to go live."** That single sign-off is what flips Draft → Scheduled (and writes a log entry). Still posted manually.
- **Live** — has been posted to LinkedIn; SAWA marks this after posting.
- **Adam's review is the one action that changes status.** He does no other bookkeeping — editing text is optional, marking Live is SAWA's job. This is the deliberate exception to his "zero data entry" rule: the review *is* the product's point.

### Persistence & audit (why this matters)
- **Every edit and every review is saved and survives reload.** In the prototype this is browser-local storage; in the hosted build it is a normal backend save (`PATCH /posts/:id`) so edits and the log are shared across Adam's and SAWA's devices.
- The **activity log** gives SAWA confidence that a Scheduled post was genuinely reviewed by Adam (not just left to drift), without anyone having to chase him.

### Layout — full-campaign grid (locked)
- **Weeks as rows, three columns: Mon · Wed · Fri.** Because we only post 3×/week, the grid is just 3 columns wide, so all ~15 slots fit on one surface.
- Each **cell** = one post slot, showing **date · hook label · status badge**. A Draft needing review carries an **amber outline**.
- **Empty future slots** show a **"+ add post"** affordance (SAWA fills them).
- **Mobile:** the **same grid, same 3 columns** (with abbreviated labels, e.g. `M16 / W18 / F20`) — no layout switch. Adam still sees a whole week per row and scrolls through weeks.

### Post panel (click a cell)
Opens a panel — identical on desktop and mobile — to read/edit/review a single post:
- **Hook · date · theme** header + **status badge**; a **"✓ Reviewed by Adam"** flag once signed off.
- **Body text** — click to edit inline (plain text). A **Save** button persists the edit and adds an "Edited by Adam" log entry.
- **SAWA note** (if present), visually distinct from the body.
- **Activity log** — the timestamped trail (Drafted → Edited → Reviewed), shown in the panel.
- **‹ N of N ›** step controls — walk through **every post back-to-back** without returning to the grid. This is what makes a single full-campaign review pass fluid.
- **"✓ Good to go live"** — Adam's review sign-off; flips the post to Scheduled and logs it.

### Overview hand-off
The Overview's **"This week's artefacts"** band (§1E) reads from this section: it surfaces the current week's Mon/Wed/Fri posts with their `Live / Scheduled / Draft` status, and clicking through opens this grid.

### Out of scope (explicitly removed)
- ❌ No publishing/scheduling to LinkedIn from the tool (manual posting only).
- ❌ No image/media uploads or file storage.
- ❌ No rich-text editor — plain text only.
- ❌ No per-post analytics/engagement metrics.
- ❌ No comment threads or multi-reviewer approval chains — Adam is the sole reviewer; SAWA only supplies copy and marks Live.

---

## 5. Lead Detail / Timeline

**Mockup:** `mockups/spec-screens/05-lead-detail.html`

**Purpose:** the single-lead view. Opens when you click a lead anywhere (kanban card, table row, or the Overview "Waiting on you" hero). Shows everything we know + what happened when + the manual override controls.

**Form factor:** a **slide-over drawer** from the right (over a dimmed pipeline) — keeps you in context, closes back to the board. (Not a separate full page.)

### Contents (top → bottom)

**A. Header**
- Avatar · **full name → LinkedIn** · title · company.
- **Channel badge** (OUT/IN) · **current stage badge**.

**B. Contact strip**
- 🔗 **LinkedIn** (opens profile) · ✉️ **Email** (with copy).
- _No "source" field — Revenue Base is the only outbound source, and the channel badge already says outbound vs inbound._
- _No special booking link — Adam sends his own normal Calendly link; matching is handled by observing the booking (see §6/§7), not by a tagged link._

**C. Meeting card** _(only if Booked)_
- 📅 date · time · the **email they booked with** (handy when it differs from the Revenue Base email).

**D. Timeline** — the one place timestamps live
- A vertical list of the events that actually fired, newest at the bottom:
  - Outbound: `Connection Sent → Connected → Message Sent → Replied → Booked`
  - Inbound: `Signed Up → Emailed → Replied → Booked`
- Each row: icon · label · date/time. Future/unreached steps shown faint.
- _Reminder: "Replied" shows that they replied, not the message text (Dripify limit)._

**E. Manual override (the safety net)**
For when a webhook misfires or matching goes wrong:
- **Move stage** (drag-free dropdown to correct the stage).
- **Mark cancelled** (if a booked call falls through and Calendly didn't catch it).
- **Merge duplicate** (link this record to another — the cross-channel same-person case).
- Kept tucked under an "•••" / "Manage" affordance so it's available but not in the way.

**F. Notes** _(optional, lightweight)_
- A free-text box for SAWA to jot context ("knows Adam from X", "asked to reschedule"). Internal only.

### Behaviour
- Opens/closes smoothly; deep-linkable (so a future "open lead" link works).
- Read-mostly: the only edits are the override controls + notes. No conversation logging.

### Out of scope
- No inbox / message threads.
- No email composing (the email tool handles sends).

---

## 6. Data Model & Reconciliation Queue

**Diagram:** `mockups/spec-screens/06-data-model.html`

> Plain-English summary: the tool stores **one record per person (a Lead)**. Data about those people pours in from 3 outside tools, each of which names people differently. The **Reconciliation Queue** is the "matchmaker/bouncer" that attaches every incoming update to the *right* person — silently when it's sure, and via a small **review tray** when it isn't. That's the whole job: keep the data clean, never duplicate a person, never lose a booking.

### 6.1 The core object — a **Lead**
One row per human. Fields:

| Field | Example | Where it comes from |
|---|---|---|
| `id` | `147` | internal — the hidden tag we use everywhere |
| `name` | Derek Cho | Revenue Base / form |
| `title` | CTO | Revenue Base / form |
| `company` | Northwind Logistics | Revenue Base / form |
| `linkedin_url` | linkedin.com/in/derek-cho | Revenue Base / Dripify |
| `email` | derek.cho@northwind.com | Revenue Base / form |
| `channel` | outbound *(can be both)* | system |
| `stage` | Replied | Dripify / Calendly |
| `events[]` | [connection_sent @t1, connected @t2, …] | webhooks (powers the timeline) |
| `meeting` | {Jun 18 · 09:15, booked_email} | Calendly |
| `email_suppressed` | true *(set when they reply)* | system rule |
| `notes` | "knows Adam from SaaStr" | SAWA |

### 6.2 The 3 data sources name people differently (this is *why* reconciliation exists)
| Source | Identifies a person by | Brings |
|---|---|---|
| **Dripify** (webhook) | **LinkedIn URL** | connection sent · connected · message sent · **replied** (no text) |
| **Calendly** (webhook) | **email**, then **company + name** (from the booking form) | **booked** · **cancelled** |
| **Landing page** (form) | **email** (fallback: name+company) | new **inbound signup** |

### 6.3 The matching ladder (how every incoming event finds its Lead)
Try in order, stop at the first hit:
1. **LinkedIn URL** (Dripify) → exact.
2. **Email** (Calendly / landing form) → exact.
3. **Company + unique name** (Calendly booking form / landing form) → *likely*; if exactly one match, attach (with a quick double-check); if more than one, → **review tray**.
4. **No match at all** → if it's an inbound signup, **create a new Lead** (inbound grows the list); if it's a stray booking/reply we can't place, → **review tray**.

### 6.4 Three concrete walkthroughs
- **Dripify says "linkedin.com/in/derek-cho replied":** ladder hits step 1 → find Derek → set stage `Replied`, add timeline event, set `email_suppressed = true`. Silent, automatic. *(95% of outbound events.)*
- **Calendly booking — email `derek.personal@gmail.com`, company `Northwind Logistics`:** the email doesn't match (step 2 misses), so step 3 cross-references **company + name → Derek** → set `Booked`, save meeting + the booking email. Adam just used his normal link; the **Company question on the form** is what made the match.
- **Landing form: "Anita Patel, anita@meridianbank.com, Meridian Bank":** step 2 email matches outbound lead #88 → **link, don't duplicate** → tag her `channel = both` (counted once, suppression still applies). If no email match → step 3 company+name → review tray if unsure.

### 6.5 The Review Tray
A small list of items the queue couldn't place with certainty: *"This booking might be Anita at Meridian — confirm? [Yes / No]"*. Should be near-empty on a normal day. It's the human safety valve that stops a bad guess from silently corrupting the numbers.

### 6.6 Rules the queue enforces
- **One human = one Lead** (dedupe/merge across channels).
- **Suppress-on-reply:** a `replied` event flips `email_suppressed = true` so nudges stop.
- **Cancelled:** a Calendly cancellation moves the Lead off `Booked` so the count corrects itself.
- **Inbound grows the list:** genuinely new signups become new Leads.

---

## 7. Integrations

**Principle:** external tools push to us. The CRM exposes **webhook receiver endpoints**; it never polls. Until paid plans are live, an **Event Simulator** fires byte-identical payloads so we can test the whole flow now.

### 7.1 Endpoints (the real integration surface)
| Endpoint | Fired by | Events | Key field |
|---|---|---|---|
| `POST /api/webhooks/dripify` | Dripify (Pro) / Simulator | `connection_sent · connected · message_sent · replied` | `linkedin_url` |
| `POST /api/webhooks/calendly` | Calendly (paid) / Simulator | `booking_created · booking_canceled` | `invitee_email`, `company`, `name` |
| `POST /api/leads/inbound` | Landing page form / Simulator | new signup | `email` |
| `POST /api/webhooks/email` | Email tool (Instantly/Smartlead) / Simulator | `sent · opened · replied · bounced · unsubscribed` | `email` |

### 7.2 On receipt
Every call runs the **matching ladder (§6.3)** → updates the right Lead silently, or drops to the Review Tray. Dripify `replied` also sets `email_suppressed = true`.

### 7.3 Real wiring (when plans are active)
- **Dripify (Pro):** one webhook per event per campaign → paste our URL. `connected` captured by sequencing the campaign so a post-accept step fires.
- **Calendly (paid):** Adam sends his **own normal Calendly link** — no tagging, no behaviour change. The booking form includes a required **"Company" question**, so every booking arrives with **name + email + company**. We observe the booking webhook and match by **email → company + name** (§6.3). This is robust precisely because it doesn't depend on Adam doing anything special.
- **Landing page:** the form POSTs new signups to `/api/leads/inbound`.

### 7.4 Testing without paid plans — the Event Simulator
A built-in panel with buttons that POST the **same payloads** Dripify/Calendly would send (`[Fire: Derek replied]`, `[Fire: booking for Derek]`, …). Lets us watch cards move across the kanban and the dashboard update live. When Pro/paid arrive, we swap the trigger (real tool instead of button) — **no code change** to the receivers.

---

## 8. Tech Stack & Hosting

**Already chosen and built — this section just records it.**

### Stack
- **One app, frontend + backend:** **Next.js 16** (App Router, Turbopack) + **TypeScript** + React. The same app serves the UI *and* the webhook API routes (`/api/...`).
- **Database:** **Prisma** ORM. **SQLite** locally (zero-setup, file-based); **Postgres** in production (Vercel Postgres or Neon). Switching is a one-line datasource change — the schema and code stay the same.
- **Live updates:** the dashboard **polls** `/api/leads` every ~2s — simple and reliable. (Can upgrade to push/websockets later if ever needed; not needed for this scale.)
- **No build-your-own email/LinkedIn sending** — those are external tools (Dripify, the email platform per §9). The CRM only *receives* and *reflects*.

### Hosting
- **Vercel.** The webhook receiver URLs that Dripify / Calendly / the landing form point at live at `https://<app>.vercel.app/api/webhooks/...`.
- Public URL also lets Adam open it from his phone and lets us share a link.

### Repo layout
```
CTO_project/
├── CLAUDE.md · SPEC.md        ← context + blueprint
├── mockups/                   ← spec-screens/ + exploration-proposals/
└── webapp/                    ← the Next.js app (see webapp/README.md to run)
```

### Deploy checklist (when we go live)
1. Provision a Postgres DB (Vercel Postgres / Neon); set `DATABASE_URL`.
2. Flip `prisma/schema.prisma` datasource `sqlite → postgresql`; run `prisma db push`; seed the 200 from Revenue Base.
3. Deploy to Vercel.
4. Paste the live webhook URLs into Dripify (Pro), Calendly (paid), and the landing form.

---

## 9. Email Platform & Sequences

**Scope (decided):** the CRM **does not send email** — an external platform sends the sequences; the CRM only **tracks status and suppresses on LinkedIn reply**. Two sequences: **outbound nudges** (to the ~200 who haven't replied) and an **inbound welcome series** (thanks-for-signing-up → book a call).

### Platform decision (from research)
- **Use a dedicated email tool — NOT Dripify.** Dripify is LinkedIn-first: **no public API, no email-event webhooks**, sends via your own Gmail/Outlook capped at ~200/day. It fails both of our hard requirements (programmatic suppress-on-reply + status events). Dripify stays LinkedIn-only.
- **NOT Beehiiv** — that's a newsletter/audience platform whose terms **prohibit cold/sourced lists** and which has no reply-aware 1:1 cadences. Wrong category.
- **Recommended pick (decision rule):**
  1. **If SAWA already has Instantly warmed up → use Instantly.** Warmup (~2 weeks) is the biggest deliverability lever; don't throw away a warmed sender for a 5-week run. Its API covers everything. _(Caveat: live webhooks need the Hypergrowth tier ~$97–124/mo; on the cheaper Growth tier we **poll** lead status instead.)_
  2. **If starting fresh → Smartlead.ai (Pro ~$94/mo).** Cleanest suppress-on-reply of all: a true reversible **per-lead pause/resume inside a campaign**, plus a global block list, with reply/open/bounce **webhooks on the same plan**.
  3. **Budget alternative → lemlist (~$39/seat/mo)** — full API + webhooks on the entry tier.

### Integration (both directions)
- **CRM → email tool (suppress-on-reply):** when a lead replies on LinkedIn, the CRM calls the tool's API to **pause/remove** them from the sequence (+ add to the block list). *(Smartlead: `POST /campaigns/{id}/leads/{leadId}/pause`. Instantly: `DELETE /api/v2/leads/{id}` + block-list entry.)*
- **Email tool → CRM (status):** the tool's **webhook** posts `sent · opened · replied · bounced · unsubscribed` to a new endpoint **`POST /api/webhooks/email`**, which runs the same reconciliation/matching and updates the lead.

### ⏳ One decision needed to finalize
**Does SAWA already have an Instantly account warmed up?** → Yes = Instantly; No = Smartlead.

---

## 10. Out of Scope (whole product)

Deliberately **not** building these — keeps the one-campaign tool lean:

- **No login / accounts / roles** — open internal link, URL kept private. _(Your call.)_
- **No email sending from the CRM** — an external tool sends; the CRM only tracks + suppresses. _(Your call.)_
- **No reporting or data export** — the on-screen Overview funnel is enough; no CSV / scheduled reports. _(Your call.)_
- **No push notifications / digests** — dashboard-only; the "Waiting on you" list is the hook.
- **No post-booking tracking** — scope ends at "booked." No completed / signed-up / attended / no-show.
- **No message-content reading** — we know *that* someone replied, not *what* (Dripify carries no text).
- **No content creation/sending inside the tool** — LinkedIn & email copy is made and sent in their own tools; Artefacts is plan/review only (no auto-posting, no media, plain text).
- **No native mobile app** — responsive web only (phone + desktop).
- **Reusability after Jul 21: deferred** — built fit-to-purpose for this campaign; generalizing for future campaigns is a later decision, not in this scope.
