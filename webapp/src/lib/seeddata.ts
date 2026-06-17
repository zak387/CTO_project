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

export type SeedPost = { date: string; status: string; hook: string; note: string; body: string };

export const POSTS: SeedPost[] = [
  {
    date: "2026-06-22", status: "draft", hook: "The binary AI-ready question", note: "Educational · campaign opener",
    body: `In 2026, the moment of product discovery increasingly happens inside AI search, conversational commerce, and LLM-powered assistants before a buyer ever reaches your site.

There is now a binary question every ecommerce technology leader needs to answer: Can these AI experiences expose your products to this new buyer journey, or can't they?

If the answer is "not yet," your ecommerce business is not ready for the discovery platforms that are reshaping how buyers find products.

If you want to dive deeper on this topic, I'll be hosting a dinner with tech executives in ecommerce in NYC.

Check the link to join a small, vetted group of fellow ecommerce technology decision makers for a candid conversation about what "AI-ready" really means and what you can do this quarter to close the gap.`,
  },
  {
    date: "2026-06-24", status: "draft", hook: "Adobe study: AI traffic +693%", note: "Study · data-led hook",
    body: `Traffic to retail sites from AI tools like ChatGPT, Gemini and Perplexity grew 693% from last year.

Mind-blowing right?

What is even more astonishing is that the shoppers arriving from AI tools convert 31% more than any other source and spend 45% more time on site.

But not all ecommerce teams are capturing this value equally. The companies capturing this incremental traffic have invested in an AI forward tech stack and data infrastructure.

The CTO's and CIO's who are staying on top of the latest technology developments are the ones winning in this new product discovery era.

P.S If you want to dive deeper on this topic, I'll be hosting a dinner with tech executives in ecommerce in NYC.

Check the link to join a small, vetted group of fellow ecommerce technology decision makers for a candid conversation about what "AI-ready" really means and what you can do this quarter to close the gap.`,
  },
  {
    date: "2026-06-26", status: "draft", hook: "Dinner invite — direct CTA", note: "Direct CTA",
    body: `In case you missed it, I'm hosting a dinner in NYC next month for ecommerce technology leaders.

The premise is simple: Product discovery is moving into AI search and LLM assistants, and most teams have not mapped what it takes to stay visible there.

So, I'm putting together a group of 10-15 CTO's and CIO's in the ecommerce space to have a candid conversation about the future of the buyer's journey and what it means to be "AI-ready".

Drop your email in the link here and I'll send you more details:`,
  },
  {
    date: "2026-06-29", status: "draft", hook: "AI-ready isn't a chatbot", note: "Educational · myth-bust",
    body: `When most ecommerce tech teams hear "AI-ready," they start scoping a chatbot for their site.

While it is a form of progress, I do think that it's solving the wrong problem.

The AI that decides whether buyers find you lives in ChatGPT, Gemini, Perplexity and Google's AI overviews. It reads your product data from your feeds, your structured data, and your marketplace listings. From all of that it forms a view of what you sell, who it is for, and when to recommend it.

A chatbot on your own site does nothing to change that view. By the time someone lands on your site, the assistant has already made its recommendation.

So AI-readiness comes down to a question your team fully controls: when an assistant reads your catalog, can it understand your products well enough to recommend them for the right query?

P.S This is exactly what I'll be discussing over dinner with a group of CTO's and CIO's next month in NYC. Check the link to join.`,
  },
  {
    date: "2026-07-01", status: "draft", hook: "Study: bad product data breaks trust", note: "Study",
    body: `73% of B2B ecommerce buyers say inaccurate product content damages their trust in a brand.

For years that was a storefront or customer experience problem (a wrong image, a broken link, or an unintuitive website design).

But in the age of AI, I see this mainly as a discoverability problem.

When an AI assistant recommends products, it leans on your platform data to decide what fits a buyer's request. If your specs are wrong, missing or inconsistent, either the assistant skips your product, or it recommends the wrong one.

Either way the buyer loses trust, and so does the assistant that recommended you. Next time, it routes around you.

Auditing your product data is only one facet of what being "AI ready" means for ecommerce companies.

If you want to dive deeper, I'll be hosting a dinner with tech executives in ecommerce in NYC. Check the link to join:`,
  },
  {
    date: "2026-07-03", status: "draft", hook: "Dinner invite — the agenda", note: "Direct CTA",
    body: `LinkedIn connections, I'm bringing together 10 to 15 CTOs and CIOs in the ecommerce space for a private executive dinner in NYC next month.

A few topics we plan on discussing:

• What does "AI-ready" mean for a catalog as complex as yours?
• Where are buyers already discovering products through AI, and where is it still hype?
• What can you realistically fix this quarter, and what belongs on a longer roadmap?
• How are peers measuring whether AI even sees their products today?

If you are a CTO/CIO of an ecommerce company with a complex catalog or you know someone who is, check the link below:`,
  },
];

// Outbound outreach messages (Artefacts → Outreach messages). The LinkedIn
// sequence runs through Dripify; the email follow-ups are bulk nudges.
export type SeedMessage = {
  channel: string; label: string; step: number; meta: string;
  subject?: string; status: string; note?: string; body: string;
};

export const MESSAGES: SeedMessage[] = [
  {
    channel: "linkedin", label: "Message 1 — intro", step: 1, meta: "first message after they connect",
    status: "needs_review", note: "Adam's opener once a CTO/CIO accepts the connection.",
    body: `Hey %%first_name%%, great to connect!

I wanted to reach out because I'm hosting a tech leader dinner in NYC in late July with a dozen ecommerce executives (mainly CTO's and CIO's).

Given your profile, I would love to have you at the dinner. Is this something you would be interested in joining?

-Adam`,
  },
  {
    channel: "linkedin", label: "Message 2 — follow-up", step: 2, meta: "follow-up · with Calendly",
    status: "needs_review", note: "Swap [Calendly link] for Adam's real Calendly URL before this goes out.",
    body: `I'm hosting the dinner in Cathédrale NYC on July 21st. I have 10 tech executives in ecommerce committed so far.

I would still love to have you at the dinner. Here's my Calendly if you want to chat through more of the details: [Calendly link]`,
  },
  {
    channel: "email", label: "Outbound nudge — unresponsive leads", step: 1, meta: "bulk · day 10",
    subject: "One seat left with your name on it?", status: "scheduled",
    note: "Suppressed automatically once a lead replies on LinkedIn.",
    body: `Hi {{first}},

Circling back on the July 21 NYC dinner for ecommerce tech leaders. If you'd like the details, here's Adam's calendar for a quick intro call: {{calendly}}.

If it's not for you, no problem at all — just reply and I'll close the loop.`,
  },
  {
    channel: "email", label: "Inbound welcome — landing-page signups", step: 2, meta: "sent on signup",
    subject: "Thanks for signing up — let's get you the details", status: "needs_review",
    note: "The warm convert email for inbound signups.",
    body: `Hi {{first}},

Thanks for your interest in the July 21 dinner. The best next step is a short call with Adam to walk you through it and see if it's a fit — grab a time here: {{calendly}}.

Looking forward to it,
The SAWA team`,
  },
];
