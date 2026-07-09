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
