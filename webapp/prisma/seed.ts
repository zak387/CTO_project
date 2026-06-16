import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type Seed = {
  name: string; title: string; company: string; stage: string;
  channel?: string; suppress?: boolean; meeting?: string;
};

const slug = (n: string) => "https://linkedin.com/in/" + n.toLowerCase().replace(/[^a-z]+/g, "-");
const mail = (n: string, c: string) =>
  n.toLowerCase().split(" ")[0] + "@" + c.toLowerCase().replace(/[^a-z]+/g, "") + ".com";

const OUT: Seed[] = [
  { name: "Derek Cho", title: "CTO", company: "Northwind Logistics", stage: "message_sent" },
  { name: "Marcus Feld", title: "CTO", company: "Tessellate AI", stage: "connection_sent" },
  { name: "Hiro Tanaka", title: "CTO", company: "Kanso Robotics", stage: "connection_sent" },
  { name: "Priya Nair", title: "CIO", company: "Solstice Group", stage: "connection_sent" },
  { name: "Lena Gruber", title: "CIO", company: "Apex Manufacturing", stage: "connected" },
  { name: "Owen Brady", title: "CTO", company: "Linnet Fintech", stage: "connected" },
  { name: "Yusuf Demir", title: "CTO", company: "Aster Cloud", stage: "message_sent" },
  { name: "Grace Okoro", title: "CIO", company: "Pell Rowe", stage: "message_sent" },
  { name: "Thomas Wells", title: "CTO", company: "Halcyon Media", stage: "replied", suppress: true },
  { name: "Rajesh Kumar", title: "CTO", company: "Vantage Health", stage: "booked", suppress: true, meeting: "2026-06-17T10:30:00" },
];

const IN: Seed[] = [
  { name: "Anita Patel", title: "CIO", company: "Meridian Bank", stage: "replied", channel: "inbound" },
  { name: "Sofia Marchetti", title: "CIO", company: "Brightline Retail", stage: "booked", channel: "inbound", meeting: "2026-06-17T14:00:00" },
  { name: "Carla Mendes", title: "CIO", company: "Vela Energy", stage: "emailed", channel: "inbound" },
];

async function main() {
  await prisma.event.deleteMany();
  await prisma.reviewItem.deleteMany();
  await prisma.lead.deleteMany();

  for (const s of [...OUT, ...IN]) {
    await prisma.lead.create({
      data: {
        name: s.name,
        title: s.title,
        company: s.company,
        linkedinUrl: slug(s.name),
        email: mail(s.name, s.company),
        channel: s.channel ?? "outbound",
        stage: s.stage,
        emailSuppressed: s.suppress ?? false,
        meetingAt: s.meeting ? new Date(s.meeting) : null,
        meetingEmail: s.meeting ? mail(s.name, s.company) : null,
        events: { create: [{ type: s.stage }] },
      },
    });
  }
  console.log("Seeded", OUT.length + IN.length, "leads.");
}

main().finally(() => prisma.$disconnect());
