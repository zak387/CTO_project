import { NextResponse } from "next/server";
import { handleCalendly } from "@/lib/reconcile";

// Calendly (paid) points booking webhooks here; the booking link carries the
// hidden lead id. The Simulator fires the identical payload. See SPEC.md §7.
export async function POST(req: Request) {
  const body = await req.json();
  const result = await handleCalendly(body);
  return NextResponse.json(result);
}
