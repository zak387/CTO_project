import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { POSTS, MESSAGES } from "@/lib/seeddata";

// Non-destructive content reseed: refreshes ONLY the Artefacts content tables
// (Post + OutreachMessage) from the seed file. It deliberately does NOT touch
// Lead / Event / ReviewItem, so the real imported lead list is preserved.
//
// Safe by default: DISABLED unless a RESEED_TOKEN env var is set, and then it
// requires a matching ?token= on the request. So there is no open, unguarded
// mutation endpoint in production.
export async function POST(req: Request) {
  const token = process.env.RESEED_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Reseed is disabled. Set RESEED_TOKEN in the environment to enable it." },
      { status: 403 }
    );
  }
  if (new URL(req.url).searchParams.get("token") !== token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  await prisma.post.deleteMany();
  await prisma.outreachMessage.deleteMany();

  for (const p of POSTS) {
    await prisma.post.create({
      data: { hook: p.hook, body: p.body, scheduledDate: new Date(p.date), status: p.status, note: p.note, approved: p.status === "live" },
    });
  }
  for (const m of MESSAGES) {
    await prisma.outreachMessage.create({
      data: { channel: m.channel, label: m.label, step: m.step, meta: m.meta, subject: m.subject, body: m.body, status: m.status, note: m.note, approved: m.status !== "needs_review" },
    });
  }

  return NextResponse.json({ status: "ok", posts: POSTS.length, messages: MESSAGES.length });
}
