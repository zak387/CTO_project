# Real Leads CSV Import — Design

_Date: 2026-06-17_
_Status: IMPLEMENTED (`webapp/scripts/import-leads.ts`)._

> **Deviation from this design (confirmed with user):** the `"new"` stage in §2 was
> dropped. After this spec was written we moved to a reply-only Dripify webhook
> (one condition per campaign), so there is no connection-sent webhook to move a
> lead out of "New" — it would sit there until they replied. Imported leads
> therefore land directly at **`stage = "connection_sent"`** (the board's pre-reply
> bucket: Connection Sent → Replied → Booked). No `"new"` stage/column was added.
> The script also adds a `--dry-run` preview flag. Everything else matches.

## Goal

Load the real ~200 outbound CTO/CIO leads (delivered as a CSV) into the SAWA
Command Center, so Adam sees the real pipeline in the deployed app — **without**
the sensitive contact data ever entering the git repository.

## Problem & risk scope

The leads CSV contains real PII (names, emails, LinkedIn URLs). Two separate
places data can live:

- **The git repo** (code, shared / potentially public) — PII must **never** go here.
- **The database / live app** (what Adam uses) — PII **belongs** here.

Decision (confirmed with user):

- **In scope:** keep PII out of the repo; import it straight into the database.
- **Out of scope (deferred):** the live app has no login. Anyone with the URL can
  see the leads. Accepted for now (private URL, 5-week campaign); add a password
  gate later as a fast follow-up. Recorded here so it is a conscious choice, not
  an oversight.

## Approach (chosen)

**One-time local import script.** The CSV stays in a gitignored folder on the
operator's machine. A script reads it and writes the leads to the database. The
CSV never enters git, and the live app gains **no new endpoint** (no added attack
surface). Chosen over a browser-upload endpoint, which would be a permanent
public surface and more to build for a load-once list.

## CSV → `Lead` field mapping

The CSV header (tab-separated):

```
Linkedin URL Person  Person Full Name  Email Address  First Name  Last Name  Job Title  Company Name
```

| CSV column         | `Lead` field  | Notes |
|--------------------|---------------|-------|
| Linkedin URL Person| `linkedinUrl` | Normalized (see below); unique key for Dripify matching |
| Person Full Name   | `name`        | If empty, fall back to `First Name + " " + Last Name` |
| Email Address      | `email`       | Trimmed + lowercased |
| Job Title          | `title`       | Trimmed |
| Company Name       | `company`     | Trimmed |
| First Name / Last Name | (name fallback only) | |

Fixed values for every imported row:

- `channel = "outbound"`
- `stage = "new"` (the new first stage — see below)
- `emailSuppressed = false`
- no `Event` rows (nothing has happened yet)

## Components / changes

1. **Gitignore the data folder.** Add `webapp/data/` to `.gitignore`. The real
   CSV lives there (or any path passed on the command line). Never committed.

2. **New pipeline stage `"new"`** (label **"New"**) in `src/lib/stages.ts`:
   - Prepend `"new"` to `OUTBOUND_STAGES`.
   - Add `STAGE_LABELS.new = "New"`.
   - Add a column LED color for `new` in the pipeline page's `LED` map.
   - Fresh leads land here. `handleDripify` already advances a lead to
     `connection_sent` on the real webhook (matched by LinkedIn URL), so
     `new → Connection Sent` works with no reconcile changes.

3. **Import script** `webapp/scripts/import-leads.ts`, run as
   `npx tsx scripts/import-leads.ts data/leads.csv`:
   - Reads the CSV path from `argv`.
   - Parses robustly (a real CSV parser, not `split(",")`, so quoted company
     names containing commas are safe). The delimiter is tab-or-comma tolerant
     since the sample header is tab-separated.
   - Maps + normalizes each row:
     - `email` → trim + lowercase
     - `linkedinUrl` → strip trailing slash, strip query/tracking params,
       lowercase host, so it matches Dripify's later webhook key
     - `name` → use Full Name, else `First + Last`
   - **Replace semantics:** delete all existing `Event`, `ReviewItem`, then
     `Lead` rows (clears the fake seed data), then insert the real leads.
   - Dedupe by normalized `linkedinUrl`.
   - Skip rows missing a required field (`name` or `company`); collect reasons.
   - Print a summary: `imported N, skipped M (reasons…)` so the operator can
     confirm all ~200 landed.

4. **Run target.** Run once locally with the database URL pointed at the live
   Neon database, so the deployed app shows the real leads.

## Error handling

- Missing required field → row skipped, reason logged, import continues.
- Duplicate LinkedIn URL → first wins, duplicate skipped + logged.
- Empty / unreadable file path → exit with a clear message, no DB writes.
- The destructive delete runs only after the CSV parses successfully, so a bad
  file never wipes existing data and leaves nothing in its place.

## Testing

- Run against the local SQLite/Postgres dev DB with a tiny fake CSV (2–3 rows,
  including one with a quoted comma and one missing a field) and assert:
  - good rows imported at `stage = "new"`, `channel = "outbound"`
  - the bad row skipped and reported
  - LinkedIn URL normalization produces the expected stored value
- Verify the pipeline page renders a new "New" column with the imported leads.

## Security notes

- CSV is gitignored; nothing about the real list is hardcoded in committed code.
- No new web endpoint is added (no new attack surface).
- Deferred: the live app itself is unauthenticated — add a password gate later.
