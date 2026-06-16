import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildLeads, POSTS } from "@/lib/seeddata";

export async function POST() {
  await prisma.event.deleteMany();
  await prisma.reviewItem.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.post.deleteMany();

  for (const p of POSTS) {
    await prisma.post.create({
      data: { hook: p.hook, body: p.body, scheduledDate: new Date(p.date), status: p.status, note: p.note, approved: p.status === "live" },
    });
  }

  const leads = buildLeads();
  for (const data of leads) await prisma.lead.create({ data });

  return NextResponse.json({ status: "reset", leads: leads.length, posts: POSTS.length });
}
