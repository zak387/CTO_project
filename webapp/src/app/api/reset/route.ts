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

export async function POST() {
  await prisma.event.deleteMany();
  await prisma.reviewItem.deleteMany();
  await prisma.lead.deleteMany();

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
