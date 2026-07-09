// Shared seed data for the prisma seed script and the content-reseed endpoint.

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

const OUT_CHAIN = ["connection_sent", "replied", "booked"];
const IN_CHAIN = ["signed_up", "booked"];
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

  // Outbound funnel — Connected/Message Sent folded into the Connection Sent
  // bucket now that those stages are dropped (24 + 16 + 14 = 54).
  add("outbound", "connection_sent", 54);
  add("outbound", "replied", 9);
  add("outbound", "booked", 7);
  // Inbound funnel — Emailed/Replied folded into Signed Up now those stages are
  // dropped (9 + 7 + 5 = 21).
  add("inbound", "signed_up", 21);
  add("inbound", "booked", 5);

  return leads;
}

export type SeedPost = { date: string; status: string; hook: string; note: string; body: string };

export const POSTS: SeedPost[] = [
  // ── Week 1 (Jun 16–18) ──────────────────────────────────────────────
  {
    date: "2026-06-16", status: "live", hook: "Stop buying growth — build it", note: "Week 1 · Post 1 · campaign opener",
    body: `For a decade, enterprise ecommerce has bought its growth: more traffic, more campaigns, more discounting.

Those returns are now flattening, as AI disrupts ecommerce in areas where most boards aren't looking.

Now a buyer's AI does three things in sequence. It finds your products, evaluates them, then it makes a recommendation.

In 2026 ecommerce companies should be maniacally focused on measuring the right metrics and completing critical, platform-first initiatives.

These are not marketing outcomes. They are engineering outcomes, and unlike media spend, they compound.

The complex businesses outgrowing their category in 2026 have stopped treating growth as something they buy and started treating it as something they build.

If you are a technology leader in this ecommerce space, come join us for a candid conversation over a July dinner in NYC with a small, vetted group of ecommerce decision makers. We will discuss how to best position your platform's engineering to unlock your next stage of growth.

Link here: https://tech-leader-dinner.vercel.app`,
  },
  {
    date: "2026-06-17", status: "live", hook: "The binary AI-ready question", note: "Week 1 · Post 2",
    body: `In 2026, the moment of product discovery increasingly happens inside AI search, conversational commerce, and LLM-powered assistants before a buyer ever reaches your site.

There is now a binary question every ecommerce technology leader needs to answer: Can these AI experiences recommend your products to this new buyer journey, or can't they?

If the answer is "not yet," your ecommerce business is not ready for the AI platforms that are reshaping the new ecommerce purchase funnel.

If you want to dive deeper on this topic, I'll be hosting a dinner with tech executives in ecommerce in NYC.

Check the link to join a small, vetted group of fellow ecommerce technology decision makers for a candid conversation about what "AI-ready" really means and what you can do this quarter to close the gap.

Link here: https://tech-leader-dinner.vercel.app`,
  },
  {
    date: "2026-06-18", status: "live", hook: "AI retail traffic +693%", note: "Week 1 · Post 3 · data-led hook",
    body: `Traffic to retail sites from AI tools like ChatGPT, Gemini and Perplexity grew 693% from last year.

Surprising, right?

While I expected growth, it was not to this extent.

What is even more astonishing is that the shoppers arriving from AI tools convert 31% more than any other source and spend 45% more time on site.

But not all ecommerce teams are capturing this value equally. The companies capturing this incremental traffic have invested in an AI-ready orchestration layer.

The CTOs and CIOs who are staying on top of the latest technology developments are the ones winning in this new product discovery era.

P.S. If you want to dive deeper on this topic, I'll be hosting a dinner with tech executives in ecommerce in NYC.

Check the link to join a small, vetted group of fellow ecommerce technology decision makers for a candid conversation about what "AI-ready" really means and what you can do this quarter to close the gap.

Link here: https://tech-leader-dinner.vercel.app`,
  },
  // ── Week 2 (Jun 23–25) ──────────────────────────────────────────────
  {
    date: "2026-06-23", status: "live", hook: "AI-ready isn't a chatbot", note: "Week 2 · Post 4 · myth-bust",
    body: `When most ecommerce tech teams hear "AI-ready," they start scoping a chatbot for their site.

While it is a form of progress, I do think that it's solving the wrong problem.

The AI that decides whether buyers find you lives in ChatGPT, Gemini, Perplexity and Google's AI overviews. It reads your product data from your feeds, your structured data, and your marketplace listings. From all of that it forms a view of what you sell, who it is for, and when to recommend it.

A chatbot on your own site does nothing to change that view. By the time someone lands on your site, the assistant has already made its recommendation.

So AI-readiness comes down to a question your team fully controls: when an assistant reads your catalog, can it understand your products well enough to recommend them for the right query?

For a simple catalog, that is manageable. For a complex, omnichannel catalog, it's more challenging. Complex catalogs have to deal with thousands of SKUs, deep variant trees, fitment and compatibility rules, and attributes stored across different systems.

When the search assistant reads through unstructured data, it either guesses or moves on to a competitor it understands better, ultimately hurting your discoverability.

So, is a chatbot helpful in the age of AI? Perhaps!

But if I were a leader in an ecommerce company, I would spend extra time on the new AI buyer journey and the requisite data layer to get the product catalog recommended.

P.S. This is exactly what I'll be discussing over dinner with a group of CTOs and CIOs next month in NYC. If you want to dive deeper on this topic, check the link to join a small, vetted group of fellow ecommerce technology decision makers for a candid conversation about what "AI-ready" really means and what you can do this quarter to close the gap.`,
  },
  {
    date: "2026-06-24", status: "live", hook: "Bad product data breaks trust", note: "Week 2 · Post 5 · study",
    body: `73% of B2B ecommerce buyers say inaccurate product content damages their trust in a brand.

For years that was a storefront or customer experience problem (a wrong image, a broken link, or an unintuitive website design).

But in the age of AI, I see this mainly as a discoverability problem.

When an AI assistant recommends products, it leans on your platform data to decide what fits a buyer's request. If your specs are wrong, missing or inconsistent, one of two things will happen. Either the assistant will skip your product because it cannot confirm the details, or it will recommend the wrong product for the searched use case.

Either way the buyer loses trust, and so does the assistant that recommended you. Next time, it will route around you.

Although this sounds trivial, making the wrong product recommendation is widespread. I just came across a 2025 survey from McKinsey that cited inaccurate product recommendations as the most experienced issue with AI search.

This inaccuracy is even more pronounced in a complex, omnichannel catalog. One missing attribute here, one inconsistent unit of measure there, or one spec that disagrees between your site and your marketplace feed, can all cause inaccurate product recommendations.

Auditing your product data is only one facet of what being "AI-ready" means for ecommerce companies.

If you want to dive deeper on this topic, I'll be hosting a dinner with tech executives in ecommerce in NYC. Check the link to join a small, vetted group of fellow technology decision makers for a candid conversation about the future of AI in ecommerce:`,
  },
  {
    date: "2026-06-25", status: "live", hook: "Dinner invite — the agenda", note: "Week 2 · Post 6 · direct CTA",
    body: `I'm bringing together 10 to 15 CTOs and CIOs in the ecommerce space for a private executive dinner in NYC next month.

A few topics we plan on discussing:

• What does "AI-ready" mean for a catalog as complex as yours?
• Where are buyers already discovering products through AI, and where is it still hype?
• What can you realistically fix this quarter, and what belongs on a longer roadmap?
• How are peers measuring whether AI even sees their products today?

If you are a CTO/CIO of an ecommerce company with a complex catalog or you know someone who is, check the link below:`,
  },
  // ── Week 3 (Jun 30 – Jul 2) ─────────────────────────────────────────
  {
    date: "2026-06-30", status: "live", hook: "Spend on the data layer, not ads", note: "Week 3 · Post 7 · Adam approved · @-mention Net Solutions",
    body: `For most of ecommerce history, every dollar spent has gone towards getting traffic to your site, then trying to convert it to a purchase.

But my view is that in 2026, companies need to spend a little differently. And I say this as someone with deep media expertise.

Instead of spending more on buyer acquisition (that is, more ads, more traffic, more web conversion), companies should spend more on future-proofing the ecommerce data/orchestration layer, the data feeds infrastructure, and broader ecommerce workflows.

Just this year so far, roughly 68% of US searches ended without a single click. So, increasingly, the browsing is done by the buyer's AI, before the buyer is involved at all.

So investing in "more ads" or "better ads" on its own does not make sense. What does make sense is to target the AI-driven and machine-guided experiences that are recommending your products, which is a big engineering effort:

• Wire up more market-ready monitoring
• Adopt machine-readable feed standards
• Build a true orchestration layer

If you want to be part of a peer-led discussion around the most innovative initiatives you can take as a technology leader in ecommerce, then come join the dinner I am running in conjunction with our host, @Net Solutions, on July 22 in NYC's Union Square area.

Feel free to message me directly if you want to join or know someone who could be interested in the dinner.

Start the conversation here: https://tech-leader-dinner.vercel.app/?utm_source=chameleon-collective&utm_medium=referral&utm_campaign=cto-dinner`,
  },
  {
    date: "2026-07-01", status: "live", hook: "The numbers boards are missing", note: "Week 3 · Post 8 · Adam approved · @-mention Net Solutions",
    body: `The data on AI and algorithmic ecommerce discovery is moving faster than most boards realize.

A few purchase-behavior numbers I keep coming back to:

• McKinsey's B2B Pulse found that 65%+ of B2B companies now offer ecommerce capabilities, up from less than 50% just three years ago
• Use of generative AI for online shopping surged to 51% (34% YoY change)
• Bain projects AI agent-driven purchases will make up 15 to 25% of US ecommerce by 2030
• Juniper puts agentic commerce spend at roughly $8B this year, on the way to $1.5 trillion globally by 2030

But what is less evident in these stats, and what I can confirm from my experience advising ecommerce companies, is that very few engineering teams actually understand the impact of this new buyer journey and the new orchestration and data layers it requires — and even fewer have taken action towards building the right technology infrastructure to support it.

That's why I'm moving the discussion to a deeper level and assembling a vetted group of ecommerce technology leaders. I'm running a dinner in NYC's East Village on July 22, generously hosted by @Net Solutions, to talk about what makes ecommerce companies "AI-ready" and what initiatives they can take this quarter to close the gap.

If you are a tech executive in ecommerce or you know someone who is, feel free to message me.

Link here for more details: https://tech-leader-dinner.vercel.app/?utm_source=chameleon-collective&utm_medium=referral&utm_campaign=cto-dinner`,
  },
  {
    date: "2026-07-02", status: "live", hook: "Dinner — East Village agenda", note: "Week 3 · Post 9 · Adam approved",
    body: `On July 22 in NYC's trendy East Village, we are bringing together a small, vetted group of technology decision makers in the ecommerce space for an invite-only executive dinner hosted by Net Solutions.

A few topics we plan on discussing:

1) What does "AI-ready" mean for the different layers of complexity in your ecommerce world?
2) Where are you seeing the need for replatforming and how does this impact your other systems?
3) What can you realistically fix in your orchestration and data layers this quarter, and what belongs on a longer roadmap?
4) How are your peers measuring whether AI even sees their products today?

What topic would you like to hear more about?

If you are a technology leader (CTO, CIO, etc.) of an ecommerce company with orchestration/data complexity, high-SKU counts, or complex product feeds, or you know someone who is, check the link below: https://lnkd.in/eYh5N4ew

And thank you, Net Solutions, for creating this peer-led environment, away from the shows and the endless sales pitches!`,
  },
  // ── Week 4 (Jul 7–9) — this week ────────────────────────────────────
  {
    date: "2026-07-07", status: "live", hook: "Would you know if an AI bought?", note: "Week 4 · Post 10 · Adam approved",
    body: `Here's a question for ecommerce teams in 2026: if an AI agent bought from you today, would you even know?

Most orchestration layers were built for a human clicking through to a product from a search result. But a growing number of AI assistants and agents strip critical info on the way in. The visit lands blind to your analytics, or it doesn't show up at all.

So the channel that is growing fastest (AI-driven discovery) is often the one you have the least visibility into.

That creates a dangerous blind spot. Whether you are losing share inside ChatGPT, Gemini and Perplexity, or winning share, your product/commerce analytics look roughly the same either way.

Before you invest in being "AI-ready," there's a prior step most teams skip, which is instrumenting for it. Can you measure whether an assistant is reading your product's attributes, recommending your products, and routing buyers to you? Forrester tells us to have data control in your orchestration layer [1].

Right now most teams can't see it, so they can't manage it.

This is one of the topics I'm most looking forward to discussing over dinner with Net Solutions and a group of CTOs and CIOs in NYC on July 22.

If you are a tech executive in ecommerce or you know someone who is, feel free to message me to join the dinner.

Link here for more details: https://tech-leader-dinner.vercel.app/?utm_source=chameleon-collective&utm_medium=referral&utm_campaign=cto-dinner
[1] Source: https://www.forrester.com/blogs/the-state-of-agentic-commerce-in-mid-2026/`,
  },
  {
    date: "2026-07-08", status: "live", hook: "The buyer journey, before & after", note: "Week 4 · Post 11 · Adam approved · infographic idea pending",
    body: `The ecommerce buyer journey just changed shape. Here it is, before and after.

Before:
• A buyer searches Google.
• They get a page of links.
• They click into a few sites, including yours.
• They browse your catalog, read the product page, and compare on their own.
• They add to cart and check out on your storefront.

Every step happened on your site. Your merchandising, your design and your copy did the selling.

After:
• A buyer asks ChatGPT, Gemini or Perplexity.
• The assistant reads product data across product attributes, feeds, and marketplaces.
• It compares the options against what the buyer asked for.
• It recommends one or two products.
• In a growing number of cases, it completes the purchase.

Most of that happens before anyone loads your storefront. Sometimes no one loads it at all.

Look at where the decision gets made now. It moved off your website and into a model reading your product feed.

Whether an assistant recommends you comes down to your data layer: clean attributes, consistent specs, structured feeds, fitment and compatibility rules your systems can serve on request.

That is the shift most teams have not budgeted for. The buyer journey became an engineering problem, and your product data is the new storefront.

If you want to dive deeper on this topic, I'll be hosting a dinner with tech executives in ecommerce in NYC. Check the link to join a small, vetted group of fellow ecommerce technology decision makers for a candid conversation about what "AI-ready" really means and what you can do this quarter to close the gap.

Link here: https://tech-leader-dinner.vercel.app/?utm_source=chameleon-collective&utm_medium=referral&utm_campaign=cto-dinner`,
  },
  {
    date: "2026-07-09", status: "draft", hook: "Dinner agenda (HOLD)", note: "Week 4 · Post 12 · ON HOLD — do not schedule yet. Duplicate of Post 9's agenda.",
    body: `On July 22 in NYC's trendy East Village, we are bringing together a small, vetted group of technology decision makers in the ecommerce space for an invite-only executive dinner hosted by Net Solutions.

A few topics we plan on discussing:

1) What does "AI-ready" mean for the different layers of complexity in your ecommerce world?
2) Where are you seeing the need for replatforming and how does this impact your other systems?
3) What can you realistically fix in your orchestration and data layers this quarter, and what belongs on a longer roadmap?
4) How are your peers measuring whether AI even sees their products today?

What topic would you like to hear more about?

If you are a technology leader (CTO, CIO, etc.) of an ecommerce company with orchestration/data complexity, high-SKU counts, or complex product feeds, or you know someone who is, check the link below: https://lnkd.in/eYh5N4ew

And thank you, Net Solutions, for creating this peer-led environment, away from the shows and the endless sales pitches!`,
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
    body: `I'm hosting the dinner in Cathédrale NYC on July 22nd. I have 10 tech executives in ecommerce committed so far.

I would still love to have you at the dinner. Here's my Calendly if you want to chat through more of the details: [Calendly link]`,
  },
];
