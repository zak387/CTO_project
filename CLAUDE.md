# SAWA Command Center — Project Context (North Star)

> This is the foundational context document for the project. Read it first. It explains **who we are, who the client is, what we're trying to achieve, and the rules the product must follow.** Detailed implementation specs live separately and inherit from this file.

_Last updated: 2026-06-16_

---

## 1. Snapshot

We are building a **one-off "command center" CRM** for a single, time-boxed marketing campaign: getting **CTOs and CIOs in New York** to book an introductory call with **Adam** ahead of an exclusive **dinner event on July 22, 2026**.

| Fact | Value |
|---|---|
| Builder | **SAWA** (email & LinkedIn growth agency) |
| Primary client / user | **Adam** (works at a consulting firm) |
| End beneficiary | The consulting firm's client — a company wanting to establish itself in the **US market** |
| Campaign goal | Fill an **invite-only CTO/CIO dinner in New York** |
| Conversion target | Lead → **booked call with Adam** (hard scope boundary) |
| Event date | **July 22, 2026** (~5 weeks from project start) |
| Outbound list size | **~200** named CTOs/CIOs |
| Tool lifespan | One campaign, ~5–6 weeks. Not a reusable platform. |

---

## 2. Who's who

- **SAWA (us)** — a marketing agency that grows companies' revenue through email: newsletters, newsletter growth, email campaigns, and product/event launches. We are the **operators** of this campaign and the **builders** of this tool.
- **Adam** — our client. He works at a consulting firm. He is the **face of the campaign**: the person prospects connect with on LinkedIn, talk to, and book calls with. In the tool he is a **VIP user** — he wants reassurance and clarity, not operational busywork.
- **The consulting firm's client** — the company trying to break into the US market. The dinner exists to win them relationships with US tech leaders. (Largely behind the scenes for the tool.)
- **The targets** — CTOs and CIOs in/around New York. The people we move from "never heard of us" to "booked a call with Adam."

---

## 3. The campaign

### Goal & scope
Get qualified CTOs/CIOs to **book a call with Adam**, where he explains the dinner and converts interest into attendance.

**Scope boundary (firm): lead → appointment booked.**
We do **not** track call-completed, signed-up-to-event, or attended. The tool's job ends the moment a call is on Adam's calendar.

### Two audience types (different because identity is known vs. unknown)

**A) Outbound — we know who they are.**
A fixed list of ~200 CTOs/CIOs. We pursue them directly.
`Connection request sent → Connected → Replied → Adam takes over the conversation → Call booked`

**B) Inbound — we don't know who they are until they self-identify.**
Driven by Adam's LinkedIn content (3 posts/week). A stranger sees a post and **signs up on a landing page** (a soft lead). We then send a warm "thanks for signing up — here's a call with Adam to walk you through the event" email, which converts to a booked call.
`LinkedIn content → Landing-page signup → Warm email follow-up → Call booked`

### Channels & the email rule
- **LinkedIn (primary engagement)** — runs through **Dripify** for outbound. Where the real conversation happens. Adam personally takes over once a lead replies.
- **Email (secondary, follow-ups only)** — **bulk nudge** sequences, not individual initial outreach. Two purposes: nudge unresponsive **outbound** leads, and welcome/convert **inbound** signups.
- **Suppression rule:** the moment a lead **replies on LinkedIn**, they are **removed from the email follow-up sequence** so they stop receiving nudges.

---

## 4. The tools (data sources)

