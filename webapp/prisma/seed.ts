import { PrismaClient } from "@prisma/client";
import { buildLeads, POSTS } from "../src/lib/seeddata";

const prisma = new PrismaClient();

async function main() {
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

  console.log(`Seeded ${leads.length} leads + ${POSTS.length} posts.`);
}

main().finally(() => prisma.$disconnect());
