# Supabase Signups Sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A daily Vercel cron pulls new rows from the Supabase `subscribers` table and feeds each through the existing `handleInbound()` reconciliation, so landing-page signups appear as inbound leads in the command center.

**Architecture:** A cron-triggered GET endpoint (`/api/sync/supabase`, guarded by `CRON_SECRET`) reads all `subscribers` rows via the Supabase service-role client, skips any already recorded in a new `SignupSync` ledger table, maps each remaining row (email → derived name/company) and delegates to `handleInbound()`. Known emails link to existing leads; strangers become new `channel:"inbound"`, `stage:"signed_up"` leads. The `SignupSync` ledger makes re-runs idempotent.

**Tech Stack:** Next.js 16 (App Router route handlers), Prisma (Postgres on Vercel), `@supabase/supabase-js`, Node built-in test runner run through `tsx`.

**Spec:** `docs/superpowers/specs/2026-07-09-supabase-signups-sync-design.md`

**Working directory:** all paths below are relative to `webapp/` unless noted. Run all commands from `webapp/`.

> ⚠️ Per `webapp/AGENTS.md`, this is Next.js 16 with breaking changes. The route handler in this plan follows the exact, already-working pattern in `src/app/api/webhooks/dripify/route.ts` (`export async function GET(req: Request)` returning `NextResponse.json(...)`). Do not invent a different route shape.

---

## Execution addendum — surgical staging (READ FIRST)

There is **uncommitted in-flight work** in the tree (a Calendly safety-net sync). To avoid sweeping it into this feature's commits, execution deviates from the per-task commit steps below:

