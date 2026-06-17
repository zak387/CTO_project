import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Edit an outreach message's copy, change its status, or approve it
// (Artefacts → Outreach messages). Mirrors /api/posts/update.
export async function POST(req: Request) {
  const { id, body, subject, status, approved } = await req.json();
  const data: Record<string, unknown> = {};
  if (body !== undefined) data.body = body;
  if (subject !== undefined) data.subject = subject;
  if (status !== undefined) data.status = status;
  if (approved !== undefined) data.approved = approved;
  const message = await prisma.outreachMessage.update({ where: { id }, data });
  return NextResponse.json({ status: "ok", message });
}
