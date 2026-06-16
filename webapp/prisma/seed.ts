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

const POSTS: [string, string, string, string][] = [
  ["US entry myth", "Why the best US market entries start at the dinner table, not the boardroom.", "2026-06-08", "live"],
  ["Infra at scale", "3 things every CIO underestimates about scaling infrastructure into the US.", "2026-06-10", "live"],
  ["Trust & speed", "In US enterprise, trust is the bottleneck — not technology.", "2026-06-12", "live"],
  ["Boardroom vs table", "The boardroom optimizes for consensus. The dinner table optimizes for candor.", "2026-06-15", "live"],
  ["CIO underestimates", "The one question every CTO should ask before entering the US market.", "2026-06-17", "scheduled"],
  ["20 leaders said yes", "The dinner invite that 20+ tech leaders have already said yes to.", "2026-06-19", "draft"],
  ["The guest list", "Who's actually in the room matters more than what's on the agenda.", "2026-06-22", "draft"],
  ["What to expect", "What a SAWA dinner actually looks like — no slides, no pitch.", "2026-06-24", "draft"],
  ["Final seats", "We're down to the last handful of seats for the New York dinner.", "2026-06-26", "draft"],
  ["Why New York", "Why New York is the only place to start a serious US enterprise push.", "2026-06-29", "draft"],
  ["Meet Adam", "Meet Adam — the person behind the table.", "2026-07-01", "draft"],
  ["Peer pressure (good)", "The fastest way to de-risk a US move: a room of peers who've done it.", "2026-07-03", "draft"],
  ["Countdown", "Two weeks to the dinner. Here's what we're cooking up.", "2026-07-06", "draft"],
  ["One week out", "7 days out. The guest list is closed.", "2026-07-08", "draft"],
  ["See you there", "Final details for our New York CTO/CIO dinner.", "2026-07-10", "draft"],
];

async function main() {
  await prisma.event.deleteMany();
  await prisma.reviewItem.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.post.deleteMany();

  for (const [hook, body, date, status] of POSTS) {
    await prisma.post.create({
      data: { hook, body, scheduledDate: new Date(date), status, approved: status === "live" },
    });
  }

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