| Tool | Role | Integration reality |
|---|---|---|
| **Dripify** | LinkedIn outreach automation (outbound) | **Webhooks only** — see §7. No public API. |
| **Calendly** | Call booking (Adam's calendar) | Clean native webhooks. |
| **Landing page** | Inbound signup capture | Form posts data into the CRM. |

> Access note: the campaigns run through **Adam's accounts**. Dripify webhooks require a **paid (Pro) plan** — ✅ Adam's account is now on **Pro**, so webhooks are live and available to wire up (verified June 2026).

---

## 5. The Command Center — vision & principles

A single **one-stop-shop** for the entire campaign that updates itself.

### Guiding principles (non-negotiable)
1. **Easy to read** — clarity over density. No overwhelm.
2. **One-stop-shop** — the whole campaign in one place.
3. **Self-updating** — syncs automatically with Dripify, Calendly, and the landing page.
4. **Indispensable** — useful enough that Adam *wants* to check it; the engagement hook lives **on the dashboard** (e.g. a "needs Adam" indicator), since we are **not** doing push notifications.
5. **Neat & polished** — high design quality, not a generic admin panel.
6. **Mobile + desktop friendly** — especially Adam's view.

### Components
1. **Command Overview (the home)** — at-a-glance campaign health + the combined **"who replied / signed up / booked"** across *both* channels. This is the unified landing view for everyone.
2. **Lead Pipeline** — the outbound and inbound lanes, with per-lead drill-down (so SAWA operators can actually work).
3. **Artefacts** — the LinkedIn content calendar for the 3×/week posts (~15 posts total over the campaign). Adam can open a date, read the post, and edit it. _(Build depth — full inline editor vs. simple editable calendar vs. embedded Notion — TBD; lean simple given the small post count.)_
4. **Meetings** — a clean, focused view of **only booked meetings** (no pipeline noise).

---

## 6. Architecture decisions (made so far)

These were decided after building 3 mockups (`/mockups/`) and running an adversarial critique:

- **Single unified Overview** as the home for all users (overview-led), with pipeline + per-lead detail accessible underneath for the team. _(Watch-out: operators need real working depth — the Overview must not be a dead-end dashboard.)_
- **Dashboard-only engagement** — no push digests/notifications. _(Watch-out: sustaining a daily habit without push is harder; mitigate with a prominent on-dashboard "hot reply needs Adam" trigger.)_
- **Fully automated sync from day one** — auto-ingest all sources. _(Hard dependency: this only works if the join-key problems in §8 are solved; a quiet manual-override exists as a safety net, not the main path.)_
- **Data/identity layer is the real product risk** — build it first; the UI is the easier part.
- **The tool holds the 200-lead list** (imported once from Revenue Base) — it's the source of truth, the denominator for "50 of 200," and what makes matching reliable.
- **Matching ladder + Reconciliation Queue** as described in §8.2–8.3.
- **Adam's home hero = a "⚑ Waiting on you" list** — people who replied to initial outreach and haven't booked yet. Each name **links to their LinkedIn profile**. No buttons, no "I replied," no conversation tracking — it's a clean, named handoff list of who to talk to. Drops off automatically when they book. This is the tool's main daily hook. (Limitation: shows *who* replied, not *what* — Dripify carries no message content.)

---

## 7. Hard technical constraint — Dripify (verified)

Dripify has **no public REST API**. It *does* have native **Zapier** and **Make** integrations plus native CRM connectors (HubSpot, Salesforce, Pipedrive, …) — but the simplest path is its **outbound webhooks** (Pro plan+, which Adam's account now has), which we point **directly** at our own endpoint (no Zapier middleman needed). Verified June 2026 against Dripify's help center:

- A webhook fires on a chosen trigger: **invite/connection sent**, **connection accepted**, **message sent**, or **reply received**.
- Carries ~16 named lead fields (name, **LinkedIn URL**, company, email, title, …), **keyed by LinkedIn URL**. Missing fields are simply omitted. The body carries **NO event-type field** — which transition fired is only knowable from *which URL* you gave Dripify.
- Carries **NO message content** — we know *that* a lead replied, not *what* they said.
- **Hard limit (verified): exactly one webhook with one trigger condition per campaign.** The webhook is a single field on the campaign — you cannot attach a second webhook for a different event. Capturing all four transitions would require four separate campaigns, which isn't how a Dripify drip sequence works.
- **Reply fires once** — on the lead's *first* response in the campaign (not every reply). Perfect: that first reply is exactly our handoff point.

**Decision (June 2026):** because of the one-condition limit we wire **one** webhook per outbound campaign on **"reply received"** — the single highest-value signal (it powers the "⚑ Waiting on you" hook, §6). The earlier kanban stages do **not** auto-populate from Dripify; leads are **seeded at `Connection Sent` on import** and jump to **Replied** when the webhook fires. Live receiver: `POST /api/webhooks/dripify` (reads an optional `?event=` so the same endpoint stays reusable; a bare URL defaults to `replied`). Logs every raw payload so the first real fire reveals Dripify's exact field keys.

**Implication:** the CRM must be a real hosted web app with its own **webhook-receiver endpoint** + database — not a spreadsheet or no-code board.

---

## 8. Open questions / must-verify before the build spec

These are unresolved and block a trustworthy data model. Resolve early:

1. **Email source for outbound** — ✅ ANSWERED: emails **and** LinkedIn profiles are sourced up front from **Revenue Base** (lead provider) and imported into the CRM. Dripify is only used to update *status*, never for contact details.
2. **Calendly → lead matching** — ✅ SOLVED (revised): Adam sends his **own normal Calendly link** (no tagged links — he won't change his behaviour). Instead, the **Calendly booking form asks for Company**, so every booking arrives with name + email + company. We observe the booking and match by **email → company + name**. Robust without depending on Adam.
3. **Cross-channel identity** — ✅ SOLVED: the **200-lead list is loaded into the tool** (from Revenue Base, with emails + LinkedIn URLs). A **Reconciliation Queue** matches every incoming event against the list via the ladder: **LinkedIn URL → email → company + unique-name → human confirm.** Clean matches update silently; ambiguous ones go to a review tray for a yes/no. Inbound strangers not on the list are added as new leads (list starts at 200 and grows).
4. **Success target** — ✅ ANSWERED: **at least 50 booked calls** (from the ~200 outbound list + inbound). This is the dashboard's primary goal line.

---

## 9. Stage model (with the exits the happy-path was missing)

```
Outbound:  Connection Sent → Connected → Replied → Adam Handling → Call Booked
Inbound:   Signed Up → (warm email) → Adam Handling → Call Booked

Kanban stages — REVISED June 2026. Dripify gives us only the "reply" event
(one webhook condition per campaign, §7), so the middle stages can't be
auto-tracked. We deliberately track only TWO transitions: Replied and Booked.
  Outbound:  Connection Sent (seeded at import) → Replied → Booked
  Inbound:   Signed Up (landing form)           → Replied → Booked
The dropped columns (Connected, Message Sent, Emailed) had no reliable data
source and are not shown.

We track ONLY the initial reply — not the ongoing conversation:
  Connection Sent → REPLIED (tracked, via Dripify)
                  → [Adam carries the conversation, UNTRACKED] → BOOKED (tracked, via Calendly)

Confirmed states:
  • Connection Sent — the starting bucket; every imported outbound lead begins
                here (we did send all ~200 connection requests). Not a Dripify event.
  • Replied   ✅ tracked — they responded to the initial outreach. This is the
                handoff point. Such leads appear in the "⚑ Waiting on you" list.
  • Booked    ✅ tracked — via Calendly. Leaves the Waiting list automatically.
  • Cancelled ✅ tracked — off "Booked" via Calendly cancellation; the Booked
                count must be able to decrement.
  • Declined  ❌ NOT tracked.
  • Went quiet/cold ❌ NOT surfaced on the dashboard.

"Waiting on you" = replied but not yet booked. NO "I replied" button, NO
conversation tracking — Adam does zero data entry. Any follow-up bookkeeping
is on SAWA's side, not Adam's.
```

---

## 10. Definition of success

- **Primary goal: at least 50 booked calls** across both channels (≈25% of the 200-lead list). This is the headline number on the dashboard.
- Every CTO/CIO who shows intent (LinkedIn reply or inbound signup) reliably reaches a **booked call** with no one falling through the cracks.
- The combined cross-channel **"who's booked"** number is **accurate** (no double-counts, no orphan bookings).
- Adam can answer "how is the campaign going?" in **under 30 seconds** from the home view.
- SAWA operators always know **who needs action and who's the blocker**.
- The tool is **live and trustworthy well before July 22, 2026**.

---

## 11. Working notes

- Visual exploration mockups live in **`/mockups/`** (`index.html` links all three: A-Briefing, B-Pipeline, C-Workspace). _Note: mockups still show placeholder dates — to be refreshed to the July 22 timeline._
- Process being followed: brainstorm → context (this doc) → detailed usability/design → implementation spec → plan → build.