- **Implementer subagents do NOT run any `git` commands.** They only create/edit files and run tests/typecheck/lint. The controller performs all staging and commits.
- **Three files already carry the user's uncommitted work**; my additions must live alongside it and stay **uncommitted** so the user commits them with their Calendly work:
  - `webapp/prisma/schema.prisma` — append the `SignupSync` model only; do not reformat the rest of the file.
  - `webapp/src/lib/reconcile.ts` — add `notes` to `handleInbound` only.
  - `webapp/vercel.json` — **already exists** with a Calendly cron. **Merge** the Supabase cron into the existing `crons` array (do NOT overwrite). Use schedule `0 10 * * *` (offset from the Calendly job's `0 9 * * *`).
- **Wholly-new files are committed** by the controller, by explicit path: `subscriber-map.ts`, `subscriber-map.test.ts`, `supabase.ts`, `signups.ts`, `route.ts`, `scripts/check-supabase-read.ts`. `package.json` is currently clean, so its dependency + `test` script addition is committed too.
- Wherever a task step says "Create `webapp/vercel.json`", treat it as "merge into the existing one". Wherever a step says `git add ... && git commit`, the controller does it and skips the three shared files.

---

## File Structure

| File | Responsibility |
|---|---|
| `webapp/src/lib/subscriber-map.ts` | **Pure** module: `Subscriber`/`InboundInput` types + `mapSubscriber()` (email → derived name/company). No I/O, no imports — so it is trivially unit-testable. |
| `webapp/src/lib/subscriber-map.test.ts` | Unit tests for `mapSubscriber()` (Node test runner via tsx). |
| `webapp/src/lib/supabase.ts` | `getSupabase()` — lazily builds the service-role Supabase client from env; throws a clear error if env is missing. |
| `webapp/src/lib/signups.ts` | `syncSupabaseSignups()` — orchestrates fetch → dedupe (SignupSync) → map → `handleInbound` → record. Returns a summary. |
| `webapp/src/app/api/sync/supabase/route.ts` | Cron endpoint. Verifies `CRON_SECRET`, calls `syncSupabaseSignups()`, returns JSON summary. |
| `webapp/vercel.json` | Registers the daily cron pointing at `/api/sync/supabase`. |
| `webapp/prisma/schema.prisma` | Adds the `SignupSync` model. |
| `webapp/src/lib/reconcile.ts` | `handleInbound()` gains an optional `notes` field (stored on newly created leads). |
| `webapp/package.json` | Adds `@supabase/supabase-js` dependency and a `test` script. |
| `webapp/scripts/check-supabase-read.ts` | Throwaway local check: reads real Supabase + prints mapped rows (proves creds + query + mapping without touching the app DB). |

---

## Task 1: Add the SignupSync model and the Supabase dependency

**Files:**
- Modify: `webapp/prisma/schema.prisma` (append a model)
- Modify: `webapp/package.json` (dependency + test script — via npm)

- [ ] **Step 1: Add the `SignupSync` model to the Prisma schema**

Append to the end of `webapp/prisma/schema.prisma`:

```prisma
// Ledger of Supabase `subscribers` rows already imported as leads, so the daily
// sync never imports the same signup twice (see specs/2026-07-09-supabase-signups-sync-design.md).
model SignupSync {
  supabaseId String   @id      // subscribers.id (uuid)
  leadId     Int?               // the lead it became / linked to (null if it went to review)
  createdAt  DateTime @default(now())
}
```

- [ ] **Step 2: Install the Supabase client**

Run: `npm install @supabase/supabase-js`
Expected: `package.json` gains `"@supabase/supabase-js"` under dependencies; no errors.

- [ ] **Step 3: Add a `test` script to `package.json`**

In `webapp/package.json`, add this entry to the `"scripts"` object (leave the others unchanged):

```json
"test": "node --import tsx --test src/lib/subscriber-map.test.ts"
```

- [ ] **Step 4: Regenerate the Prisma client and push the new table to the local DB**

Run: `npx prisma generate`
Expected: "Generated Prisma Client" — no errors. This makes `prisma.signupSync` available with correct types.

> Note: `npx prisma db push` against the local DB requires the schema's datasource to match your local `.env`. The committed schema uses `provider = "postgresql"`; the production build (`npm run build`) runs `prisma db push` automatically against Vercel's Postgres, which is where the table actually needs to exist. Generating the client here is enough to compile and type-check locally.

- [ ] **Step 5: Commit**

```bash
git add webapp/prisma/schema.prisma webapp/package.json webapp/package-lock.json
git commit -m "Add SignupSync model and @supabase/supabase-js for signup sync"
```

---

## Task 2: The pure mapper `mapSubscriber()` (TDD)

**Files:**
- Create: `webapp/src/lib/subscriber-map.ts`
- Test: `webapp/src/lib/subscriber-map.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `webapp/src/lib/subscriber-map.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { mapSubscriber } from "./subscriber-map";

test("dotted email → initial + surname, company from domain", () => {
  const out = mapSubscriber({
    id: "1", email: "m.zimmermann@criteo.com", domain: "criteo.com",
    created_at: "2026-07-06T20:23:24Z", source: null,
  });
  assert.equal(out.name, "M. Zimmermann");
  assert.equal(out.company, "Criteo");
  assert.equal(out.email, "m.zimmermann@criteo.com");
  assert.equal(out.title, "");
});

test("single-token local part → capitalized", () => {
  const out = mapSubscriber({
    id: "2", email: "sameer@netsolutions.com", domain: "netsolutions.com",
    created_at: "2026-07-02T14:51:05Z", source: "net-solutions",
  });
  assert.equal(out.name, "Sameer");
  assert.equal(out.company, "Netsolutions");
});

test("hyphen/underscore separators split into words", () => {
  const out = mapSubscriber({
    id: "3", email: "jane_doe-smith@example.io", domain: "example.io",
    created_at: "2026-07-01T00:00:00Z", source: null,
  });
  assert.equal(out.name, "Jane Doe Smith");
});

test("null domain falls back to the email's domain", () => {
  const out = mapSubscriber({
    id: "4", email: "jill@bigscoots.com", domain: null,
    created_at: "2026-07-01T00:00:00Z", source: null,
  });
  assert.equal(out.company, "Bigscoots");
  assert.equal(out.name, "Jill");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot find module `./subscriber-map` (or `mapSubscriber` is not a function).

- [ ] **Step 3: Write the implementation**

Create `webapp/src/lib/subscriber-map.ts`:

```ts
// Pure mapping: a thin Supabase `subscribers` row → the shape handleInbound wants.
// Signups carry only email + domain, so name/company are DERIVED (rough on
// purpose — SAWA can correct them later). No I/O here, so it stays unit-testable.

export type Subscriber = {
  id: string;
  email: string;
  domain: string | null;
  created_at: string;
  source: string | null;
};

export type InboundInput = {
  name: string;
  email: string;
  company: string;
  title: string;
};

// "criteo" → "Criteo", "mcdonald" → "Mcdonald" (first letter of each word up).
const titleCase = (s: string) =>
  s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());

// "m.zimmermann" → "M. Zimmermann"; "sameer" → "Sameer"; single-letter tokens
// become an initial ("m" → "M.").
function nameFromEmail(email: string): string {
  const local = (email.split("@")[0] || email).trim();
  const tokens = local.split(/[._-]+/).filter(Boolean);
  if (tokens.length === 0) return email;
  return tokens
    .map((t) => (t.length === 1 ? t.toUpperCase() + "." : titleCase(t)))
    .join(" ");
}

// "criteo.com" → "Criteo". Falls back to the email's own domain if the column
// is null. Takes the first dotted label (good enough for the campaign).
function companyFromDomain(domain: string | null, email: string): string {
  const d = (domain || email.split("@")[1] || "").trim();
  if (!d) return "";
  return titleCase(d.split(".")[0]);
}

export function mapSubscriber(row: Subscriber): InboundInput {
  return {
    name: nameFromEmail(row.email),
    email: row.email,
    company: companyFromDomain(row.domain, row.email),
    title: "",
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add webapp/src/lib/subscriber-map.ts webapp/src/lib/subscriber-map.test.ts
git commit -m "Add pure mapSubscriber() with tests"
```

---

## Task 3: The Supabase client factory

**Files:**
- Create: `webapp/src/lib/supabase.ts`

- [ ] **Step 1: Write the implementation**

Create `webapp/src/lib/supabase.ts`:

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazily-built service-role client. Service role bypasses Row Level Security and
// must NEVER reach the browser — this module is only imported by server code.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors from `supabase.ts`.

- [ ] **Step 3: Commit**

```bash
git add webapp/src/lib/supabase.ts
git commit -m "Add service-role Supabase client factory"
```

---

## Task 4: Let `handleInbound()` store a note on new leads

**Files:**
- Modify: `webapp/src/lib/reconcile.ts:220-263` (the `handleInbound` function)

- [ ] **Step 1: Add an optional `notes` field to the body type**

In `webapp/src/lib/reconcile.ts`, change the `handleInbound` signature from:

```ts
export async function handleInbound(body: {
  name: string;
  email: string;
  company: string;
  title?: string;
  linkedin_url?: string;
}) {
```

to:

```ts
export async function handleInbound(body: {
  name: string;
  email: string;
  company: string;
  title?: string;
  linkedin_url?: string;
  notes?: string;
}) {
```

- [ ] **Step 2: Persist the note in the create path**

In the same function, in the "Genuinely new" branch, change the `prisma.lead.create` data from:

```ts
  const lead = await prisma.lead.create({
    data: {
      name: body.name,
      title: body.title ?? "",
      company: body.company,
      email: body.email,
      linkedinUrl: body.linkedin_url || null,
      channel: "inbound",
      stage: "signed_up",
    },
  });
```

to (adds the `notes` line):

```ts
  const lead = await prisma.lead.create({
    data: {
      name: body.name,
      title: body.title ?? "",
      company: body.company,
      email: body.email,
      linkedinUrl: body.linkedin_url || null,
      channel: "inbound",
      stage: "signed_up",
      notes: body.notes ?? null,
    },
  });
```

> The existing landing-form caller (`src/app/api/leads/inbound/route.ts`) passes no `notes`, so it stays `undefined` → `null`. Backward compatible.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add webapp/src/lib/reconcile.ts
git commit -m "handleInbound: accept optional notes on new inbound leads"
```

---

## Task 5: The sync orchestrator `syncSupabaseSignups()`

**Files:**
- Create: `webapp/src/lib/signups.ts`

- [ ] **Step 1: Write the implementation**

Create `webapp/src/lib/signups.ts`:

```ts
import { prisma } from "./prisma";
import { getSupabase } from "./supabase";
import { handleInbound } from "./reconcile";
import { mapSubscriber, type Subscriber } from "./subscriber-map";

export type SyncSummary = {
  pulled: number;   // rows read from Supabase
  created: number;  // new inbound leads
  linked: number;   // matched an existing lead
  skipped: number;  // already imported, or unusable, or sent to review
  errors: number;   // rows that threw
};

// Pull every subscriber, import the ones we haven't seen before. Reading all
// rows each run is fine at campaign scale (tens–low hundreds) and lets the
// SignupSync ledger — not a fragile timestamp cursor — guarantee idempotency.
export async function syncSupabaseSignups(): Promise<SyncSummary> {
  const table = process.env.SUPABASE_SIGNUPS_TABLE || "subscribers";
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from(table)
    .select("id,email,domain,created_at,source")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Supabase read failed: ${error.message}`);

  const rows = (data ?? []) as Subscriber[];
  const summary: SyncSummary = { pulled: rows.length, created: 0, linked: 0, skipped: 0, errors: 0 };
  if (rows.length === 0) return summary;

  // Which of these ids have we already imported?
  const already = await prisma.signupSync.findMany({
    where: { supabaseId: { in: rows.map((r) => r.id) } },
    select: { supabaseId: true },
  });
  const seen = new Set(already.map((s) => s.supabaseId));

  for (const row of rows) {
    if (seen.has(row.id)) { summary.skipped++; continue; }
    try {
      if (!row.email) {
        // Nothing to match on — record it so we don't re-examine it every day.
        await prisma.signupSync.create({ data: { supabaseId: row.id, leadId: null } });
        summary.skipped++;
        continue;
      }
      const input = mapSubscriber(row);
      const notes = row.source ? `Landing signup (source: ${row.source})` : "Landing signup";
      const result = await handleInbound({ ...input, notes });

      if (result.status === "created") summary.created++;
      else if (result.status === "linked") summary.linked++;
      else summary.skipped++; // "review"

      // The "review" branch has no leadId, so read it defensively.
      const leadId = "leadId" in result ? result.leadId : null;
      await prisma.signupSync.create({
        data: { supabaseId: row.id, leadId },
      });
    } catch (e) {
      summary.errors++;
      console.error(`[supabase sync] row ${row.id} failed:`, e);
    }
  }
  return summary;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (Confirms `prisma.signupSync`, `handleInbound`'s new `notes`, and `mapSubscriber` all line up.)

- [ ] **Step 3: Commit**

```bash
git add webapp/src/lib/signups.ts
git commit -m "Add syncSupabaseSignups orchestrator"
```

---

## Task 6: The cron endpoint

**Files:**
- Create: `webapp/src/app/api/sync/supabase/route.ts`

- [ ] **Step 1: Write the implementation**

Create `webapp/src/app/api/sync/supabase/route.ts` (follows the working `webhooks/dripify/route.ts` pattern):

```ts
import { NextResponse } from "next/server";
import { syncSupabaseSignups } from "@/lib/signups";

// Vercel Cron calls this daily and automatically sends `Authorization: Bearer
// $CRON_SECRET` (from the CRON_SECRET env var), so the check below rejects anyone
// else. You can also trigger it by hand with the same header.
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const summary = await syncSupabaseSignups();
    console.log("[supabase sync]", JSON.stringify(summary));
    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    console.error("[supabase sync] failed:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add webapp/src/app/api/sync/supabase/route.ts
git commit -m "Add /api/sync/supabase cron endpoint"
```

---

## Task 7: Register the daily cron

**Files:**
- Create: `webapp/vercel.json`

- [ ] **Step 1: Write the cron config**

Create `webapp/vercel.json`:

```json
{
  "crons": [
    { "path": "/api/sync/supabase", "schedule": "0 9 * * *" }
  ]
}
```

> `0 9 * * *` = once per day at 09:00 UTC — within the Vercel Free/Hobby one-run-per-day cron limit. Vercel automatically attaches the `CRON_SECRET` bearer header when calling it.

- [ ] **Step 2: Commit**

```bash
git add webapp/vercel.json
git commit -m "Register daily Supabase signup sync cron"
```

---

## Task 8: Local read + map verification (against real Supabase)

**Files:**
- Create: `webapp/scripts/check-supabase-read.ts`

This proves the credentials, query, and mapping all work end-to-end against the real 10 rows — without needing the app database.

- [ ] **Step 1: Write the check script**

Create `webapp/scripts/check-supabase-read.ts`:

```ts
// Local sanity check: read the real Supabase `subscribers` table and print what
// each row WOULD become as an inbound lead. Read-only; does not touch the app DB.
// Run: npx tsx --env-file=.env scripts/check-supabase-read.ts   (loads webapp/.env)
import { getSupabase } from "../src/lib/supabase";
import { mapSubscriber, type Subscriber } from "../src/lib/subscriber-map";

async function main() {
  const table = process.env.SUPABASE_SIGNUPS_TABLE || "subscribers";
  const { data, error } = await getSupabase()
    .from(table)
    .select("id,email,domain,created_at,source")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as Subscriber[];
  console.log(`Read ${rows.length} rows from "${table}":\n`);
  for (const r of rows) {
    const m = mapSubscriber(r);
    console.log(`  ${r.email}`);
    console.log(`    → name: "${m.name}"  company: "${m.company}"  source: ${r.source ?? "(none)"}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run it**

Run: `npx tsx --env-file=.env scripts/check-supabase-read.ts`
Expected: prints ~10 rows, each with a sensible derived name + company, e.g.:
```
  m.zimmermann@criteo.com
    → name: "M. Zimmermann"  company: "Criteo"  source: (none)
  sameer@netsolutions.com
    → name: "Sameer"  company: "Netsolutions"  source: net-solutions
```
If it throws an env error, confirm `webapp/.env` has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. (`tsx` auto-loads `.env`.)

- [ ] **Step 3: Commit**

```bash
git add webapp/scripts/check-supabase-read.ts
git commit -m "Add local Supabase read+map verification script"
```

---

## Task 9: Deploy config + end-to-end verification

This is the real proof the whole chain works in production (avoids the local Postgres/SQLite provider switch entirely).

- [ ] **Step 1: Set the environment variables in Vercel**

In the Vercel dashboard → the command-center project → **Settings → Environment Variables**, add (Production scope), copying the values from `webapp/.env`:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SIGNUPS_TABLE` = `subscribers`
- `CRON_SECRET`

(These are NOT in git — `.env` is gitignored — so they must be entered here for production.)

- [ ] **Step 2: Deploy**

Push to `main` (auto-deploys) or run the Vercel deploy skill. The build runs `prisma generate && prisma db push`, which creates the `SignupSync` table in Vercel's Postgres.

Run: `git push origin main`
Expected: Vercel build succeeds; the deployment shows a registered cron under the project's **Cron Jobs** tab.

- [ ] **Step 3: Trigger the endpoint manually and confirm the summary**

Replace `<SECRET>` with the `CRON_SECRET` value:

```bash
curl -s -H "Authorization: Bearer <SECRET>" https://cto-project-theta.vercel.app/api/sync/supabase
```
Expected first run: `{"ok":true,"pulled":10,"created":N,"linked":M,"skipped":K,"errors":0}` where `created + linked + skipped = 10`.

- [ ] **Step 4: Confirm idempotency**

Run the exact same `curl` again.
Expected: `{"ok":true,"pulled":10,"created":0,"linked":0,"skipped":10,"errors":0}` — nothing re-imported.

- [ ] **Step 5: Confirm unauthorized access is rejected**

```bash
curl -s -o /dev/null -w "%{http_code}" https://cto-project-theta.vercel.app/api/sync/supabase
```
Expected: `401`.

- [ ] **Step 6: Confirm the leads appear**

Open the command center pipeline. Expected: the imported signups appear in the **inbound** lane at **Signed Up**, with derived names/companies and a "Landing signup" note.

- [ ] **Step 7: Final commit (if any config files changed)**

```bash
git add -A
git commit -m "Wire up Supabase signup sync (verified end-to-end)" || echo "nothing to commit"
```

---

## Definition of Done

- `npm test` passes (mapper unit tests).
- `npx tsc --noEmit` and `npm run lint` are clean.
- `scripts/check-supabase-read.ts` prints sensible derived leads for the real rows.
- The deployed endpoint returns a correct summary, is idempotent on re-run, and returns 401 without the secret.
- Imported signups show in the inbound lane; known emails link instead of duplicating.
- The cron appears in Vercel's Cron Jobs tab.
