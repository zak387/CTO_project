import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const leads = await prisma.lead.findMany({
    orderBy: { updatedAt: "desc" },
    include: { events: { orderBy: { at: "asc" } } },
  });
  const reviews = await prisma.reviewItem.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ leads, reviews });
}
