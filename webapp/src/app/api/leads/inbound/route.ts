import { NextResponse } from "next/server";
import { handleInbound } from "@/lib/reconcile";

// The landing-page form POSTs new signups here. See SPEC.md §7.
export async function POST(req: Request) {
  const body = await req.json();
  const result = await handleInbound(body);
  return NextResponse.json(result);
}
