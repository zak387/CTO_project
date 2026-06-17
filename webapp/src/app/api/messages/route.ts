import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const messages = await prisma.outreachMessage.findMany({
    orderBy: [{ channel: "asc" }, { step: "asc" }],
  });
  return NextResponse.json({ messages });
}
