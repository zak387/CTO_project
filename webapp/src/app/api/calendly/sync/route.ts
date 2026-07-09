import { NextResponse } from "next/server";
import { syncCalendlyDinnerBookings } from "@/lib/calendly";

// Safety-net: pull all NYC-dinner bookings from Calendly and reconcile them, so
// nothing is lost if the webhook ever misses one. Guarded by CRON_SECRET — same
// secret Vercel Cron sends as a Bearer token, and usable manually via ?token=.
// Needs the CALENDLY token in the environment (Vercel → Settings → Env Vars).
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Sync disabled: set CRON_SECRET in the environment." }, { status: 403 });
  }
  const authed =
    req.headers.get("authorization") === `Bearer ${secret}` ||
    new URL(req.url).searchParams.get("token") === secret;
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await syncCalendlyDinnerBookings();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
  }
}

// Vercel Cron issues a GET; a manual trigger can use either.
export const GET = run;
export const POST = run;
