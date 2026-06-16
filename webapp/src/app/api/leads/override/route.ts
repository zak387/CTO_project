import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Manual override (the safety net, SPEC.md §5.E): move a lead's stage by hand
// when a webhook misfires.
export async function POST(req: Request) {
  const { id, stage } = await req.json();
  const lead = await prisma.lead.update({
    where: { id },
    data: { stage },
  });
  await prisma.event.create({ data: { leadId: id, type: stage } });
  return NextResponse.json({ status: "ok", leadId: lead.id, stage });
}
