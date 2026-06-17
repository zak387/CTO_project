import { NextResponse } from "next/server";
import { handleDripify } from "@/lib/reconcile";

// Dripify (Pro) points its campaign webhooks here — ONE trigger per webhook.
// Two facts about Dripify's real payload drive this handler (see CLAUDE.md §7):
//   1. It carries NO event-type field. Which transition fired is only knowable
//      from the URL you paste, so we read it from `?event=` on that URL.
//      A bare URL (no ?event=) defaults to "replied" — the most important
//      signal (the "⚑ Waiting on you" hook).
//   2. It uses its own field names (First name, LinkedIn profile URL, …). The
//      exact JSON keys aren't documented, so we map tolerantly across the
//      likely spellings AND log every raw payload — the first real fire reveals
//      the true shape so we can tighten this.

// Friendly ?event= values → the pipeline stage event handleDripify expects.
const EVENT_ALIASES: Record<string, string> = {
  reply: "replied",
  replied: "replied",
  response: "replied",
  invite: "connection_sent",
  invite_sent: "connection_sent",
  connection: "connection_sent",
  connection_sent: "connection_sent",
  sent: "connection_sent",
  accepted: "connected",
  connected: "connected",
  message: "message_sent",
  message_sent: "message_sent",
};

// First present, non-empty value among candidate keys (case-insensitive).
function pick(obj: Record<string, unknown>, keys: string[]): string | undefined {
  const lower: Record<string, unknown> = {};
  for (const k of Object.keys(obj)) lower[k.toLowerCase()] = obj[k];
  for (const k of keys) {
    const v = lower[k.toLowerCase()];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

// A plain GET so you can confirm the endpoint is live from a browser.
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "dripify webhook receiver" });
}

export async function POST(req: Request) {
  // The event is encoded in the URL, not the body.
  const rawEvent = (new URL(req.url).searchParams.get("event") ?? "").toLowerCase();
  const event = EVENT_ALIASES[rawEvent] ?? "replied";

  // Read the body defensively — Dripify normally sends JSON, but tolerate form posts.
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    try {
      const form = await req.formData();
      body = Object.fromEntries(form.entries());
    } catch {
      body = {};
    }
  }

  // Log the raw payload so the first real Dripify fire reveals its true field names.
  console.log("[dripify webhook]", rawEvent || "(no event)", JSON.stringify(body));

  // Map Dripify's fields into the shape handleDripify expects. `name` is built
  // from first+last when no single name field is present.
  const first = pick(body, ["first_name", "firstname", "first"]);
  const last = pick(body, ["last_name", "lastname", "last"]);
  const name =
    pick(body, ["name", "full_name", "fullname"]) ||
    [first, last].filter(Boolean).join(" ") ||
    undefined;

  const linkedinUrl = pick(body, [
    "linkedin_url",
    "linkedinurl",
    "linkedin_profile_url",
    "profile_url",
    "profileurl",
    "profile_link",
    "profilelink",
    "linkedin",
  ]);

  if (!linkedinUrl) {
    // The join key is missing — handleDripify will fall back to name+company or
    // drop it to the review tray. Flag it so we notice in the logs.
    console.warn("[dripify webhook] no LinkedIn URL in payload — will need review");
  }

  const result = await handleDripify({
    event,
    linkedin_url: linkedinUrl ?? "",
    name,
    title: pick(body, ["title", "job_title", "jobtitle", "position", "occupation"]),
    company: pick(body, ["company", "company_name", "companyname", "organization"]),
    email: pick(body, ["email", "email_address", "emailaddress"]),
  });
  return NextResponse.json(result);
}
