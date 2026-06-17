/**
 * One-time real-leads import. See docs/superpowers/specs/2026-06-17-leads-csv-import-design.md
 *
 *   npx tsx scripts/import-leads.ts data/leads.csv            # import (replaces all leads)
 *   npx tsx scripts/import-leads.ts data/leads.csv --dry-run  # preview only, no DB writes
 *
 * The CSV holds real PII and lives in the gitignored webapp/data/ folder — never committed.
 * Imported leads land at stage "connection_sent" (the board's pre-reply bucket); they jump
 * to "replied" / "booked" via the Dripify + Calendly webhooks.
 *
 * DB target: whatever POSTGRES_URL_NON_POOLING resolves to. For the real run, point it at the
 * live Neon database. The script loads webapp/.env if present (env vars already set win).
 */
import fs from "node:fs";
import path from "node:path";

// ---- load .env (only fills vars not already in the environment) ----
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

// ---- args ----
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const file = args.find((a) => !a.startsWith("--"));

function die(msg: string): never {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

if (!file) die("Usage: tsx scripts/import-leads.ts <path-to-csv> [--dry-run]");
const csvPath = path.resolve(process.cwd(), file);
if (!fs.existsSync(csvPath)) die(`File not found: ${csvPath}`);

let raw: string;
try {
  raw = fs.readFileSync(csvPath, "utf8").replace(/^﻿/, ""); // strip BOM
} catch (e) {
  die(`Could not read ${csvPath}: ${(e as Error).message}`);
}
if (!raw.trim()) die("File is empty.");

// ---- RFC-4180-ish parser: handles quoted fields, "" escapes, newlines in quotes ----
function parseDelimited(text: string, delim: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  // drop fully-empty rows (e.g. trailing newline)
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

const firstLine = raw.slice(0, raw.search(/\r?\n/) === -1 ? raw.length : raw.search(/\r?\n/));
const delim = firstLine.includes("\t") ? "\t" : ",";
const grid = parseDelimited(raw, delim);
if (grid.length < 2) die("No data rows found (need a header + at least one row).");

// ---- map headers (case/space-insensitive) ----
const header = grid[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, " "));
const findCol = (...needles: ((h: string) => boolean)[]) => {
  for (const test of needles) {
    const i = header.findIndex(test);
    if (i !== -1) return i;
  }
  return -1;
};
const col = {
  linkedin: findCol((h) => h.includes("linkedin") && h.includes("url"), (h) => h.includes("linkedin")),
  fullName: findCol((h) => h.includes("full name"), (h) => h === "name"),
  email: findCol((h) => h.includes("email")),
  first: findCol((h) => h === "first name", (h) => h.includes("first")),
  last: findCol((h) => h === "last name", (h) => h.includes("last")),
  title: findCol((h) => h.includes("job title"), (h) => h === "title"),
  company: findCol((h) => h.includes("company")),
};
if (col.company === -1) die(`Could not find a "Company Name" column. Header was: ${grid[0].join(" | ")}`);

const cell = (row: string[], i: number) => (i >= 0 && i < row.length ? row[i].trim() : "");

// ---- normalize a LinkedIn URL into a stable key for Dripify matching ----
function normLinkedin(v: string): string | null {
  let s = v.trim().replace(/^["'<]+|["'>]+$/g, "");
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  s = s.toLowerCase().split("?")[0].split("#")[0]; // drop query + hash
  s = s.replace(/^https?:\/\/www\./, "https://");   // drop www.
  s = s.replace(/\/+$/, "");                          // drop trailing slash(es)
  return s || null;
}

// ---- build the import set ----
type Row = { name: string; title: string; company: string; linkedinUrl: string | null; email: string | null };
const leads: Row[] = [];
const seen = new Set<string>();
const skipped: { row: number; reason: string }[] = [];

for (let r = 1; r < grid.length; r++) {
  const row = grid[r];
  const name = cell(row, col.fullName) || [cell(row, col.first), cell(row, col.last)].filter(Boolean).join(" ");
  const company = cell(row, col.company);
  if (!name) { skipped.push({ row: r + 1, reason: "missing name" }); continue; }
  if (!company) { skipped.push({ row: r + 1, reason: "missing company" }); continue; }

  const linkedinUrl = normLinkedin(cell(row, col.linkedin));
  if (linkedinUrl && seen.has(linkedinUrl)) {
    skipped.push({ row: r + 1, reason: `duplicate LinkedIn URL (${linkedinUrl})` });
    continue;
  }
  if (linkedinUrl) seen.add(linkedinUrl);

  const emailRaw = cell(row, col.email).toLowerCase();
  leads.push({
    name,
    title: cell(row, col.title),
    company,
    linkedinUrl,
    email: emailRaw || null,
  });
}

// ---- summary helpers ----
function reportSummary() {
  console.log(`\nParsed ${grid.length - 1} data row(s) → ${leads.length} to import, ${skipped.length} skipped.`);
  if (skipped.length) {
    const byReason = new Map<string, number>();
    for (const s of skipped) byReason.set(s.reason.replace(/\(.*\)/, "(…)"), (byReason.get(s.reason.replace(/\(.*\)/, "(…)")) ?? 0) + 1);
    console.log("Skipped reasons:");
    for (const [reason, n] of byReason) console.log(`  • ${reason}: ${n}`);
  }
  console.log("\nFirst few to import:");
  for (const l of leads.slice(0, 3)) console.log(`  • ${l.name} — ${l.title || "(no title)"} @ ${l.company} | ${l.linkedinUrl ?? "(no LinkedIn)"} | ${l.email ?? "(no email)"}`);
}

if (leads.length === 0) die("Nothing to import after parsing — aborting before any DB changes.");

async function main() {
  if (dryRun) {
    reportSummary();
    console.log("\n— dry run: no database changes made —");
    return;
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    // Replace semantics: clear fake seed + any prior import, then insert the real list.
    // Deletion only runs now, after the CSV parsed cleanly, so a bad file never wipes data.
    await prisma.event.deleteMany();
    await prisma.reviewItem.deleteMany();
    await prisma.lead.deleteMany();

    await prisma.lead.createMany({
      data: leads.map((l) => ({
        name: l.name,
        title: l.title,
        company: l.company,
        linkedinUrl: l.linkedinUrl,
        email: l.email,
        channel: "outbound",
        stage: "connection_sent",
        emailSuppressed: false,
      })),
    });

    const count = await prisma.lead.count();
    reportSummary();
    console.log(`\n✓ Imported. Database now holds ${count} lead(s), all at "Connection Sent".`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => die(e.message));
