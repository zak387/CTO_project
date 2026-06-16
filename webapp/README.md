# SAWA Command Center — functional prototype

The first working build. Proves the data flow (Dripify/Calendly/landing → Reconciliation Queue → live dashboard) **without any paid plans**, using a built-in Event Simulator. See `../SPEC.md` §6–7.

## Run it
```bash
cd webapp
npm install        # first time only
npx prisma generate
npx prisma db push # creates prisma/dev.db (first time only)
npx tsx prisma/seed.ts   # load demo leads (or hit Reset in the Simulator)
npm run dev
```
Open the URL it prints (http://localhost:3000, or 3001 if 3000 is busy).

## Pages
- **/** — Briefing (Waiting-on-you hero · funnel · next meetings) — live
- **/pipeline** — Lead Pipeline kanban (Outbound / Inbound) — live
- **/simulator** — fire the exact Dripify/Calendly payloads and watch the other pages update

## How to demo
1. Open **/simulator** in one tab and **/pipeline** (or **/**) in another.
2. In the Simulator, click **▶ Fire: Connected / Message Sent / Replied** on a lead — watch its card walk across the kanban.
3. Click **📅 Book call** on a replied lead — it jumps to Booked (matched by hidden ID even though the booking uses a personal Gmail).
4. Add a **landing-page signup** — a new inbound lead appears.
5. **↺ Reset demo data** to start over.

## What's real vs. simulated
- **Real:** the webhook receiver endpoints (`/api/webhooks/dripify`, `/api/webhooks/calendly`, `/api/leads/inbound`), the Reconciliation Queue (matching ladder + rules), the database, the live UI.
- **Simulated:** only the *trigger*. When Dripify Pro / Calendly paid are active, point them at these same URLs — no code change.

## Stack
Next.js 16 (App Router, Turbopack) · Prisma 6 + SQLite (local) · TypeScript. For Vercel deploy, swap SQLite → Postgres (Neon/Vercel Postgres) in `prisma/schema.prisma`.
