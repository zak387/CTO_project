import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Clear an item from the Reconciliation Queue once it's been handled
// (SPEC.md §6). Without this the review tray is a dead-end — items pile up
// with no way to dismiss them. Same open posture as /api/leads/override.
export async function POST(req: Request) {
  const { id } = await req.json();
  await prisma.reviewItem.delete({ where: { id } });
  return NextResponse.json({ status: "ok", resolved: id });
}
