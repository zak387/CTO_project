import { NextResponse } from "next/server";
import { handleDripify } from "@/lib/reconcile";

// Dripify (Pro) points its campaign webhooks here. The Simulator fires the
// identical payload. See SPEC.md §7.
export async function POST(req: Request) {
  const body = await req.json();
  const result = await handleDripify(body);
  return NextResponse.json(result);
}
