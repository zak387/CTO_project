# SAWA Command Center — NY CTO Dinner

A one-off campaign command center for SAWA, used to run an invite-only CTO/CIO dinner in New York (event **Jul 21, 2026**). It tracks leads from first touch to **booked call with Adam** across two channels (outbound LinkedIn via Dripify, inbound via a landing page), with self-updating integrations and a clean dashboard.

## Documents
- **[CLAUDE.md](CLAUDE.md)** — project context (who/what/why, the campaign, decisions, constraints).
- **[SPEC.md](SPEC.md)** — the build blueprint, 10 sections (screens, data model, integrations, tech, scope).

## The app
- **[webapp/](webapp/)** — the live Next.js app. See **[webapp/README.md](webapp/README.md)** to run it.
  - Overview · Lead Pipeline (kanban) · Lead Detail · Event Simulator are built and working.
  - Real webhook receivers + the Reconciliation Queue are proven via a built-in Event Simulator (no paid plans needed to test).

## Mockups
- **[mockups/spec-screens/](mockups/spec-screens/)** — the designed screens (numbered to match SPEC.md sections).
- **[mockups/exploration-proposals/](mockups/exploration-proposals/)** — early architecture concepts (archive).

## Stack
Next.js 16 (App Router, Turbopack) · TypeScript · Prisma + SQLite (local) → Postgres on Vercel.
