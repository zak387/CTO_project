import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Edit a post's text, change its status, or approve it (Artefacts, SPEC.md §4).
export async function POST(req: Request) {
  const { id, body, status, approved } = await req.json();
  const data: Record<string, unknown> = {};
  if (body !== undefined) data.body = body;
  if (status !== undefined) data.status = status;
  if (approved !== undefined) data.approved = approved;
  const post = await prisma.post.update({ where: { id }, data });
  return NextResponse.json({ status: "ok", post });
}
