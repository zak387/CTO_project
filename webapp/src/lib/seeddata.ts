// Shared dummy data for the seed script and the /api/reset endpoint.

const FIRST = ["Derek", "Marcus", "Hiro", "Priya", "Lena", "Owen", "Yusuf", "Grace", "Ben", "Anita",
  "Sofia", "Carla", "Nadia", "Eli", "Devon", "Rajesh", "Thomas", "Elena", "Maya", "Victor",
  "Aisha", "Liam", "Noor", "Hannah", "Diego", "Sven", "Ravi", "Tara", "Felix", "Zoe",
  "Omar", "Ingrid", "Kojo", "Mira", "Pavel", "Renee", "Sami", "Lucia", "Hugo", "Wei"];
const LAST = ["Cho", "Feld", "Tanaka", "Nair", "Gruber", "Brady", "Demir", "Okoro", "Carter", "Patel",
  "Marchetti", "Mendes", "Rahman", "Stein", "Park", "Kumar", "Wells", "Sousa", "Vance", "Holt",
  "Bauer", "Russo", "Frost", "Adeyemi", "Costa", "Lindqvist", "Iyer", "Boyd", "Klein", "Marsh",
  "Hassan", "Berg", "Mensah", "Solis", "Novak", "Dubois", "Haddad", "Romero", "Weber", "Zhang"];
const COMPANY = ["Northwind Logistics", "Tessellate AI", "Kanso Robotics", "Solstice Group", "Apex Manufacturing",
  "Linnet Fintech", "Aster Cloud", "Pell & Rowe", "Madrona Soft", "Meridian Bank", "Brightline Retail",
  "Vela Energy", "Forth Health", "Wavelength", "Lumen Retail", "Vantage Health", "Halcyon Media",
  "Beacon Health", "Cobalt Commerce", "Drift Apparel", "Evergreen Foods", "Falcon Tools", "Greywind Media",
  "Harbor Goods", "Ironclad SaaS", "Juniper Beauty", "Kestrel Auto", "Loom Textiles", "Mainsail Travel",
  "Nimbus Tech", "Orchard Grocer", "Pinecone Labs", "Quartz Living", "Ridgeline Sports", "Summit Outdoors",
  "Tidal Cosmetics", "Umbra Lighting", "Verdant Home", "Willow Pets", "Xenon Gaming"];

const OUT_CHAIN = ["connection_sent", "connected", "message_sent", "replied", "booked"];
const IN_CHAIN = ["signed_up", "emailed", "replied", "booked"];
const LAST_AGO = [10, 35, 90, 150, 320, 60, 480, 1440, 200, 25, 720, 2880]; // minutes ago for current stage
const MEET_OFFSETS = [-7, -5, -3, -1, 1, 2, 3, 5, 7, 10, 14, 18, -2, 4]; // days from now

const slugify = (n: string) => n.toLowerCase().replace(/[^a-z]+/g, "-");
const mailOf = (n: string, c: string) => n.toLowerCase().split(" ")[0] + "@" + c.toLowerCase().replace(/[^a-z]+/g, "") + ".com";

type LeadData = {
  name: string; title: string; company: string; channel: string; stage: string;
  emailSuppressed: boolean; linkedinUrl: string; email: string;
  meetingAt: Date | null; meetingEmail: string | null;
  events: { create: { type: string; at: Date }[] };
};

export function buildLeads(now: Date = new Date()): LeadData[] {
  const leads: LeadData[] = [];
  let idx = 0;
  let bookedCount = 0;

  const add = (channel: string, stage: string, count: number) => {
    const chain = channel === "inbound" ? IN_CHAIN : OUT_CHAIN;
    for (let k = 0; k < count; k++, idx++) {
      const name = FIRST[idx % FIRST.length] + " " + LAST[(idx * 3 + 7) % LAST.length];
      const company = COMPANY[(idx * 5 + 2) % COMPANY.length];
      const title = idx % 3 === 0 ? "CIO" : "CTO";

      const types = chain.slice(0, chain.indexOf(stage) + 1);
      // some message_sent leads got several follow-ups
      if (stage === "message_sent") for (let f = 0; f < idx % 3; f++) types.push("message_sent");

      const lastAgoMin = LAST_AGO[idx % LAST_AGO.length];
      const events = types.map((t, ti) => ({
        type: t,
        // earliest first; current stage event is `lastAgoMin` minutes ago
        at: new Date(now.getTime() - lastAgoMin * 60000 - (types.length - 1 - ti) * 86400000),
      }));

      const booked = stage === "booked";
      const meetingAt = booked ? new Date(now.getTime() + MEET_OFFSETS[bookedCount % MEET_OFFSETS.length] * 86400000) : null;
      if (booked) {
        meetingAt!.setHours(9 + (bookedCount % 8), (bookedCount % 2) * 30, 0, 0);
        bookedCount++;
      }

      leads.push({
        name, title, company, channel, stage,
        emailSuppressed: stage === "replied" || booked,
        linkedinUrl: "https://linkedin.com/in/" + slugify(name) + "-" + idx,
        email: mailOf(name, company),
        meetingAt,
        meetingEmail: booked ? name.toLowerCase().split(" ")[0] + ".personal@gmail.com" : null,
        events: { create: events },
      });
    }
  };

  // Outbound funnel
  add("outbound", "connection_sent", 24);
  add("outbound", "connected", 16);
  add("outbound", "message_sent", 14);
  add("outbound", "replied", 9);
  add("outbound", "booked", 7);
  // Inbound funnel
  add("inbound", "signed_up", 9);
  add("inbound", "emailed", 7);
  add("inbound", "replied", 5);
  add("inbound", "booked", 5);

  return leads;
}

export const POSTS: [string, string, string, string][] = [
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
