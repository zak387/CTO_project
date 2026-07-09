// Local sanity check: read the real Supabase `subscribers` table and print what
// each row WOULD become as an inbound lead. Read-only; does not touch the app DB.
// Run from webapp/: npx tsx --env-file=.env scripts/check-supabase-read.ts
// (the --env-file flag loads .env so SUPABASE_* are available; bare tsx does not).
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
