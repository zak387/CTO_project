# Supabase Signups Sync — Design

_Date: 2026-07-09_

## Goal

Landing-page signups are captured in a **Supabase** `subscribers` table, separate
from the command center. Pull those signups into the command center automatically
so they appear as **inbound leads** in the existing pipeline — matched against the
200-lead list where possible, added as new inbound leads otherwise.

Nothing about the existing app changes; this only *adds* inbound leads.

## Decisions (settled during brainstorming)

- **Direction:** the command center **pulls** from Supabase (Supabase does not push).
- **Trigger:** **Vercel Cron**, running **once per day** (Vercel Free/Hobby plan cap).
  The endpoint is also a plain authenticated GET, so it can be triggered on demand.
- **Auth to Supabase:** `@supabase/supabase-js` with the **service-role key**,
  server-side only, read from env vars.
- **Where signups go:** stored as **inbound leads** (`channel: "inbound"`,
  `stage: "signed_up"`). Being on the original 200-list is not required.
- **`blocked_domains` table:** ignored entirely.

## Source of truth: the `subscribers` table

Verified live against the Supabase project (10 rows at design time):

| Column | Type | Use |
|---|---|---|
| `id` | uuid (PK) | idempotency key — remembered so a row is never imported twice |
| `email` | text | the reconciliation match key |
| `domain` | text | derives the company, e.g. `criteo.com` → `Criteo` |
| `created_at` | timestamptz | ordering / display |
| `source` | text (nullable) | campaign/referral tag, stored in the lead's notes |

The rows are **thin** — email + domain only. No name, title, or LinkedIn URL.

## Field mapping (subscriber → Lead)

```
email       → email          (match key)
domain      → company        "criteo.com"   → "Criteo"     (strip TLD, title-case)
email local → name           "m.zimmermann" → "M. Zimmermann"  (split on . _ -, title-case)
(none)      → title          ""
source      → notes          "Landing signup (source: net-solutions)"
                             or "Landing signup" when source is null
```

The derived name is intentionally rough (often just an initial + surname). Because
the reconciliation ladder matches **by email first**, and a single-/initial-token
derived name will not fuzzy-match a real two-token lead name, the derived name does
not cause false matches. SAWA can correct any derived values by hand later.

## Data flow

```
Vercel Cron (daily)
  → GET /api/sync/supabase           (Authorization: Bearer $CRON_SECRET → else 401)
      → read all rows from Supabase `subscribers` (service-role key)
      → drop rows whose id is already in SignupSync (already imported)
      → for each remaining row:
            map subscriber → { name, email, company, title, notes }
            call handleInbound(...)          [existing reconcile.ts logic]
              • email matches a known lead → link (channel "both", + signed_up event)
              • stranger                   → create inbound lead (stage "signed_up")
            record { supabaseId, leadId } in SignupSync
  → return { pulled, created, linked, skipped, errors }
```

`handleInbound()` already implements the link-vs-create reconciliation; the sync
job only fetches, dedupes, maps, and delegates to it.

## Idempotency

The cron re-reads the whole table each run, so re-processing must be harmless.
A new Prisma model records every Supabase row once imported:

```prisma
model SignupSync {
  supabaseId String   @id      // subscribers.id (uuid)
  leadId     Int?               // the lead it became / linked to
  createdAt  DateTime @default(now())
}
```

Before processing a row, skip it if its `supabaseId` is already present. This makes
re-runs a no-op and avoids both duplicate leads and duplicate `signed_up` events.
At this scale (tens to low hundreds of rows) reading all rows per run is fine — no
timestamp cursor needed.

## Components

| File | Responsibility |
|---|---|
| `src/lib/supabase.ts` | Build the service-role Supabase client from env; fail clearly if env is missing. |
| `src/lib/signups.ts` | `syncSupabaseSignups()`: fetch → dedupe via SignupSync → map → `handleInbound` → record. Returns a summary. Also exports the `mapSubscriber()` pure helper. |
| `src/app/api/sync/supabase/route.ts` | Cron endpoint. Verify `CRON_SECRET`, call `syncSupabaseSignups()`, return JSON summary. |
| `vercel.json` | Register the daily cron pointing at `/api/sync/supabase`. |
| `prisma/schema.prisma` | Add the `SignupSync` model. |
| `package.json` | Add `@supabase/supabase-js`. |
| `.env` / Vercel env | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SIGNUPS_TABLE`, `CRON_SECRET` (already added locally; must also be set in Vercel). |

## Environment variables

| Var | Meaning |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role secret key (server-side only) |
| `SUPABASE_SIGNUPS_TABLE` | table name (`subscribers`) |
| `CRON_SECRET` | shared secret; Vercel Cron sends it as `Authorization: Bearer …` |

Set locally in `.env` (gitignored) **and** in Vercel → Project → Settings →
Environment Variables (production, where the cron actually runs).

## Error handling

- Missing Supabase env vars → the sync returns a clear error and does not crash.
- Wrong/absent `CRON_SECRET` → `401`.
- One malformed row → logged and skipped; the rest still import.
- Supabase unreachable → error summary returned; nothing is lost (unprocessed rows
  simply aren't in `SignupSync` yet, so the next run retries them).

## Testing

- `mapSubscriber()` unit checks: name/company derivation for representative emails
  (`m.zimmermann@criteo.com`, `sameer@netsolutions.com`, single-token locals,
  null `source`).
- `syncSupabaseSignups()` with a mocked Supabase client: a known-email row links,
  a stranger row creates, an already-synced id is skipped, a second run is a no-op.

## Out of scope (YAGNI)

- No new dashboard panel — signups flow into the existing inbound pipeline.
- No writing back to Supabase.
- No `blocked_domains` handling.
- No sub-daily cron / real-time (Free-plan constraint accepted). A manual "Sync now"
  UI button is a possible later add but is not built now; the endpoint is already
  callable on demand.
