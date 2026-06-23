import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Clear an item from the silent backstop queue once SAWA has handled it
// (SPEC.md §6). Not Adam-facing — the pipeline auto-matches replies; this only
// exists so a rare unplaceable event can be cleared by the team.
export async function POST(req: Request) {
  const { id } = await req.json();
  await prisma.reviewItem.delete({ where: { id } });
  return NextResponse.json({ status: "ok", resolved: id });
}
