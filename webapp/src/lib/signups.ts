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
      // Record AFTER the import (not before) on purpose: if the process dies
      // between the two writes, the row is simply re-imported next run — at worst
      // a duplicate event, never a silently-lost signup. (A single daily cron
      // won't run concurrently with itself, so interleaved double-imports aren't
      // a practical concern here.)
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
