import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const slug = (n: string) => "https://linkedin.com/in/" + n.toLowerCase().replace(/[^a-z]+/g, "-");
const mail = (n: string, c: string) =>
  n.toLowerCase().split(" ")[0] + "@" + c.toLowerCase().replace(/[^a-z]+/g, "") + ".com";

const OUT = [
  ["Derek Cho", "CTO", "Northwind Logistics", "message_sent"],
  ["Marcus Feld", "CTO", "Tessellate AI", "connection_sent"],
  ["Hiro Tanaka", "CTO", "Kanso Robotics", "connection_sent"],
  ["Priya Nair", "CIO", "Solstice Group", "connection_sent"],
  ["Lena Gruber", "CIO", "Apex Manufacturing", "connected"],
  ["Owen Brady", "CTO", "Linnet Fintech", "connected"],
  ["Yusuf Demir", "CTO", "Aster Cloud", "message_sent"],
  ["Grace Okoro", "CIO", "Pell Rowe", "message_sent"],
  ["Thomas Wells", "CTO", "Halcyon Media", "replied"],
  ["Rajesh Kumar", "CTO", "Vantage Health", "booked"],
];
const IN = [
  ["Anita Patel", "CIO", "Meridian Bank", "replied"],
  ["Sofia Marchetti", "CIO", "Brightline Retail", "booked"],
  ["Carla Mendes", "CIO", "Vela Energy", "emailed"],
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

export async function POST() {
  await prisma.event.deleteMany();
  await prisma.reviewItem.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.post.deleteMany();

  for (const [hook, body, date, status] of POSTS) {
    await prisma.post.create({
      data: { hook, body, scheduledDate: new Date(date), status, approved: status === "live" },
    });
  }

  const rows: [string, string, string, string, string][] = [
    ...OUT.map((r) => [...r, "outbound"] as [string, string, string, string, string]),
    ...IN.map((r) => [...r, "inbound"] as [string, string, string, string, string]),
  ];

  for (const [name, title, company, stage, channel] of rows) {
    const booked = stage === "booked";
    await prisma.lead.create({
      data: {
        name, title, company, channel, stage,
        linkedinUrl: slug(name),
        email: mail(name, company),
        emailSuppressed: stage === "replied" || booked,
        meetingAt: booked ? new Date("2026-06-17T10:30:00") : null,
        meetingEmail: booked ? mail(name, company) : null,
        events: { create: [{ type: stage }] },
      },
    });
  }
  return NextResponse.json({ status: "reset" });
}
