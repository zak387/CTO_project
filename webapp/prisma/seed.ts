import { PrismaClient } from "@prisma/client";
import { buildLeads, POSTS, MESSAGES } from "../src/lib/seeddata";

const prisma = new PrismaClient();

async function main() {
  await prisma.event.deleteMany();
  await prisma.reviewItem.deleteMany();
  await prisma.lead.deleteMany();
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

  const leads = buildLeads();
  for (const data of leads) await prisma.lead.create({ data });

  console.log(`Seeded ${leads.length} leads + ${POSTS.length} posts + ${MESSAGES.length} messages.`);
}

main().finally(() => prisma.$disconnect());
